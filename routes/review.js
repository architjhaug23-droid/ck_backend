import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ===== GET REVIEWS FOR PRODUCT =====
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'helpful' } = req.query;

    let sortOption = {};
    if (sort === 'helpful') sortOption = { helpful: -1 };
    else if (sort === 'recent') sortOption = { createdAt: -1 };
    else if (sort === 'rating_high') sortOption = { rating: -1 };
    else if (sort === 'rating_low') sortOption = { rating: 1 };

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: req.params.productId, status: 'approved' })
      .populate('user', 'name profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ product: req.params.productId, status: 'approved' });

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ADD REVIEW =====
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, images, size, color, fit, quality } = req.body;

    // Check if user purchased the product
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Invalid order' });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ product: productId, user: req.user.userId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user.userId,
      order: orderId,
      rating,
      title,
      comment,
      images,
      size,
      color,
      fit,
      quality,
      status: 'pending'
    });

    res.status(201).json({ success: true, message: 'Review submitted for approval', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== UPDATE REVIEW =====
router.put('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const allowedFields = ['rating', 'title', 'comment', 'images', 'size', 'color', 'fit', 'quality'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    review.status = 'pending';
    await review.save();

    res.json({ success: true, message: 'Review updated', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DELETE REVIEW =====
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== MARK HELPFUL =====
router.put('/:id/helpful', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
