// 腾讯云 Serverless 入口文件
const path = require('path');

// 设置环境变量
process.env.NODE_ENV = 'production';

// 引入服务器应用
const app = require('./server/index.js');

module.exports = app;
