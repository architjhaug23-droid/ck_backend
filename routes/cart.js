import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

console.log('✅ CART ROUTES LOADED');

// ======================
// TEST ROUTE
// ======================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Cart route working'
  });
});

// ======================
// GET CART
// ======================
router.get('/', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.userId
    }).populate(
      'items.product',
      'name images finalPrice'
    );

    if (!cart) {
      return res.json({
        success: true,
        cart: {
          items: [],
          totalItems: 0,
          totalAmount: 0
        }
      });
    }

    res.json({
      success: true,
      cart
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================
// ADD TO CART
// ======================
router.post('/add', authenticate, async (req, res) => {

  try {

    const {
      productId,
      quantity = 1,
      selectedSize = 'M',
      selectedColor = 'Default'
    } = req.body;

    const product =
      await Product.findById(productId);

    if (!product) {

      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let cart =
      await Cart.findOne({
        user: req.user.userId
      });

    if (!cart) {

      cart = new Cart({
        user: req.user.userId,
        items: [{
          product: productId,
          quantity,
          selectedSize,
          selectedColor,
          selectedPrice:
            product.finalPrice ||
            product.price
        }]
      });

    } else {

      const existingItem =
        cart.items.find(item =>
          item.product.toString() === productId &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
        );

      if (existingItem) {

        existingItem.quantity += quantity;

      } else {

        cart.items.push({
          product: productId,
          quantity,
          selectedSize,
          selectedColor,
          selectedPrice:
            product.finalPrice ||
            product.price
        });
      }
    }

    cart.totalItems =
      cart.items.reduce(
        (sum, item) =>
          sum + item.quantity,
        0
      );

    cart.totalAmount =
      cart.items.reduce(
        (sum, item) =>
          sum +
          item.selectedPrice *
          item.quantity,
        0
      );

    await cart.save();

    res.json({
      success: true,
      message: 'Added to cart',
      cart
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================
// UPDATE QUANTITY
// ======================
router.put(
  '/update/:itemId',
  authenticate,
  async (req, res) => {

    try {

      const { quantity } = req.body;

      const cart =
        await Cart.findOne({
          user: req.user.userId
        });

      if (!cart) {

        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      const item =
        cart.items.find(
          i =>
            i._id.toString() ===
            req.params.itemId
        );

      if (!item) {

        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      item.quantity =
        Math.max(1, Number(quantity));

      cart.totalItems =
        cart.items.reduce(
          (sum, i) =>
            sum + i.quantity,
          0
        );

      cart.totalAmount =
        cart.items.reduce(
          (sum, i) =>
            sum +
            i.selectedPrice *
            i.quantity,
          0
        );

      await cart.save();

      res.json({
        success: true,
        message: 'Cart updated',
        cart
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ======================
// REMOVE ITEM
// ======================
router.delete(
  '/remove/:itemId',
  authenticate,
  async (req, res) => {

    try {

      const cart =
        await Cart.findOne({
          user: req.user.userId
        });

      if (!cart) {

        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      cart.items =
        cart.items.filter(
          item =>
            item._id.toString() !==
            req.params.itemId
        );

      cart.totalItems =
        cart.items.reduce(
          (sum, item) =>
            sum + item.quantity,
          0
        );

      cart.totalAmount =
        cart.items.reduce(
          (sum, item) =>
            sum +
            item.selectedPrice *
            item.quantity,
          0
        );

      await cart.save();

      res.json({
        success: true,
        message: 'Item removed',
        cart
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ======================
// CLEAR CART
// ======================
router.delete(
  '/clear',
  authenticate,
  async (req, res) => {

    try {

      const cart =
        await Cart.findOne({
          user: req.user.userId
        });

      if (!cart) {

        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      cart.items = [];
      cart.totalItems = 0;
      cart.totalAmount = 0;

      await cart.save();

      res.json({
        success: true,
        message: 'Cart cleared',
        cart
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;
