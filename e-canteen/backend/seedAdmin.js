import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const adminUser = {
  name: 'Admin User',
  email: 'admin@ecanteen.com',
  phone: '0771234567',
  password: 'admin123',
  role: 'admin',
};

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log('\n   To login, use the existing credentials.');
    } else {
      // Create admin user
      const admin = await User.create(adminUser);
      console.log('✅ Admin user created successfully!');
      console.log('');
      console.log('   Admin Credentials:');
      console.log('   ─────────────────────────────');
      console.log(`   Email:    ${adminUser.email}`);
      console.log(`   Password: ${adminUser.password}`);
      console.log('   ─────────────────────────────');
      console.log('');
      console.log('   ⚠️  Please change the password after first login!');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nMongoDB Disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
