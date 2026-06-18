import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ===== GET WISHLIST =====
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('wishlist', 'name images finalPrice isBestseller');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ADD TO WISHLIST =====
router.post('/add/:productId', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $addToSet: { wishlist: req.params.productId } },
      { new: true }
    ).populate('wishlist', 'name images finalPrice');

    res.json({ success: true, message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== REMOVE FROM WISHLIST =====
router.delete('/remove/:productId', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { wishlist: req.params.productId } },
      { new: true }
    ).populate('wishlist', 'name images finalPrice');

    res.json({ success: true, message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== CHECK IF IN WISHLIST =====
router.get('/check/:productId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const isInWishlist = user.wishlist.includes(req.params.productId);

    res.json({ success: true, isInWishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
