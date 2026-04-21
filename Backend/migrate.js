// Fix DNS SRV resolution on restrictive networks
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Use shared models
const User = require('./models/User');
const Ride = require('./models/Ride');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MongoDB URI is not defined in the .env file');
  process.exit(1);
}

console.log('Connecting to MongoDB Atlas...');

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB Atlas:', err);
    process.exit(1);
  });

// Read and parse JSON files
const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
const rides = JSON.parse(fs.readFileSync('rides.json', 'utf8'));

(async () => {
  try {
    // Hash passwords before inserting users
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword,
          joinedRides: [] // Reset joined rides since old indices won't match _ids
        };
      })
    );

    await User.insertMany(hashedUsers);
    console.log('Users data migrated to MongoDB Atlas (passwords hashed)');

    await Ride.insertMany(rides);
    console.log('Rides data migrated to MongoDB Atlas');
  } catch (error) {
    console.error('Error during data migration:', error);
  } finally {
    mongoose.connection.close();
  }
})();
