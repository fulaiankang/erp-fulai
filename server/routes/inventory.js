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

// Get all inventory items
router.get('/', authenticateToken, (req, res) => {
  const { page = 1, limit = 20, search = '', color = '', size = '' } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT i.*, u.username as created_by_username 
    FROM inventory i 
    LEFT JOIN users u ON i.created_by = u.id 
    WHERE 1=1
  `;
  let params = [];

  if (search) {
    query += ` AND (i.serial_number LIKE ? OR i.composition LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (color) {
    query += ` AND i.color LIKE ?`;
    params.push(`%${color}%`);
  }

  if (size) {
    query += ` AND i.size = ?`;
    params.push(size);
  }

  query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM inventory WHERE 1=1';
    let countParams = [];

    if (search) {
      countQuery += ` AND (serial_number LIKE ? OR composition LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (color) {
      countQuery += ` AND color LIKE ?`;
      countParams.push(`%${color}%`);
    }

    if (size) {
      countQuery += ` AND size = ?`;
      countParams.push(size);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        items,
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

// Create new inventory item
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  const { serial_number, size, color, quantity, price, composition } = req.body;

  if (!serial_number || !size || !color || !quantity || !price) {
    return res.status(400).json({ 
      error: 'Serial number, size, color, quantity, and price are required' 
    });
  }

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    `INSERT INTO inventory (serial_number, image_url, size, color, quantity, price, composition, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [serial_number, image_url, size, color, parseInt(quantity), parseFloat(price), composition, req.user.id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Serial number already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      // Get the created item
      db.get(
        'SELECT * FROM inventory WHERE id = ?',
        [this.lastID],
        (err, item) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ item });
        }
      );
    }
  );
});

// Get single inventory item
router.get('/:id', authenticateToken, (req, res) => {
  db.get(
    'SELECT i.*, u.username as created_by_username FROM inventory i LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ?',
    [req.params.id],
    (err, item) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json({ item });
    }
  );
});

// Update inventory item
router.put('/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { serial_number, size, color, quantity, price, composition } = req.body;
  const itemId = req.params.id;

  // Get current item
  db.get('SELECT * FROM inventory WHERE id = ?', [itemId], (err, currentItem) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!currentItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : currentItem.image_url;

    db.run(
      `UPDATE inventory 
       SET serial_number = ?, image_url = ?, size = ?, color = ?, quantity = ?, price = ?, composition = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        serial_number || currentItem.serial_number,
        image_url,
        size || currentItem.size,
        color || currentItem.color,
        quantity !== undefined ? parseInt(quantity) : currentItem.quantity,
        price !== undefined ? parseFloat(price) : currentItem.price,
        composition !== undefined ? composition : currentItem.composition,
        itemId
      ],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Serial number already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        // Get updated item
        db.get(
          'SELECT * FROM inventory WHERE id = ?',
          [itemId],
          (err, item) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ item });
          }
        );
      }
    );
  });
});

// Delete inventory item
router.delete('/:id', authenticateToken, (req, res) => {
  const itemId = req.params.id;

  // Get item to delete associated image
  db.get('SELECT image_url FROM inventory WHERE id = ?', [itemId], (err, item) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.run('DELETE FROM inventory WHERE id = ?', [itemId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Delete associated image file
      if (item.image_url) {
        const imagePath = path.join(uploadDir, path.basename(item.image_url));
        fs.unlink(imagePath, (err) => {
          if (err) console.log('Could not delete image file:', err);
        });
      }

      res.json({ message: 'Item deleted successfully' });
    });
  });
});

// Get inventory statistics
router.get('/stats/summary', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_items FROM inventory',
    'SELECT SUM(quantity) as total_quantity FROM inventory',
    'SELECT SUM(quantity * price) as total_value FROM inventory',
    'SELECT COUNT(DISTINCT color) as unique_colors FROM inventory',
    'SELECT COUNT(DISTINCT size) as unique_sizes FROM inventory'
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
      totalItems: results[0].total_items || 0,
      totalQuantity: results[1].total_quantity || 0,
      totalValue: results[2].total_value || 0,
      uniqueColors: results[3].unique_colors || 0,
      uniqueSizes: results[4].unique_sizes || 0
    });
  }).catch(err => {
    res.status(500).json({ error: 'Database error' });
  });
});

module.exports = router;
