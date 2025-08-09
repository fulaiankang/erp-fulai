const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'clothing-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
    }
  }
});

// Get all products with their variants
router.get('/', authenticateToken, (req, res) => {
  const { page = 1, limit = 20, search = '', color = '', size = '' } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      p.*,
      u.username as created_by_username,
      GROUP_CONCAT(
        json_object(
          'id', pv.id,
          'size', pv.size,
          'color', pv.color,
          'quantity', pv.quantity
        )
      ) as variants,
      SUM(pv.quantity) as total_quantity
    FROM products p 
    LEFT JOIN users u ON p.created_by = u.id 
    LEFT JOIN product_variants pv ON p.id = pv.product_id
    WHERE 1=1
  `;
  let params = [];

  if (search) {
    query += ` AND (p.serial_number LIKE ? OR p.composition LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (color) {
    query += ` AND pv.color LIKE ?`;
    params.push(`%${color}%`);
  }

  if (size) {
    query += ` AND pv.size = ?`;
    params.push(size);
  }

  query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, items) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Parse variants JSON
    const processedItems = items.map(item => ({
      ...item,
      variants: item.variants ? JSON.parse(`[${item.variants}]`) : []
    }));

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT p.id) as total FROM products p LEFT JOIN product_variants pv ON p.id = pv.product_id WHERE 1=1';
    let countParams = [];

    if (search) {
      countQuery += ` AND (p.serial_number LIKE ? OR p.composition LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (color) {
      countQuery += ` AND pv.color LIKE ?`;
      countParams.push(`%${color}%`);
    }

    if (size) {
      countQuery += ` AND pv.size = ?`;
      countParams.push(size);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        items: processedItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Create new product with variants
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  const { serial_number, price, composition, variants } = req.body;

  if (!serial_number || !price || !variants) {
    return res.status(400).json({ 
      error: '货号、价格和变体信息为必填项' 
    });
  }

  let parsedVariants;
  try {
    parsedVariants = JSON.parse(variants);
  } catch (error) {
    return res.status(400).json({ error: '变体数据格式错误' });
  }

  if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
    return res.status(400).json({ error: '至少需要一个变体' });
  }

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Create product
    db.run(
      `INSERT INTO products (serial_number, image_url, price, composition, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [serial_number, image_url, parseFloat(price), composition, req.user.id],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: '货号已存在' });
          }
          return res.status(500).json({ error: '数据库错误' });
        }

        const productId = this.lastID;

        // Create variants
        const variantPromises = parsedVariants.map(variant => {
          return new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO product_variants (product_id, size, color, quantity)
               VALUES (?, ?, ?, ?)`,
              [productId, variant.size, variant.color, parseInt(variant.quantity)],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });

        Promise.all(variantPromises)
          .then(() => {
            db.run('COMMIT');
            
            // Get the created product with variants
            db.get(
              `SELECT p.*, 
                     GROUP_CONCAT(
                       json_object(
                         'id', pv.id,
                         'size', pv.size,
                         'color', pv.color,
                         'quantity', pv.quantity
                       )
                     ) as variants
               FROM products p 
               LEFT JOIN product_variants pv ON p.id = pv.product_id 
               WHERE p.id = ?
               GROUP BY p.id`,
              [productId],
              (err, product) => {
                if (err) {
                  return res.status(500).json({ error: '数据库错误' });
                }
                
                product.variants = product.variants ? JSON.parse(`[${product.variants}]`) : [];
                res.status(201).json({ product });
              }
            );
          })
          .catch(err => {
            db.run('ROLLBACK');
            res.status(500).json({ error: '创建变体失败' });
          });
      }
    );
  });
});

// Get single product with variants
router.get('/:id', authenticateToken, (req, res) => {
  db.get(
    `SELECT p.*, u.username as created_by_username,
            GROUP_CONCAT(
              json_object(
                'id', pv.id,
                'size', pv.size,
                'color', pv.color,
                'quantity', pv.quantity
              )
            ) as variants
     FROM products p 
     LEFT JOIN users u ON p.created_by = u.id 
     LEFT JOIN product_variants pv ON p.id = pv.product_id 
     WHERE p.id = ?
     GROUP BY p.id`,
    [req.params.id],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      if (!product) {
        return res.status(404).json({ error: '商品未找到' });
      }
      
      product.variants = product.variants ? JSON.parse(`[${product.variants}]`) : [];
      res.json({ product });
    }
  );
});

// Update product and variants
router.put('/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { serial_number, price, composition, variants } = req.body;
  const productId = req.params.id;

  let parsedVariants;
  try {
    parsedVariants = variants ? JSON.parse(variants) : null;
  } catch (error) {
    return res.status(400).json({ error: '变体数据格式错误' });
  }

  // Get current product
  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, currentProduct) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!currentProduct) {
      return res.status(404).json({ error: '商品未找到' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : currentProduct.image_url;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Update product
      db.run(
        `UPDATE products 
         SET serial_number = ?, image_url = ?, price = ?, composition = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          serial_number || currentProduct.serial_number,
          image_url,
          price !== undefined ? parseFloat(price) : currentProduct.price,
          composition !== undefined ? composition : currentProduct.composition,
          productId
        ],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: '货号已存在' });
            }
            return res.status(500).json({ error: '数据库错误' });
          }

          if (parsedVariants) {
            // Delete existing variants
            db.run('DELETE FROM product_variants WHERE product_id = ?', [productId], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '删除旧变体失败' });
              }

              // Create new variants
              const variantPromises = parsedVariants.map(variant => {
                return new Promise((resolve, reject) => {
                  db.run(
                    `INSERT INTO product_variants (product_id, size, color, quantity)
                     VALUES (?, ?, ?, ?)`,
                    [productId, variant.size, variant.color, parseInt(variant.quantity)],
                    function(err) {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                });
              });

              Promise.all(variantPromises)
                .then(() => {
                  db.run('COMMIT');
                  
                  // Get updated product
                  db.get(
                    `SELECT p.*, 
                           GROUP_CONCAT(
                             json_object(
                               'id', pv.id,
                               'size', pv.size,
                               'color', pv.color,
                               'quantity', pv.quantity
                             )
                           ) as variants
                     FROM products p 
                     LEFT JOIN product_variants pv ON p.id = pv.product_id 
                     WHERE p.id = ?
                     GROUP BY p.id`,
                    [productId],
                    (err, product) => {
                      if (err) {
                        return res.status(500).json({ error: '数据库错误' });
                      }
                      
                      product.variants = product.variants ? JSON.parse(`[${product.variants}]`) : [];
                      res.json({ product });
                    }
                  );
                })
                .catch(err => {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: '更新变体失败' });
                });
            });
          } else {
            db.run('COMMIT');
            res.json({ message: '商品更新成功' });
          }
        }
      );
    });
  });
});

