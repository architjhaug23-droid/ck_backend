import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ===== CREATE PAYMENT INTENT =====
router.post('/create-intent', authenticate, async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Amount in cents
      currency: 'inr',
      metadata: {
        orderId,
        userId: req.user.userId
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== CONFIRM PAYMENT =====
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'completed',
          paymentId: paymentIntentId,
          orderStatus: 'confirmed'
        },
        { new: true }
      );

      order.statusHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Payment confirmed'
      });

      await order.save();

      res.json({
        success: true,
        message: 'Payment successful',
        order
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== WEBHOOK FOR STRIPE =====
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      // Handle successful payment
      console.log('Payment succeeded:', paymentIntent.id);
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
