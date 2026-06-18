import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import 'express-async-errors';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import productRoutes from './routes/product.js';
import categoryRoutes from './routes/category.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import wishlistRoutes from './routes/wishlist.js';
import reviewRoutes from './routes/review.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';

dotenv.config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ===== DATABASE CONNECTION =====
const toStandardMongoUri = (uri) => {
  if (!uri || !uri.startsWith('mongodb+srv://')) return null;
  // mongodb+srv://user:pass@cluster.xxx.mongodb.net/db?retryWrites=true&w=majority
  // -> mongodb://user:pass@cluster-shard-00-00.xxx.mongodb.net:27017,cluster-shard-00-01.xxx.mongodb.net:27017,cluster-shard-00-02.xxx.mongodb.net:27017/db?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
  // NOTE: replicaSet value varies by cluster; leaving it optional and relying on Atlas defaults where possible.
  const rest = uri.replace('mongodb+srv://', '');
  const slashIndex = rest.indexOf('/');
  if (slashIndex === -1) return null;

  const authAndHost = rest.slice(0, slashIndex); // user:pass@host
  const dbAndQuery = rest.slice(slashIndex + 1); // db?query
  const atIndex = authAndHost.lastIndexOf('@');
  if (atIndex === -1) return null;

  const auth = authAndHost.slice(0, atIndex);
  const host = authAndHost.slice(atIndex + 1); // cluster.domain.tld
  const firstDot = host.indexOf('.');
  if (firstDot === -1) return null;

  const cluster = host.slice(0, firstDot);
  const domain = host.slice(firstDot + 1);

  const hosts = [
    `${cluster}-shard-00-00.${domain}:27017`,
    `${cluster}-shard-00-01.${domain}:27017`,
    `${cluster}-shard-00-02.${domain}:27017`
  ].join(',');

  const [dbNameRaw, queryRaw = ''] = dbAndQuery.split('?');
  const dbName = dbNameRaw || 'test';

  const params = new URLSearchParams(queryRaw);
  if (!params.has('ssl')) params.set('ssl', 'true');
  if (!params.has('authSource')) params.set('authSource', 'admin');
  if (!params.has('retryWrites')) params.set('retryWrites', 'true');
  if (!params.has('w')) params.set('w', 'majority');

  return `mongodb://${auth}@${hosts}/${dbName}?${params.toString()}`;
};

const connectMongo = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK;

  if (!primaryUri) {
    throw new Error('MONGODB_URI is missing in environment variables.');
  }

  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4
  };

  try {
    await mongoose.connect(primaryUri, options);
    console.log('✅ MongoDB Connected (primary URI)');
    return;
  } catch (err) {
    const isSrvIssue =
      primaryUri.startsWith('mongodb+srv://') &&
      (err?.message?.includes('querySrv ECONNREFUSED') ||
        err?.message?.includes('_mongodb._tcp'));

    if (!isSrvIssue) {
      throw err;
    }

    console.error('❌ DB Error (SRV DNS issue):', err.message);
    console.error('ℹ️ Detected SRV lookup failure for mongodb+srv connection string.');

    if (fallbackUri) {
      console.log('↪ Trying fallback non-SRV URI from MONGODB_URI_FALLBACK...');
      await mongoose.connect(fallbackUri, options);
      console.log('✅ MongoDB Connected (fallback URI from env)');
      return;
    }

    const derivedUri = toStandardMongoUri(primaryUri);
    if (derivedUri) {
      console.log('↪ Trying derived non-SRV URI automatically...');
      await mongoose.connect(derivedUri, options);
      console.log('✅ MongoDB Connected (auto-derived non-SRV URI)');
      return;
    }

    throw new Error(
      'SRV DNS resolution failed and fallback URI could not be derived. Set MONGODB_URI_FALLBACK to Atlas standard connection string.'
    );
  }
};

const startApp = async () => {
  try {
    await connectMongo();
    startServer(DEFAULT_PORT);
  } catch (err) {
    console.log('❌ DB Error:', err.message);
    process.exit(1);
  }
};

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running ✅' });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ===== START SERVER =====
const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 10;

const startServer = (port, retriesLeft = MAX_PORT_RETRIES) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (retriesLeft > 0) {
        const nextPort = port + 1;
        console.warn(`⚠️ Port ${port} is in use. Retrying on port ${nextPort}...`);
        startServer(nextPort, retriesLeft - 1);
      } else {
        console.error(`❌ No available port found in range ${DEFAULT_PORT}-${DEFAULT_PORT + MAX_PORT_RETRIES}.`);
        process.exit(1);
      }
      return;
    }

    console.error('❌ Server failed to start:', err.message);
    process.exit(1);
  });
};

startApp();
