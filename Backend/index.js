const express = require('express');
const mongoose = require('mongoose'); // Add Mongoose
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config(); 


const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  joinedRides: [{ type: Number }],
  
  // New fields
  source: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  destination: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  }

});

const rideSchema = new mongoose.Schema({
  rider: { type: String, required: true },
  destination: { type: String, required: true },
  cost: { type: String, required: true },
  time: { type: String, required: true },
  image: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);
const Ride = mongoose.model('Ride', rideSchema);

const storage = multer.diskStorage({
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

const upload = multer({ storage });

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-real-email@gmail.com', // Replace with your Gmail address
    pass: 'your-real-app-password' // Replace with your Gmail App Password
  }
});

const sendEmailNotification = async (toEmail, subject, message) => {
  const mailOptions = {
    from: 'your-real-email@gmail.com',
    to: toEmail,
    subject: subject,
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

app.get('/rides', async (req, res) => {
  try {
    const rides = await Ride.find();
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

app.post('/rides', upload.single('image'), async (req, res) => {
  try {
    const newRide = new Ride({
      rider: req.body.rider,
      destination: req.body.destination,
      cost: req.body.cost,
      time: req.body.time,
      image: `/uploads/${req.file.filename}`,
      createdBy: req.body.createdBy
    });
    await newRide.save();
    res.json({ message: 'Ride added successfully', ride: newRide });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add ride' });
  }
});

app.post('/signup', async (req, res) => {
  try {
    const { username, password, email, source, destination } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

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


app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    res.json({ message: 'Login successful', user: { username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/join-ride', async (req, res) => {
  try {
    const { username, rideId } = req.body;
    const user = await User.findOne({ username });
    const rides = await Ride.find();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (rideId < 0 || rideId >= rides.length) {
      return res.status(400).json({ error: 'Invalid ride ID' });
    }

    if (user.joinedRides.includes(rideId)) {
      return res.status(400).json({ error: 'You have already joined this ride' });
    }

    user.joinedRides.push(rideId);
    await user.save();

    const ride = rides[rideId];
    const rider = await User.findOne({ username: ride.createdBy });
    if (rider && rider.email) {
      const subject = 'New Rider Joined Your Ride';
      const message = `${username} has joined your ride to ${ride.destination} at ${ride.time}.`;
      await sendEmailNotification(rider.email, subject, message);
    }

    res.json({ message: 'Ride joined successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join ride' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});