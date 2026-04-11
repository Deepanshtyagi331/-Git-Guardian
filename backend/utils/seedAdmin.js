const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('./db');

dotenv.config();

const seedAdmin = async () => {
  await connectDB();

  const email = 'admin@example.com';
  const password = 'adminpassword';
  const name = 'Admin User';

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      userExists.isAdmin = true;
      userExists.password = password; // Forcefully reset password
      userExists.name = name;
      await userExists.save();
      console.log('User updated to Admin and password reset');
    } else {
      const user = await User.create({
        name,
        email,
        password,
        isAdmin: true
      });
      console.log('Admin user created');
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
