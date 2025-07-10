import './App.css';
import { useState, useEffect } from 'react';
import { FaBicycle, FaUser } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import MapComponent from './MapComponent';


function App() {
  const [role, setRole] = useState('Rider');
  const [destination, setDestination] = useState('');
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formClosing, setFormClosing] = useState(false);
  const [newRide, setNewRide] = useState({
    rider: '',
    destination: '',
    cost: '',
    time: ''
  });


  // const [error, setError] = useState('');


 

  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalClosing, setModalClosing] = useState(false); // New state for modal animation
  const [selectedRider, setSelectedRider] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [authData, setAuthData] = useState({
  username: '',
  password: '',
  email: '',
  joinedRides: [],
  source: {
    latitude: '',
    longitude: ''
  },
  destination: {
    latitude: "null",
    longitude: "null"
  }
});

  const [showProfile, setShowProfile] = useState(false);
  const [userRides, setUserRides] = useState({ created: [], joined: [] });
  const [notifications, setNotifications] = useState([]);


   const getLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        resolve({ latitude: lat, longitude: lon });
      },
      (err) => {
        reject(err);
      }
    );
  });
};



  const fetchRides = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/rides');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setRides(data);
      setFilteredRides(data);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError('Failed to fetch rides. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRides = async (username) => {
    try {
      const ridesResponse = await fetch('http://localhost:5000/rides');
      const ridesData = await ridesResponse.json();
      const userResponse = await fetch(`http://localhost:5000/user/${username}`);
      const userData = await userResponse.json();
      if (userResponse.ok) {
        const createdRides = ridesData.filter(ride => ride.createdBy === username);
        const joinedRides = userData.joinedRides.map(rideId => ridesData[rideId]);
        setUserRides({ created: createdRides, joined: joinedRides.filter(ride => ride) });
      }
    } catch (error) {
      console.error('Error fetching user rides:', error);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserRides(currentUser.username);
    }
  }, [currentUser, rides]);

  useEffect(() => {
    if (rides.length === 0) {
      setFilteredRides([]);
      return;
    }
    if (destination === '') {
      setFilteredRides(rides);
    } else {
      const filtered = rides.filter((ride) =>
        ride.destination.toLowerCase().includes(destination.toLowerCase())
      );
      setFilteredRides(filtered);
    }
  }, [destination, rides]);

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthData({ ...authData, [name]: value });
  };

  const handleSignup = async (e) => {
  e.preventDefault();

  try {
    const location = await getLocation();

    const dataToSend = {
      ...authData,
      source: location // overwrite or fill in the source
    };

    console.log("Signup data being sent:", dataToSend);

    const response = await fetch('http://localhost:5000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Signup successful! Please login.');
      setIsSignup(false);
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Error during signup:', error);
    alert('Failed to signup');
  }
};

  const handleLogin = async (e) => {
    e.preventDefault();
    getLocation();
    console.log(authData);
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      const result = await response.json();
      if (response.ok) {
        setCurrentUser(result.user);
        setShowAuthForm(false);
        setAuthData({ username: '', password: '', email: '' });
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Failed to login');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowProfile(false);
    setNotifications([]);
  };

  const handleJoinRide = (rider, rideId) => {
    setSelectedRider(rider);
    setShowModal(true);
    setModalClosing(false); // Reset modal closing state
    setSelectedRideId(rideId);
  };

  const [selectedRideId, setSelectedRideId] = useState(null);

  const addNotification = (message) => {
    const newNotification = { id: Date.now(), message };
    setNotifications([...notifications, newNotification]);
    setTimeout(() => {
      setNotifications(notifications => notifications.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const confirmJoinRide = async () => {
    if (!currentUser) {
      alert('Please login to join a ride!');
      setShowModal(false);
      setShowAuthForm(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/join-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, rideId: selectedRideId })
      });
      const result = await response.json();
      if (response.ok) {
        setModalClosing(true); // Trigger fade-out animation
        setTimeout(() => {
          setShowModal(false);
          setModalClosing(false);
        }, 300); // Match animation duration
        alert(`You have successfully joined ${selectedRider}'s ride!`);
        fetchUserRides(currentUser.username);
        const ride = rides[selectedRideId];
        if (ride.createdBy !== currentUser.username) {
          addNotification(`${currentUser.username} has joined your ride to ${ride.destination}!`);
        }
        setSelectedRider(null);
        setSelectedRideId(null);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error joining ride:', error);
      alert('Failed to join ride');
    }
  };

  const cancelJoinRide = () => {
    setModalClosing(true); // Trigger fade-out animation
    setTimeout(() => {
      setShowModal(false);
      setModalClosing(false);
    }, 300); // Match animation duration
    setSelectedRider(null);
    setSelectedRideId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRide({ ...newRide, [name]: value });
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleAddRide = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please login to add a ride!');
      setShowAuthForm(true);
      return;
    }

    const formData = new FormData();
    formData.append('rider', newRide.rider);
    formData.append('destination', newRide.destination);
    formData.append('cost', newRide.cost);
    formData.append('time', newRide.time);
    formData.append('image', imageFile);
    formData.append('createdBy', currentUser.username);

    try {
      const response = await fetch('http://localhost:5000/rides', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        setRides([...rides, result.ride]);
        setNewRide({ rider: '', destination: '', cost: '', time: '' });
        setImageFile(null);
        setFormClosing(true);
        setTimeout(() => {
          setShowForm(false);
          setFormClosing(false);
        }, 500);
        fetchUserRides(currentUser.username);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error adding ride:', error);
      alert('Failed to add ride');
    }
  };

  const handleFormToggle = () => {
    if (showForm) {
      setFormClosing(true);
      setTimeout(() => {
        setShowForm(false);
        setFormClosing(false);
      }, 500);
    } else {
      setShowForm(true);
      setFormClosing(false);
    }
  };

  return (
    <div>
    
    <div className="App">
      <video autoPlay muted loop className="background-video">
  <source src="/11490-230853032.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>

      <div className="content">
        <div className="header">
          <h1>RideMate</h1>
          {currentUser ? (
            <div className="user-info">
              <span>Welcome, {currentUser.username}!</span>
              <button onClick={() => setShowProfile(!showProfile)} className="action-button">
                {showProfile ? 'Hide Profile' : 'Show Profile'}
              </button>
              <button onClick={handleLogout} className="action-button logout-button">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthForm(true)} className="action-button">
              Login / Signup
            </button>
          )}
        </div>

        {showAuthForm && !currentUser && (
          <div className="auth-form">
            <h3>{isSignup ? 'Signup' : 'Login'}</h3>
            <form onSubmit={isSignup ? handleSignup : handleLogin}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={authData.username}
                onChange={handleAuthInputChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={authData.password}
                onChange={handleAuthInputChange}
                required
              />
              {isSignup && (
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={authData.email}
                  onChange={handleAuthInputChange}
                  required
                />
              )}
              <button type="submit" className="action-button">
                {isSignup ? 'Signup' : 'Login'}
              </button>
            </form>
            <p>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="toggle-auth-button"
              >
                {isSignup ? 'Login' : 'Signup'}
              </button>
            </p>
          </div>
        )}

        {showProfile && currentUser && (
          <div className="profile-section">
            <h2>{currentUser.username}'s Profile</h2>
            <h3>Created Rides</h3>
            {userRides.created.length > 0 ? (
              userRides.created.map((ride, index) => (
                <div key={index} className="ride-card">
                  <div className="ride-details">
                    <img
                      src={ride.image.startsWith('http') ? ride.image : `http://localhost:5000${ride.image}`}
                      alt={ride.rider}
                      className="ride-image"
                    />
                    <div>
                      <p><strong>Rider:</strong> {ride.rider}</p>
                      <p><strong>Destination:</strong> {ride.destination}</p>
                      <p><strong>Cost:</strong> ₹{ride.cost}</p>
                      <p><strong>Time:</strong> {ride.time}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No rides created yet.</p>
            )}

            <h3>Joined Rides</h3>
            {userRides.joined.length > 0 ? (
              userRides.joined.map((ride, index) => (
                <div key={index} className="ride-card">
                  <div className="ride-details">
                    <img
                      src={ride.image.startsWith('http') ? ride.image : `http://localhost:5000${ride.image}`}
                      alt={ride.rider}
                      className="ride-image"
                    />
                    <div>
                      <p><strong>Rider:</strong> {ride.rider}</p>
                      <p><strong>Destination:</strong> {ride.destination}</p>
                      <p><strong>Cost:</strong> ₹{ride.cost}</p>
                      <p><strong>Time:</strong> {ride.time}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No rides joined yet.</p>
            )}
          </div>
        )}

        <input
          type="text"
          placeholder="Where are you going?"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="search-bar"
        />
        <div className="toggle-buttons">
          <button
            onClick={() => {
              setRole('Rider');
              console.log('Selected Role: Rider');
            }}
            className="toggle-button"
            style={{
              backgroundColor: role === 'Rider' ? '#2196F3' : '#ccc',
              color: 'white',
              marginRight: '10px'
            }}
          >
            <FaBicycle style={{ marginRight: '5px' }} /> Rider
          </button>
          <button
            onClick={() => {
              setRole('Passenger');
              console.log('Selected Role: Passenger');
            }}
            className="toggle-button"
            style={{
              backgroundColor: role === 'Passenger' ? '#2196F3' : '#ccc',
              color: 'white'
            }}
          >
            <FaUser style={{ marginRight: '5px' }} /> Passenger
          </button>
        </div>
        {destination && <p>Destination: {destination}</p>}
        <button
          onClick={handleFormToggle}
          className="action-button"
        >
          {showForm ? 'Cancel' : 'Add New Ride'}
        </button>
        {showForm && (
          <form
            onSubmit={handleAddRide}
            className={`add-ride-form ${formClosing ? 'animate-form-close' : 'animate-form-open'}`}
          >
            <input
              type="text"
              name="rider"
              placeholder="Rider Name"
              value={newRide.rider}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="destination"
              placeholder="Destination"
              value={newRide.destination}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="cost"
              placeholder="Cost (₹)"
              value={newRide.cost}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="time"
              placeholder="Time (e.g., 7 PM)"
              value={newRide.time}
              onChange={handleInputChange}
              required
            />
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            <button type="submit" className="action-button">Submit Ride</button>
          </form>
        )}
        <div className="rides-container">
          <h2>Available Rides</h2>
          {isLoading ? (
            <p className="loading-text">Loading rides...</p>
          ) : error ? (
            <div className="error-container">
              <p className="error-text">{error}</p>
              <button onClick={fetchRides} className="action-button">Retry</button>
            </div>
          ) : filteredRides.length > 0 ? (
            filteredRides.map((ride, index) => (
              <div key={index} className="ride-card">
                <div className="ride-details">
                  <img
                    src={ride.image.startsWith('http') ? ride.image : `http://localhost:5000${ride.image}`}
                    alt={ride.rider}
                    className="ride-image"
                    onError={(e) => console.log(`Failed to load image for ${ride.rider}: ${e.target.src}`)}
                  />
                  <div>
                    <p><strong>Rider:</strong> {ride.rider}</p>
                    <p><strong>Destination:</strong> {ride.destination}</p>
                    <p><strong>Cost:</strong> ₹{ride.cost}</p>
                    <p><strong>Time:</strong> {ride.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinRide(ride.rider, index)}
                  className="action-button"
                >
                  Join Ride
                </button>
              </div>
            ))
          ) : (
            <p>No rides available</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className={`modal-overlay ${modalClosing ? 'fade-out' : 'fade-in'}`}>
          <div className="modal">
            <h3>Join Ride</h3>
            <p>Are you sure you want to join {selectedRider}'s ride?</p>
            <div className="modal-buttons">
              <button onClick={confirmJoinRide} className="action-button confirm-button">
                Yes, Join
              </button>
              <button onClick={cancelJoinRide} className="action-button cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="notification-container">
        {notifications.map(notification => (
          <div key={notification.id} className="notification-toast">
            {notification.message}
          </div>
        ))}
      </div>
    </div>
    <div className="App">
      <MapComponent />
    </div>
    </div>
  );
}

export default App;