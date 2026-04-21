# RideMate

RideMate is a full-stack web-based carpooling platform built using the MERN stack (MongoDB, Express.js, React.js, Node.js). It connects riders and passengers for shared travel, helping reduce costs and promote eco-friendly commuting.

## Features

- 🔐 **Secure Authentication** — Bcrypt password hashing + JWT tokens
- 🚗 **Create & Browse Rides** — Post rides with images, search by destination
- 👥 **Role-Based UI** — Rider mode (create rides) and Passenger mode (join rides)
- 🗺️ **Interactive Map** — Leaflet-based source/destination visualization
- 📧 **Email Notifications** — Gmail notifications when someone joins your ride
- 👤 **User Profiles** — View created and joined rides
- ☁️ **Cloud-Ready** — Cloudinary image uploads for production
- 📱 **Responsive** — Works on mobile and desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Create React App) |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + Bcrypt |
| File Uploads | Multer (local) / Cloudinary (cloud) |
| Maps | Leaflet + react-leaflet |
| Email | Nodemailer (Gmail) |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Gmail account with App Password (for email notifications)

### Backend Setup
```bash
cd Backend
npm install
# Edit .env with your MongoDB URI, JWT secret, etc.
npm start
```

### Frontend Setup
```bash
cd Frontend/ridemate
npm install
# Edit .env with your API URL
npm start
```

### Environment Variables

#### Backend (`Backend/.env`)
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
UPLOAD_MODE=local
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Frontend (`Frontend/ridemate/.env`)
```
REACT_APP_API_URL=http://localhost:5000
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions to Render + Vercel.

## License

ISC
