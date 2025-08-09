# ERP FULAI - Lightweight Clothing Inventory Management System

A modern, lightweight ERP solution designed specifically for clothing manufacturing companies. Built with React and Node.js for fast, cloud-accessible inventory management.

## Features

- 📸 **Image Upload**: Add clothing pictures to inventory items
- 📝 **Comprehensive Item Data**: Track serial number, size, color, quantity, price, and fabric composition
- 👥 **Multi-User Support**: Support for up to 5 users with role-based access
- 🔍 **Search & Filter**: Find items quickly by serial number, color, size, or composition
- 📊 **Dashboard Analytics**: Overview of inventory statistics and recent items
- 🔐 **Secure Authentication**: JWT-based authentication system
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- ☁️ **Cloud Ready**: Easy deployment to any cloud platform

## Technology Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, React Router
- **Backend**: Node.js + Express, SQLite database
- **Authentication**: JWT tokens, bcrypt password hashing
- **File Upload**: Multer for image handling
- **UI Components**: Lucide React icons, React Hook Form

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ERP-FULAI
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp server/.env.example server/.env
   
   # Edit server/.env with your settings
   # At minimum, change JWT_SECRET to a secure random string
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Default Login

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change the default admin password after first login for security.

## Project Structure

```
ERP-FULAI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (Auth)
│   │   └── ...
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── database/          # Database setup
│   └── uploads/           # Uploaded images
└── package.json           # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/users` - Get all users (admin only)

### Inventory
- `GET /api/inventory` - Get inventory items (with pagination, search, filters)
- `POST /api/inventory` - Create new inventory item
- `GET /api/inventory/:id` - Get single inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `GET /api/inventory/stats/summary` - Get inventory statistics

## Deployment Options

### Option 1: Railway (Recommended for China)

1. **Prepare for deployment**
   ```bash
   # Build the frontend
   cd client && npm run build
   ```

2. **Create Railway account**: Visit [railway.app](https://railway.app)

3. **Deploy from GitHub**:
   - Connect your GitHub repository
   - Railway will automatically detect and deploy both frontend and backend

4. **Set environment variables** in Railway dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your_super_secure_jwt_secret_here
   CLIENT_URL=https://your-railway-app.railway.app
   ```

### Option 2: Vercel + PlanetScale

1. **Frontend on Vercel**:
   - Connect your repository to [vercel.com](https://vercel.com)
   - Set build command: `cd client && npm run build`
   - Set output directory: `client/dist`

2. **Backend on separate service** (Railway, Render, etc.)

### Option 3: Traditional VPS

1. **Server setup**:
   ```bash
   # Install Node.js, PM2, and nginx
   sudo apt update
   sudo apt install nodejs npm nginx
   sudo npm install -g pm2
   ```

2. **Deploy application**:
   ```bash
   # Clone and build
   git clone <your-repo>
   cd ERP-FULAI
   npm run install-all
   cd client && npm run build
   
   # Start with PM2
   cd ../server
   pm2 start index.js --name "erp-fulai"
   ```

3. **Configure nginx** as reverse proxy

## Security Considerations

### For Production Deployment:

1. **Change default credentials** immediately
2. **Use strong JWT secret** (generate with `openssl rand -base64 32`)
3. **Enable HTTPS** (use Let's Encrypt for free SSL)
4. **Set up proper CORS** for your domain
5. **Regular backups** of the SQLite database
6. **Monitor logs** for security issues

### Environment Variables for Production:

```bash
NODE_ENV=production
JWT_SECRET=your_super_secure_random_string_here
CLIENT_URL=https://yourdomain.com
DB_PATH=./database/erp.db
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5MB
PORT=5000
```

## Database

The application uses SQLite for simplicity and portability. The database file is created automatically at `server/database/erp.db`.

### Schema:
- **users**: User accounts and authentication
- **inventory**: Clothing inventory items with all details

### Backup:
```bash
# Backup database
cp server/database/erp.db server/database/erp-backup-$(date +%Y%m%d).db

# Restore from backup
cp server/database/erp-backup-YYYYMMDD.db server/database/erp.db
```

## Customization

### Adding More Fields:
1. Update database schema in `server/database/db.js`
2. Add fields to inventory form in `client/src/components/InventoryForm.jsx`
3. Update API routes in `server/routes/inventory.js`

### Changing Styles:
- Edit `client/tailwind.config.js` for theme customization
- Modify `client/src/index.css` for custom CSS

### Adding Features:
- Create new components in `client/src/components/`
- Add new API routes in `server/routes/`
- Update navigation in `client/src/components/Layout.jsx`

## Troubleshooting

### Common Issues:

1. **Port already in use**:
   ```bash
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9
   ```

2. **Permission errors on uploads**:
   ```bash
   # Fix upload directory permissions
   chmod 755 server/uploads
   ```

3. **Database locked**:
   ```bash
   # Restart the server
   npm run server
   ```

### Getting Help:

- Check the browser console for frontend errors
- Check server logs for backend errors
- Ensure all environment variables are set correctly

## License

MIT License - feel free to modify and use for your business needs.

## Support

This is a lightweight solution designed to get your inventory management up and running quickly. For complex enterprise features, consider scaling up to a more robust ERP solution as your business grows.
