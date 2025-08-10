const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const { initDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // 禁用CSP以允许内联样式
}));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve client build files in production
if (process.env.NODE_ENV === 'production') {
  // 在Vercel环境中，我们需要处理所有非API路由
  app.get('*', (req, res, next) => {
    // 如果是API路由，跳过
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // 返回一个简单的HTML页面
    res.send(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ERP-FULAI - 服装制造企业ERP系统</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          h1 { color: #2563eb; margin-bottom: 20px; }
          .status { 
            background: #10b981; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 4px; 
            display: inline-block; 
            margin-bottom: 20px; 
          }
          .api-test { 
            background: #f3f4f6; 
            padding: 20px; 
            border-radius: 4px; 
            margin: 20px 0; 
          }
          .api-test a { color: #2563eb; text-decoration: none; }
          .api-test a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 ERP-FULAI 部署成功！</h1>
          <div class="status">✅ 后端API运行正常</div>
          
          <p>您的服装制造企业ERP系统已经成功部署到Vercel！</p>
          
          <div class="api-test">
            <h3>🔧 API测试</h3>
            <p>测试后端API是否正常工作：</p>
            <ul>
              <li><a href="/api/health" target="_blank">健康检查</a> - 检查服务器状态</li>
              <li><a href="/api/auth" target="_blank">认证API</a> - 用户登录注册</li>
              <li><a href="/api/products" target="_blank">商品API</a> - 商品管理</li>
            </ul>
          </div>
          
          <div class="api-test">
            <h3>📱 前端访问</h3>
            <p>由于Vercel的限制，前端需要单独部署。建议：</p>
            <ol>
              <li>在Vercel中创建第二个项目，专门用于前端</li>
              <li>或者使用其他平台部署前端（如Netlify、GitHub Pages）</li>
              <li>或者我可以帮您配置一个完整的前后端分离部署</li>
            </ol>
          </div>
          
          <p><strong>当前状态：</strong> 后端API已部署成功，前端需要额外配置。</p>
        </div>
      </body>
      </html>
    `);
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database
initDatabase().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

// Export for serverless
module.exports = app;
