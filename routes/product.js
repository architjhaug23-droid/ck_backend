import express from 'express';
import Product from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ===== GET ALL PRODUCTS WITH FILTERS =====
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort, page = 1, limit = 12 } = req.query;

    let filter = { status: 'active' };

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (minPrice || maxPrice) {
      filter.finalPrice = {};
      if (minPrice) filter.finalPrice.$gte = parseInt(minPrice);
      if (maxPrice) filter.finalPrice.$lte = parseInt(maxPrice);
    }

    let sortOption = {};
    if (sort === 'price_asc') sortOption = { finalPrice: 1 };
    else if (sort === 'price_desc') sortOption = { finalPrice: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'rating') sortOption = { averageRating: -1 };
    else if (sort === 'bestseller') sortOption = { purchases: -1 };

    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET SINGLE PRODUCT =====
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('reviews');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Increment views
    product.views = (product.views || 0) + 1;
    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== CREATE PRODUCT (ADMIN) =====
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, description, category, price, discount, images, colors, sizes, totalStock, ...rest } = req.body;

    const finalPrice = price - (price * (discount || 0)) / 100;

    const product = await Product.create({
      name,
      description,
      category,
      price,
      discount,
      finalPrice,
      images,
      colors,
      sizes,
      totalStock,
      ...rest
    });

    res.status(201).json({ success: true, message: 'Product created', product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== UPDATE PRODUCT (ADMIN) =====
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { price, discount } = req.body;

    let updateData = req.body;
    if (price && discount !== undefined) {
      updateData.finalPrice = price - (price * discount) / 100;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DELETE PRODUCT (ADMIN) =====
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted', product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET BESTSELLERS =====
router.get('/bestsellers', async (req, res) => {
  try {
    const products = await Product.find({ isBestseller: true, status: 'active' })
      .limit(8)
      .sort({ purchases: -1 });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET NEW ARRIVALS =====
router.get('/new-arrivals', async (req, res) => {
  try {
    const products = await Product.find({ isNewProduct: true, status: 'active' })
      .limit(8)
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
