require('dotenv').config();  // Load environment variables from .env

const fs = require('fs');
const mongoose = require('mongoose');

// Get MongoDB URI from environment variable
const uri = process.env.MONGO_URI;

// Check if the URI is loaded properly
if (!uri) {
  console.error('MongoDB URI is not defined in the .env file');
  process.exit(1); // Exit the script if URI is not found
}

console.log('Connecting to MongoDB Atlas with URI:', uri);  // Log the URI for debugging

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB Atlas:', err);
    process.exit(1); // Exit if connection fails
  });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  joinedRides: [Number]
});

const rideSchema = new mongoose.Schema({
  rider: String,
  destination: String,
  cost: String,
  time: String,
  image: String,
  createdBy: String
});

const User = mongoose.model('User', userSchema);
const Ride = mongoose.model('Ride', rideSchema);

// Read and parse JSON files
const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
const rides = JSON.parse(fs.readFileSync('rides.json', 'utf8'));

(async () => {
  try {
    await User.insertMany(users);
    console.log('Users data migrated to MongoDB Atlas');
    
    await Ride.insertMany(rides);
    console.log('Rides data migrated to MongoDB Atlas');
  } catch (error) {
    console.error('Error during data migration:', error);
  } finally {
    mongoose.connection.close();
  }
})();
