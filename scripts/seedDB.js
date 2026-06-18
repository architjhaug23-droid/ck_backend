import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // ===== CREATE ADMIN USER =====
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@campuskudi.com',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true
    });
    console.log('✅ Admin created');

    // ===== CREATE SAMPLE USERS =====
    const users = await User.create([
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'Password123',
        phone: '9876543210',
        college: 'Delhi University',
        isVerified: true
      },
      {
        name: 'Ananya Singh',
        email: 'ananya@example.com',
        password: 'Password123',
        phone: '9876543211',
        college: 'NSIT Delhi',
        isVerified: true
      },
      {
        name: 'Neha Kapoor',
        email: 'neha@example.com',
        password: 'Password123',
        phone: '9876543212',
        college: 'Miranda House',
        isVerified: true
      }
    ]);
    console.log('✅ Sample users created');

    // ===== CREATE CATEGORIES =====
    const categories = await Category.create([
      {
        name: 'Tops',
        description: 'T-shirts, Crop Tops, Hoodies',
        order: 1,
        isActive: true
      },
      {
        name: 'Bottoms',
        description: 'Jeans, Shorts, Skirts',
        order: 2,
        isActive: true
      },
      {
        name: 'Dresses',
        description: 'Casual & Party Dresses',
        order: 3,
        isActive: true
      },
      {
        name: 'Accessories',
        description: 'Bags, Belts, Jewellery',
        order: 4,
        isActive: true
      },
      {
        name: 'Outerwear',
        description: 'Jackets & Coats',
        order: 5,
        isActive: true
      }
    ]);
    console.log('✅ Categories created');

    // ===== CREATE SAMPLE PRODUCTS =====
    const products = await Product.create([
      {
        name: 'Low Attendance High Maintenance Tee',
        description: 'Funny college tee perfect for everyday wear',
        category: categories[0]._id,
        price: 799,
        discount: 0,
        finalPrice: 799,
        images: ['https://via.placeholder.com/500x600?text=Tee'],
        colors: [
          { name: 'Black', hex: '#000000', stock: 20 },
          { name: 'White', hex: '#FFFFFF', stock: 15 }
        ],
        sizes: [
          { size: 'XS', stock: 5, price: 799 },
          { size: 'S', stock: 10, price: 799 },
          { size: 'M', stock: 12, price: 799 },
          { size: 'L', stock: 8, price: 799 },
          { size: 'XL', stock: 5, price: 799 }
        ],
        totalStock: 40,
        material: '100% Cotton',
        care: ['Machine wash cold', 'Tumble dry low'],
        isBestseller: true,
        isNew: true,
        tags: ['college', 'funny', 'casual'],
        averageRating: 4.5,
        ratingCount: 12,
        purchases: 45
      },
      {
        name: 'Main Character Energy Tee',
        description: 'Confidence in a tee - for those who are the main character',
        category: categories[0]._id,
        price: 799,
        discount: 10,
        finalPrice: 719,
        images: ['https://via.placeholder.com/500x600?text=Tee'],
        colors: [
          { name: 'Pink', hex: '#E91E8C', stock: 15 },
          { name: 'Black', hex: '#000000', stock: 12 }
        ],
        sizes: [
          { size: 'XS', stock: 3, price: 719 },
          { size: 'S', stock: 8, price: 719 },
          { size: 'M', stock: 10, price: 719 },
          { size: 'L', stock: 7, price: 719 },
          { size: 'XL', stock: 4, price: 719 }
        ],
        totalStock: 32,
        material: '100% Cotton',
        isBestseller: true,
        isNew: true,
        tags: ['confidence', 'college', 'trending'],
        averageRating: 4.8,
        ratingCount: 24,
        purchases: 67
      },
      {
        name: 'Kudi Tote Bag',
        description: 'Spacious and stylish tote bag for college',
        category: categories[3]._id,
        price: 499,
        discount: 0,
        finalPrice: 499,
        images: ['https://via.placeholder.com/500x600?text=Tote+Bag'],
        colors: [
          { name: 'Black', hex: '#000000', stock: 25 },
          { name: 'Brown', hex: '#8B4513', stock: 18 }
        ],
        sizes: [
          { size: 'One Size', stock: 43, price: 499 }
        ],
        totalStock: 43,
        material: 'Canvas',
        isBestseller: true,
        isNew: false,
        tags: ['bag', 'college', 'casual'],
        averageRating: 4.3,
        ratingCount: 18,
        purchases: 89
      },
      {
        name: 'College Vibes Sweatshirt',
        description: 'Cozy oversized sweatshirt for campus days',
        category: categories[0]._id,
        price: 999,
        discount: 15,
        finalPrice: 849,
        images: ['https://via.placeholder.com/500x600?text=Sweatshirt'],
        colors: [
          { name: 'Pink', hex: '#E91E8C', stock: 12 },
          { name: 'Sage Green', hex: '#9DC183', stock: 10 }
        ],
        sizes: [
          { size: 'XS', stock: 2, price: 849 },
          { size: 'S', stock: 6, price: 849 },
          { size: 'M', stock: 8, price: 849 },
          { size: 'L', stock: 4, price: 849 },
          { size: 'XL', stock: 2, price: 849 }
        ],
        totalStock: 22,
        material: '80% Cotton, 20% Polyester',
        isBestseller: false,
        isNew: true,
        tags: ['comfortable', 'college', 'winter'],
        averageRating: 4.6,
        ratingCount: 9,
        purchases: 23
      },
      {
        name: 'Denim Jacket',
        description: 'Classic denim jacket to complete any outfit',
        category: categories[4]._id,
        price: 1299,
        discount: 20,
        finalPrice: 1039,
        images: ['https://via.placeholder.com/500x600?text=Denim+Jacket'],
        colors: [
          { name: 'Light Wash', hex: '#B0C4DE', stock: 8 },
          { name: 'Dark Wash', hex: '#1C1C7C', stock: 6 }
        ],
        sizes: [
          { size: 'XS', stock: 1, price: 1039 },
          { size: 'S', stock: 3, price: 1039 },
          { size: 'M', stock: 4, price: 1039 },
          { size: 'L', stock: 3, price: 1039 },
          { size: 'XL', stock: 3, price: 1039 }
        ],
        totalStock: 14,
        material: '100% Denim',
        isBestseller: true,
        isNew: false,
        tags: ['jacket', 'denim', 'classic'],
        averageRating: 4.7,
        ratingCount: 30,
        purchases: 112
      }
    ]);
    console.log('✅ Sample products created');

    // ===== CREATE SAMPLE USER =====
    const sampleUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test@123',
      phone: '9999999999',
      college: 'Test University',
      isVerified: true
    });
    console.log('✅ Test user created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin Email: admin@campuskudi.com');
    console.log('Admin Password: Admin@123');
    console.log('\nUser Email: test@example.com');
    console.log('User Password: Test@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
