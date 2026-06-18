# CampusKudi Backend - Complete Setup & Deployment Guide

## 📁 Project Structure

```
campuskudi-backend/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore file
│
├── models/                  # MongoDB Schemas
│   ├── User.js
│   ├── Product.js
│   ├── Category.js
│   ├── Order.js
│   ├── Review.js
│   ├── Cart.js
│   └── Coupon.js
│
├── routes/                  # API Routes
│   ├── auth.js              # Authentication (login/signup)
│   ├── user.js              # User profile & addresses
│   ├── product.js           # Product management
│   ├── category.js          # Category management
│   ├── cart.js              # Shopping cart
│   ├── order.js             # Order management
│   ├── wishlist.js          # Wishlist
│   ├── review.js            # Product reviews
│   ├── admin.js             # Admin dashboard
│   └── payment.js           # Payment processing
│
├── middleware/              # Custom middleware
│   └── auth.js              # JWT authentication
│
├── public/                  # Static files
│   └── admin-panel.html     # Admin dashboard
│
└── scripts/                 # Utility scripts
    └── seedDB.js            # Database seeding
```

## 🚀 Setup Instructions

### Step 1: Clone & Install Dependencies
```bash
cd campuskudi-backend
npm install
```

### Step 2: Configure Environment Variables
```bash
# Copy example file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required .env variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campuskudi
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_here
FRONTEND_URL=http://localhost:3000
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 3: Start the Backend

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Server will run on: `http://localhost:5000`

## 🗄️ Database Setup

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/campuskudi`
4. Add to `.env` as `MONGODB_URI`

### Local MongoDB
```bash
# Install MongoDB locally
# Mac:
brew install mongodb-community

# Linux:
sudo apt-get install mongodb

# Start MongoDB
mongod

# Connection string:
mongodb://localhost:27017/campuskudi
```

## 🔑 Authentication Setup

### JWT Token Generation
- Tokens are generated on signup/login
- Valid for 30 days
- Include in Authorization header: `Bearer <token>`

### Generate Admin Account
```bash
# Create an admin user with this credentials:
Email: admin@campuskudi.com
Password: Your strong password
Role: admin
```

## 📦 Deployment Steps

### Option 1: Deploy to Railway (Recommended)

1. **Install Railway CLI:**
   ```bash
   npm install -g railway
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize Railway Project:**
   ```bash
   railway init
   ```

4. **Add Environment Variables:**
   ```bash
   railway variables add MONGODB_URI="your_mongodb_uri"
   railway variables add JWT_SECRET="your_jwt_secret"
   # Add all other variables from .env
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get Public URL:**
   ```bash
   railway status
   ```

### Option 2: Deploy to Render

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create account at https://render.com**

3. **Create New Service > Web Service**
   - Connect GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables

4. **Deploy** - Render will auto-deploy on push

### Option 3: Deploy to Heroku

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login & Create App:**
   ```bash
   heroku login
   heroku create campuskudi-backend
   ```

3. **Add Environment Variables:**
   ```bash
   heroku config:set MONGODB_URI="your_uri"
   heroku config:set JWT_SECRET="your_secret"
   # Add all variables
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

### Option 4: Deploy to AWS EC2

1. **Launch EC2 instance (Ubuntu 20.04 LTS)**

2. **SSH into instance:**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install MongoDB:**
   ```bash
   sudo apt-get install -y mongodb
   ```

5. **Clone repository and install:**
   ```bash
   git clone your-repo
   cd campuskudi-backend
   npm install
   ```

6. **Setup environment variables:**
   ```bash
   nano .env
   ```

7. **Run with PM2 (for keeping app alive):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "campuskudi-backend"
   pm2 startup
   pm2 save
   ```

8. **Setup Nginx as reverse proxy:**
   ```bash
   sudo apt-get install nginx
   # Configure nginx to forward requests to localhost:5000
   ```

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use HTTPS in production (get SSL certificate)
- [ ] Enable CORS only for your frontend domain
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database passwords
- [ ] Enable MongoDB IP whitelist
- [ ] Setup rate limiting
- [ ] Add request validation
- [ ] Implement API key authentication for admin
- [ ] Enable CSRF protection
- [ ] Add security headers (helmet.js)
- [ ] Keep dependencies updated

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Product Endpoints
- `GET /api/products` - Get all products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Order Endpoints
- `POST /api/orders/create` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/:id/track` - Track order

