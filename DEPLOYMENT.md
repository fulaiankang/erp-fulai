# Deployment Guide for ERP FULAI

This guide provides multiple deployment options for your clothing inventory management system, with specific recommendations for deployment in China.

## 🚀 Quick Deployment (Recommended for China)

### Option 1: Railway (Fastest & Easiest)

Railway is recommended for users in China as it provides good connectivity and supports Node.js applications out of the box.

1. **Sign up for Railway**: Visit [railway.app](https://railway.app)

2. **Connect GitHub**: Link your GitHub account and import this repository

3. **Configure Environment Variables** in Railway dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your_super_secure_random_string_here
   CLIENT_URL=https://your-app-name.railway.app
   ```

4. **Deploy**: Railway will automatically build and deploy your application

5. **Access**: Your app will be available at `https://your-app-name.railway.app`

**Estimated setup time**: 5-10 minutes

### Option 2: Vercel (Frontend) + Railway (Backend)

Split deployment for better performance:

1. **Deploy Backend to Railway** (follow steps above)
2. **Deploy Frontend to Vercel**:
   - Connect repository to [vercel.com](https://vercel.com)
   - Set build command: `cd client && npm run build`
   - Set output directory: `client/dist`
   - Set environment variable: `VITE_API_URL=https://your-railway-backend.railway.app`

## 🏗 Local Development Setup

```bash
# 1. Clone and install
git clone <your-repo-url>
cd ERP-FULAI
npm run install-all

# 2. Setup environment
cp server/.env.example server/.env
# Edit server/.env with your settings

# 3. Start development
npm run dev
```

Access at: http://localhost:5173

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# 1. Create environment file
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
echo "CLIENT_URL=http://localhost:5000" >> .env

# 2. Build and run
docker-compose up -d

# 3. Access application
open http://localhost:5000
```

### Using Docker Only

```bash
# Build image
docker build -t erp-fulai .

# Run container
docker run -d \
  --name erp-fulai \
  -p 5000:5000 \
  -e JWT_SECRET=your_secret_here \
  -e CLIENT_URL=http://localhost:5000 \
  -v erp_data:/app/server/database \
  -v erp_uploads:/app/server/uploads \
  erp-fulai
```

## ☁️ Cloud Deployment Options

### For China-Based Deployment:

1. **Railway** (Recommended)
   - ✅ Good connectivity in China
   - ✅ Easy setup
   - ✅ Automatic SSL
   - ✅ Automatic deployments from GitHub

2. **Tencent Cloud** (Chinese Platform)
   - ✅ Local presence in China
   - ✅ Good for Chinese users
   - ⚠️ Requires more manual setup

3. **Alibaba Cloud**
   - ✅ Chinese cloud provider
   - ✅ Excellent China connectivity
   - ⚠️ More complex setup

### For Global Deployment:

1. **Vercel + PlanetScale**
2. **Netlify + Railway**
3. **AWS + RDS**
4. **DigitalOcean Droplet**

## 🔧 Production Configuration

### Environment Variables

Create a `.env` file in the server directory:

```bash
# Required
NODE_ENV=production
JWT_SECRET=your_super_secure_random_string_minimum_32_characters
CLIENT_URL=https://yourdomain.com

# Optional
DB_PATH=./database/erp.db
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5MB
PORT=5000
```

### Generate Secure JWT Secret

```bash
# Generate a secure secret
openssl rand -base64 32
```

### Security Checklist

- [ ] Change default admin credentials (admin/admin123)
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS for your domain
- [ ] Regular database backups
- [ ] Monitor application logs
- [ ] Update dependencies regularly

## 📊 Monitoring & Maintenance

### Health Check

Your application includes a health check endpoint:
```
GET /api/health
```

### Database Backup

```bash
# Backup database
cp server/database/erp.db backups/erp-$(date +%Y%m%d-%H%M%S).db

# Restore from backup
cp backups/erp-TIMESTAMP.db server/database/erp.db
```

### Log Monitoring

```bash
# View application logs (Docker)
docker logs erp-fulai

# View logs (PM2)
pm2 logs erp-fulai
```

### Performance Optimization

1. **Enable gzip compression** (handled by hosting platform)
2. **Use CDN** for static assets (Vercel/Railway handle this)
3. **Regular database maintenance** (SQLite is self-maintaining)
4. **Monitor disk usage** for uploaded images

## 🚨 Troubleshooting

### Common Issues:

1. **Application won't start**:
   ```bash
   # Check environment variables
   echo $JWT_SECRET
   
   # Check database permissions
   ls -la server/database/
   ```

2. **Images not uploading**:
   ```bash
   # Check upload directory permissions
   chmod 755 server/uploads
   
   # Check disk space
   df -h
   ```

3. **Database errors**:
   ```bash
   # Reset database (⚠️ loses all data)
   rm server/database/erp.db
   # Restart application to recreate
   ```

4. **Memory issues**:
   ```bash
   # Check memory usage
   free -h
   
   # Restart application
   docker-compose restart
   ```

### Getting Help:

1. **Check application logs** first
2. **Verify all environment variables** are set
3. **Test health endpoint**: `curl http://localhost:5000/api/health`
4. **Check database file exists**: `ls -la server/database/`

## 🔄 Updates & Upgrades

### Updating the Application:

```bash
# 1. Backup database
cp server/database/erp.db server/database/erp-backup.db

# 2. Pull latest changes
git pull origin main

# 3. Update dependencies
npm run install-all

# 4. Rebuild (if using Docker)
docker-compose build
docker-compose up -d

# 5. Test application
curl http://localhost:5000/api/health
```

### Migration Notes:

- Database migrations are handled automatically
- Always backup before updating
- Test in staging environment first

## 💰 Cost Estimates

### Monthly Costs (USD):

- **Railway**: $5-20/month (depending on usage)
- **Vercel + Railway**: $0-25/month (generous free tiers)
- **DigitalOcean Droplet**: $5-10/month
- **AWS/GCP**: $10-30/month (varies by region and usage)

### Cost Optimization:

1. Use free tiers when available
2. Optimize image sizes to reduce storage costs
3. Monitor usage and scale as needed
4. Consider regional deployment for better pricing

---

**Need Help?** 
- Check the main README.md for basic setup
- Review application logs for error details
- Ensure all environment variables are properly set
