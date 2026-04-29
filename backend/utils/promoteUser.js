const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('./db');

dotenv.config();

const promoteUser = async (email) => {
  if (!email) {
    console.error('Please provide an email: node utils/promoteUser.js user@example.com');
    process.exit(1);
  }

  await connectDB();

  try {
    const user = await User.findOne({ email });

    if (user) {
      user.isAdmin = true;
      await user.save();
      console.log(`Success: User ${email} is now an Admin.`);
    } else {
      console.log(`Error: User with email ${email} not found.`);
    }
    process.exit();
  } catch (error) {
    console.error('Error promoting user:', error.message);
    process.exit(1);
  }
};

// Get email from command line arguments
const emailArg = process.argv[2];
promoteUser(emailArg);
