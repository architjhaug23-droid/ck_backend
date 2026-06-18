import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// ===== GET USER PROFILE =====
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== UPDATE PROFILE =====
router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'gender', 'dob', 'college', 'profilePicture', 'preferences'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.userId, updateData, { new: true });

    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ADD ADDRESS =====
router.post('/addresses', authenticate, async (req, res) => {
  try {
    const { type, name, phone, street, city, state, zipCode, country, isDefault } = req.body;

    const address = {
      _id: new mongoose.Types.ObjectId(),
      type,
      name,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault
    };

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $push: { addresses: address } },
      { new: true }
    );

    res.json({ success: true, message: 'Address added', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== UPDATE ADDRESS =====
router.put('/addresses/:addressId', authenticate, async (req, res) => {
  try {
    const { addressId } = req.params;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { 'addresses.$[addr]': { ...req.body, _id: addressId } } },
      { arrayFilters: [{ 'addr._id': addressId }], new: true }
    );

    res.json({ success: true, message: 'Address updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DELETE ADDRESS =====
router.delete('/addresses/:addressId', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { addresses: { _id: req.params.addressId } } },
      { new: true }
    );

    res.json({ success: true, message: 'Address deleted', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== CHANGE PASSWORD =====
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
