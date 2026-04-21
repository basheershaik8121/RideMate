# RideMate Backend - Render Deployment

## Build & Deploy

### Backend (Render)
1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Name:** ridemate-backend
   - **Root Directory:** Backend
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `MONGO_URI` = your MongoDB connection string
   - `JWT_SECRET` = your strong secret
   - `EMAIL_USER` = your Gmail
   - `EMAIL_PASS` = your Gmail App Password
   - `FRONTEND_URL` = your Vercel frontend URL
   - `UPLOAD_MODE` = cloudinary
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret

### Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Settings:
   - **Root Directory:** Frontend/ridemate
   - **Framework:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** build
4. Add Environment Variable:
   - `REACT_APP_API_URL` = your Render backend URL (e.g., https://ridemate-backend.onrender.com)
