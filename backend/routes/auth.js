import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

function normaliseEmail(email) {
  let userEmail = '';

  if (typeof email === 'string') {
    userEmail = email.trim().toLowerCase(); 
  }

  return userEmail;
}

// create a new user account
router.post('/signup', async function (req, res) {
  try {
    const { name, email, password } = req.body; // object destructuring

    let userName = '';
    const userEmail = normaliseEmail(email);

    if (typeof name === 'string') {
      userName = name.trim();
    }

    if (!userName || !userEmail || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email: userEmail });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'An account with this email already exists' });
    }

    // hashing the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds); // async + await

    await User.create({
      name: userName,
      email: userEmail,
      password: hashedPassword,
    });

    res.json({ message: 'User created' });
  } catch (error) {
    console.log('Failed to create user:', error);

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: 'An account with this email already exists' });
    }

    res.status(500).json({ message: 'Failed to create user' });
  }
});

router.post('/login', async function (req, res) {
  try {
    const { email, password } = req.body;
    const userEmail = normaliseEmail(email);

    if (!userEmail || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    // find the user by their email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(401).json({ message: 'Email is not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Password is not correct' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log('Failed to log in:', error);
    res.status(500).json({ message: 'Failed to log in' });
  }
});

export default router;
