import './App.css';
import { useState, useEffect, useCallback } from 'react';
import { FaBicycle, FaUser } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import MapComponent from './MapComponent';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper: get stored auth token
const getToken = () => localStorage.getItem('ridemate_token');

// Helper: create auth headers
const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

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

  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [authData, setAuthData] = useState({
    username: '',
    password: '',
    email: '',
    source: {
      latitude: null,
      longitude: null
    },
    destination: {
      latitude: null,
      longitude: null
    }
  });

  const [showProfile, setShowProfile] = useState(false);
  const [userRides, setUserRides] = useState({ created: [], joined: [] });
  const [notifications, setNotifications] = useState([]);

  // Map state — dynamic source/destination
  const [mapSource, setMapSource] = useState(null);
  const [mapDestination, setMapDestination] = useState(null);

  // Restore user session from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const savedUser = localStorage.getItem('ridemate_user');
    if (token && savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('ridemate_token');
        localStorage.removeItem('ridemate_user');
      }
    }
  }, []);

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
      const response = await fetch(`${API_URL}/rides`);
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

  const fetchUserRides = useCallback(async (username) => {
    try {
      const token = getToken();
      const ridesResponse = await fetch(`${API_URL}/rides`);
      const ridesData = await ridesResponse.json();

      const userResponse = await fetch(`${API_URL}/user/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userResponse.json();

      if (userResponse.ok) {
        const createdRides = ridesData.filter(ride => ride.createdBy === username);
        // joinedRides now contains populated ride objects from the backend
        const joinedRides = userData.joinedRides || [];
        setUserRides({ created: createdRides, joined: joinedRides });

        // Update map with user's location data if available
        if (userData.source && userData.source.latitude) {
          setMapSource([userData.source.latitude, userData.source.longitude]);
        }
      }
    } catch (error) {
      console.error('Error fetching user rides:', error);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserRides(currentUser.username);
    }
  }, [currentUser, rides, fetchUserRides]);

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
      let location = { latitude: null, longitude: null };
      try {
        location = await getLocation();
      } catch {
        console.log('Location access denied, continuing without location');
      }

      const dataToSend = {
        username: authData.username,
        password: authData.password,
        email: authData.email,
        source: location
      };

      const response = await fetch(`${API_URL}/signup`, {
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
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authData.username,
          password: authData.password
        })
      });
      const result = await response.json();
      if (response.ok) {
        // Store JWT token and user data
        localStorage.setItem('ridemate_token', result.token);
        localStorage.setItem('ridemate_user', JSON.stringify(result.user));
        setCurrentUser(result.user);
        setShowAuthForm(false);
        // Reset authData fully
        setAuthData({
          username: '',
          password: '',
          email: '',
          source: { latitude: null, longitude: null },
          destination: { latitude: null, longitude: null }
        });
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Failed to login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ridemate_token');
    localStorage.removeItem('ridemate_user');
    setCurrentUser(null);
    setShowProfile(false);
    setNotifications([]);
    setUserRides({ created: [], joined: [] });
    setMapSource(null);
    setMapDestination(null);
  };

  const handleJoinRide = (rider, rideId) => {
    setSelectedRider(rider);
    setShowModal(true);
    setModalClosing(false);
    setSelectedRideId(rideId);
  };

  const addNotification = (message) => {
    const newNotification = { id: Date.now(), message };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
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
      const response = await fetch(`${API_URL}/join-ride`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ rideId: selectedRideId })
      });
      const result = await response.json();
      if (response.ok) {
        setModalClosing(true);
        setTimeout(() => {
          setShowModal(false);
          setModalClosing(false);
        }, 300);
        alert(`You have successfully joined ${selectedRider}'s ride!`);
        fetchUserRides(currentUser.username);

        // Find the ride to show notification
        const ride = rides.find(r => r._id === selectedRideId);
        if (ride && ride.createdBy !== currentUser.username) {
          addNotification(`You joined ${ride.createdBy}'s ride to ${ride.destination}!`);
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
    setModalClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setModalClosing(false);
    }, 300);
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

    try {
      const response = await fetch(`${API_URL}/rides`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        setRides([result.ride, ...rides]);
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

  // Filter rides based on role
  const displayedRides = role === 'Rider'
    ? filteredRides
    : filteredRides.filter(ride => ride.createdBy !== (currentUser?.username || ''));

  return (
    <div>
      <div className="App">
        <video autoPlay muted loop playsInline preload="auto" className="background-video">
          <source src="/11490-230853032.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-overlay"></div>

        <div className="content">
          <div className="header">
          <div className="logo-container">
            <img src="/logo.png" alt="RideMate Logo" className="logo-icon" />
            <h1>RideMate</h1>
          </div>
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
                  minLength={3}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={authData.password}
                  onChange={handleAuthInputChange}
                  required
                  minLength={6}
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
                userRides.created.map((ride) => (
                  <div key={ride._id} className="ride-card">
                    <div className="ride-details">
                      <img
                        src={ride.image.startsWith('http') ? ride.image : `${API_URL}${ride.image}`}
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
                userRides.joined.map((ride) => (
                  <div key={ride._id} className="ride-card">
                    <div className="ride-details">
                      <img
                        src={ride.image.startsWith('http') ? ride.image : `${API_URL}${ride.image}`}
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
              onClick={() => setRole('Rider')}
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
              onClick={() => setRole('Passenger')}
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

          {role === 'Rider' && (
            <button
              onClick={handleFormToggle}
              className="action-button"
            >
              {showForm ? 'Cancel' : 'Add New Ride'}
            </button>
          )}

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
                min="0"
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
            <h2>
              {role === 'Rider' ? 'All Available Rides' : 'Rides You Can Join'}
            </h2>
            {isLoading ? (
              <p className="loading-text">Loading rides...</p>
            ) : error ? (
              <div className="error-container">
                <p className="error-text">{error}</p>
                <button onClick={fetchRides} className="action-button">Retry</button>
              </div>
            ) : displayedRides.length > 0 ? (
              displayedRides.map((ride) => (
                <div key={ride._id} className="ride-card">
                  <div className="ride-details">
                    <img
                      src={ride.image.startsWith('http') ? ride.image : `${API_URL}${ride.image}`}
                      alt={ride.rider}
                      className="ride-image"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%23ddd" width="60" height="60"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="10">No Img</text></svg>';
                      }}
                    />
                    <div>
                      <p><strong>Rider:</strong> {ride.rider}</p>
                      <p><strong>Destination:</strong> {ride.destination}</p>
                      <p><strong>Cost:</strong> ₹{ride.cost}</p>
                      <p><strong>Time:</strong> {ride.time}</p>
                    </div>
                  </div>
                  {role === 'Passenger' && (
                    <button
                      onClick={() => handleJoinRide(ride.rider, ride._id)}
                      className="action-button"
                    >
                      Join Ride
                    </button>
                  )}
                  {role === 'Rider' && ride.createdBy === currentUser?.username && (
                    <span className="your-ride-badge">Your Ride</span>
                  )}
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
        <MapComponent source={mapSource} destination={mapDestination} />
      </div>
    </div>
  );
}

export default App;