// Delete product and all variants
router.delete('/:id', authenticateToken, (req, res) => {
  const productId = req.params.id;

  // Get product to delete associated image
  db.get('SELECT image_url FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!product) {
      return res.status(404).json({ error: '商品未找到' });
    }

    // Delete product (variants will be deleted due to CASCADE)
    db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      // Delete associated image file
      if (product.image_url) {
        const imagePath = path.join(uploadDir, path.basename(product.image_url));
        fs.unlink(imagePath, (err) => {
          if (err) console.log('Could not delete image file:', err);
        });
      }

      res.json({ message: '商品删除成功' });
    });
  });
});

// Get product statistics
router.get('/stats/summary', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_products FROM products',
    'SELECT SUM(pv.quantity) as total_quantity FROM product_variants pv',
    'SELECT SUM(pv.quantity * p.price) as total_value FROM product_variants pv JOIN products p ON pv.product_id = p.id',
    'SELECT COUNT(DISTINCT pv.color) as unique_colors FROM product_variants pv',
    'SELECT COUNT(DISTINCT pv.size) as unique_sizes FROM product_variants pv'
  ];

  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(results => {
    res.json({
      totalProducts: results[0].total_products || 0,
      totalQuantity: results[1].total_quantity || 0,
      totalValue: results[2].total_value || 0,
      uniqueColors: results[3].unique_colors || 0,
      uniqueSizes: results[4].unique_sizes || 0
    });
  }).catch(err => {
    res.status(500).json({ error: '数据库错误' });
  });
});

module.exports = router;
