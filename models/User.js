import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  phone: {
    type: String,
    default: ''
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },

  profilePicture: {
    type: String,
    default: ''
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false,
    default: 'other'
  },

  dob: {
    type: Date,
    default: null
  },

  college: {
    type: String,
    default: ''
  },

  addresses: [
    {
      _id: mongoose.Schema.Types.ObjectId,

      type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
      },

      name: {
        type: String,
        default: ''
      },

      phone: {
        type: String,
        default: ''
      },

      street: {
        type: String,
        default: ''
      },

      city: {
        type: String,
        default: ''
      },

      state: {
        type: String,
        default: ''
      },

      zipCode: {
        type: String,
        default: ''
      },

      country: {
        type: String,
        default: ''
      },

      isDefault: {
        type: Boolean,
        default: false
      },

      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  ],

  preferences: {
    sizes: {
      type: [String],
      default: []
    },

    colors: {
      type: [String],
      default: []
    },

    categories: {
      type: [String],
      default: []
    }
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  verificationToken: {
    type: String,
    default: null
  },

  resetPasswordToken: {
    type: String,
    default: null
  },

  resetPasswordExpires: {
    type: Date,
    default: null
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  lastLogin: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});


// =========================
// HASH PASSWORD BEFORE SAVE
// =========================

userSchema.pre('save', async function(next) {

  if (!this.isModified('password')) {
    return next();
  }

  this.password =
    await bcrypt.hash(
      this.password,
      10
    );

  next();
});


// =========================
// COMPARE PASSWORD
// =========================

userSchema.methods.matchPassword =
async function(enteredPassword) {

  return await bcrypt.compare(
    enteredPassword,
    this.password
  );
};


export default mongoose.model(
  'User',
  userSchema
);