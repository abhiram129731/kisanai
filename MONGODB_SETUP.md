# MongoDB & Backend Server Setup Guide

This guide details how to configure, launch, and run the backend API server and connect it to MongoDB.

## 1. Prerequisites
- **Node.js**: Installed on your system.
- **MongoDB**: Installed locally or a MongoDB Atlas connection string.
  - If using local MongoDB, start the service. On Windows, typically it runs as a service, or you can run `mongod` in a terminal.

## 2. Environment Configuration
Create or update the `.env` file in the root directory:
```env
# Server Port
PORT=5000

# JSON Web Token Secret Key
JWT_SECRET=kisanai_jwt_secret_token_12345

# MongoDB URI (use local connection or MongoDB Atlas URI)
MONGODB_URI=mongodb://localhost:27017/kisanai
```

## 3. Running the Backend Server
Open a separate powershell window at the workspace root and run the following commands:
```powershell
# Navigate into backend directory
cd backend

# Install dependencies
npm install

# Start the server (runs on http://localhost:5000)
npm start
```

## 4. Launching Frontend and Backend Together
To start both easily, you can open two terminal processes:
- **Terminal 1 (Backend)**: `cd backend; npm install; npm start`
- **Terminal 2 (Frontend)**: `npm run dev`

Both servers will now connect. The frontend will sync user sessions, crop maps, cash books, leaf scan diagnostics, and global comments in real-time to MongoDB.
