import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ===== CREATE ORDER =====
router.post('/create', authenticate, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    let totalAmount = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }

      orderItems.push({
        product: item.product,
        productName: product.name,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        image: product.images[0]
      });

      totalAmount += item.price * item.quantity;
      // Update product purchase count
      product.purchases = (product.purchases || 0) + item.quantity;
      await product.save();
    }

    const order = await Order.create({
      user: req.user.userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal: totalAmount,
      tax: Math.round(totalAmount * 0.05), // 5% tax
      totalAmount: totalAmount + Math.round(totalAmount * 0.05),
      orderStatus: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order created'
      }]
    });

    // Clear user's cart
    await Cart.findOneAndUpdate({ user: req.user.userId }, { items: [], totalAmount: 0, totalItems: 0 });

    res.status(201).json({ success: true, message: 'Order created', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET USER ORDERS =====
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET ORDER BY ID =====
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== TRACK ORDER =====
router.get('/:id/track', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        status: order.orderStatus,
        statusHistory: order.statusHistory,
        trackingNumber: order.trackingNumber,
        courier: order.courier
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== CANCEL ORDER =====
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (['shipped', 'delivered', 'returned'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order in current status' });
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = reason;
    order.cancellationDate = new Date();
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason
    });

    await order.save();

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
