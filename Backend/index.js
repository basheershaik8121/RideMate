// Fix DNS SRV resolution on restrictive networks
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

// Cloudinary imports
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Import shared models and middleware
const User = require('./models/User');
const Ride = require('./models/Ride');
const auth = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration — restrict to frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ========================
// FILE UPLOAD SETUP (Local or Cloudinary)
// ========================
const useCloudinary = process.env.UPLOAD_MODE === 'cloudinary';

let upload;

if (useCloudinary) {
  // Cloudinary configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'ridemate',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }]
    }
  });

  upload = multer({
    storage: cloudStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
  });

  console.log('📷 Upload mode: Cloudinary');
} else {
  // Local storage (development)
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });

  upload = multer({
    storage: localStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (extname && mimetype) {
        return cb(null, true);
      }
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
  });

  console.log('📷 Upload mode: Local');
}

// Nodemailer setup using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmailNotification = async (toEmail, subject, message) => {
  // Skip if email credentials are not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'YOUR_GMAIL_APP_PASSWORD_HERE') {
    console.log(`[Email Skipped] To: ${toEmail}, Subject: ${subject}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: subject,
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};

// Helper: Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ========================
// AUTH ROUTES
// ========================

// Signup
app.post('/signup', async (req, res) => {
  try {
    const { username, password, email, source, destination } = req.body;

    // Input validation
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Password is hashed automatically by the User model pre-save hook
    const newUser = new User({
      username,
      password,
      email,
      joinedRides: [],
      source: source || { latitude: null, longitude: null },
      destination: destination || { latitude: null, longitude: null }
    });

    await newUser.save();
    res.json({ message: 'Signup successful' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to signup' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Compare hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ========================
// RIDE ROUTES
// ========================

// Get all rides (public)
app.get('/rides', async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Create a ride (protected)
app.post('/rides', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }
    if (!req.body.rider || !req.body.destination || !req.body.cost || !req.body.time) {
      return res.status(400).json({ error: 'All fields (rider, destination, cost, time) are required' });
    }

    const newRide = new Ride({
      rider: req.body.rider,
      destination: req.body.destination,
      cost: req.body.cost,
      time: req.body.time,
      image: useCloudinary ? req.file.path : `/uploads/${req.file.filename}`,
      createdBy: req.user.username
    });
    await newRide.save();
    res.json({ message: 'Ride added successfully', ride: newRide });
  } catch (error) {
    console.error('Add ride error:', error);
    res.status(500).json({ error: 'Failed to add ride' });
  }
});

// ========================
// USER ROUTES
// ========================

// Get user profile (protected)
app.get('/user/:username', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate('joinedRides');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Join a ride (protected) — now uses MongoDB _id instead of array index
app.post('/join-ride', auth, async (req, res) => {
  try {
    const { rideId } = req.body;
    const username = req.user.username;

    if (!rideId) {
      return res.status(400).json({ error: 'Ride ID is required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Check if already joined using ObjectId comparison
    if (user.joinedRides.some(id => id.toString() === rideId.toString())) {
      return res.status(400).json({ error: 'You have already joined this ride' });
    }

    // Prevent joining your own ride
    if (ride.createdBy === username) {
      return res.status(400).json({ error: 'You cannot join your own ride' });
    }

    user.joinedRides.push(ride._id);
    await user.save();

    // Send email notification to the ride creator
    const rider = await User.findOne({ username: ride.createdBy });
    if (rider && rider.email) {
      const subject = 'New Rider Joined Your Ride';
      const message = `${username} has joined your ride to ${ride.destination} at ${ride.time}.`;
      await sendEmailNotification(rider.email, subject, message);
    }

    res.json({ message: 'Ride joined successfully' });
  } catch (error) {
    console.error('Join ride error:', error);
    res.status(500).json({ error: 'Failed to join ride' });
  }
});

// ========================
// START SERVER
// ========================

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});