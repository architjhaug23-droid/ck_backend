import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';

const router = express.Router();

// ===== DASHBOARD STATS =====
router.get('/dashboard', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Orders this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const ordersThisMonth = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });

    // Revenue this month
    const revenueThisMonth = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Popular products
    const popularProducts = await Product.find()
      .sort({ purchases: -1 })
      .limit(5);

    // Pending reviews
    const pendingReviews = await Review.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalUsers,
        totalProducts,
        ordersThisMonth,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
        pendingReviews,
        recentOrders,
        popularProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== MANAGE ORDERS =====
router.get('/orders', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    let filter = {};
    if (status) filter.orderStatus = status;
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== UPDATE ORDER STATUS =====
router.put('/orders/:id/status', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status, trackingNumber, courier, note } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status, trackingNumber, courier },
      { new: true }
    );

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note
    });

    await order.save();

    res.json({ success: true, message: 'Order updated', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== MANAGE USERS =====
router.get('/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== MANAGE REVIEWS =====
router.get('/reviews', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const reviews = await Review.find({ status })
      .populate('product', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ status });

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== APPROVE/REJECT REVIEW =====
router.put('/reviews/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status, response } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status, adminResponse: { comment: response, respondedAt: new Date() } },
      { new: true }
    );

    // Update product rating if approved
    if (status === 'approved') {
      const reviews = await Review.find({ product: review.product, status: 'approved' });
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(review.product, {
        averageRating: avgRating,
        ratingCount: reviews.length
      });
    }

    res.json({ success: true, message: 'Review updated', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== MANAGE COUPONS =====
router.get('/coupons', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/coupons', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user.userId });
    res.status(201).json({ success: true, message: 'Coupon created', coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/coupons/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Coupon updated', coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/coupons/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