### Cart Endpoints
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add to cart
- `DELETE /api/cart/remove/:itemId` - Remove from cart
- `PUT /api/cart/update/:itemId` - Update quantity

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/orders` - All orders
- `PUT /api/admin/orders/:id/status` - Update order
- `GET /api/admin/users` - All users
- `GET /api/admin/reviews` - Review moderation
- `PUT /api/admin/reviews/:id` - Approve/reject review
- `GET /api/admin/coupons` - All coupons
- `POST /api/admin/coupons` - Create coupon

## 🛠️ Common Issues & Fixes

### 1. MongoDB Connection Error
**Error:** `MongoError: connect ECONNREFUSED`
**Solution:**
- Check if MongoDB is running
- Verify connection string in .env
- Check IP whitelist on MongoDB Atlas

### 2. JWT Authentication Failed
**Error:** `401 Unauthorized`
**Solution:**
- Ensure token is sent in Authorization header
- Check token format: `Bearer <token>`
- Verify JWT_SECRET matches

### 3. CORS Error
**Error:** `Access to XMLHttpRequest blocked by CORS policy`
**Solution:**
- Add frontend URL to CORS in server.js
- Check FRONTEND_URL in .env

### 4. Port Already in Use
**Error:** `Port 5000 already in use`
**Solution:**
```bash
# Find process using port
lsof -i :5000
# Kill process
kill -9 <PID>
# Or use different port
PORT=5001 npm start
```

## 📊 Admin Panel Features

**Access at:** `http://localhost:5000/public/admin-panel.html`

### Dashboard
- Real-time statistics
- Revenue tracking
- Recent orders
- Popular products

### Product Management
- Create/edit/delete products
- Manage stock & pricing
- Bulk operations

### Order Management
- View all orders
- Update order status
- Track shipments
- Handle cancellations

### User Management
- View all users
- User details & history
- Send notifications

### Review Moderation
- Approve/reject reviews
- Admin responses
- Spam detection

### Coupon Management
- Create discount codes
- Set expiry dates
- Track usage

### Analytics
- Revenue charts
- Order trends
- Customer insights
- Product performance

## 🔄 Frontend Integration

### Update Frontend API URL
In your frontend's JavaScript, update:
```javascript
const API_URL = 'http://your-backend-url/api';
```

### Login & Store Token
```javascript
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
localStorage.setItem('token', data.token);
```

### Make Authenticated Requests
```javascript
const response = await fetch(`${API_URL}/orders/my-orders`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

## 📱 Mobile App Integration

API is fully REST and works with mobile apps:
- iOS (Swift)
- Android (Kotlin/Java)
- React Native
- Flutter

All endpoints return JSON responses.

## 🚀 Performance Optimization

1. **Database Indexing:** Already configured in models
2. **Pagination:** Implement in frontend
3. **Caching:** Use Redis for frequently accessed data
4. **CDN:** Use Cloudinary for image delivery
5. **Compression:** Enable gzip compression
6. **Database Optimization:** Monitor slow queries

## 📞 Support & Troubleshooting

For issues:
1. Check error logs: `npm start` shows console logs
2. Check MongoDB logs
3. Verify environment variables
4. Check API response in browser DevTools

## 🎯 Next Steps

1. ✅ Test all API endpoints
2. ✅ Setup payment gateway (Stripe)
3. ✅ Configure email notifications
4. ✅ Setup analytics
5. ✅ Create admin login page
6. ✅ Setup automated backups
7. ✅ Monitor performance
8. ✅ Scale infrastructure

## 📄 License

MIT License - Free to use for CampusKudi

---

**Backend Status:** ✅ Production Ready

**Version:** 1.0.0

**Last Updated:** 2024
