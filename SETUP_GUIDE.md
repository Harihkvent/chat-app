# Quick Setup Guide

This guide will help you get the chat app running in under 5 minutes!

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] Google OAuth credentials (optional, for Google Sign-in)

## Quick Start

### Option 1: Using Docker for MongoDB (Recommended)

```bash
# 1. Start MongoDB with Docker
docker-compose up -d

# 2. Set up backend
cd server
cp .env.example .env
# Edit .env - use: MONGO_URI=mongodb://root:example@localhost:27017/chatapp?authSource=admin
npm install
npm run dev

# 3. Set up frontend (in a new terminal)
cd client
cp .env.example .env
# Edit .env - add your Google Client ID (or leave empty for password auth only)
npm install
npm run dev
```

### Option 2: Using Local MongoDB

```bash
# 1. Start MongoDB locally
mongod

# 2. Set up backend
cd server
cp .env.example .env
# Edit .env - use: MONGO_URI=mongodb://localhost:27017/chatapp
npm install
npm run dev

# 3. Set up frontend (in a new terminal)
cd client
cp .env.example .env
# Edit .env - add your Google Client ID (or leave empty for password auth only)
npm install
npm run dev
```

### Option 3: Using MongoDB Atlas (Cloud)

```bash
# 1. Get MongoDB Atlas connection string
# Sign up at https://www.mongodb.com/cloud/atlas
# Create a cluster and get your connection string

# 2. Set up backend
cd server
cp .env.example .env
# Edit .env - use your Atlas connection string for MONGO_URI
npm install
npm run dev

# 3. Set up frontend (in a new terminal)
cd client
cp .env.example .env
# Edit .env - add your Google Client ID (or leave empty for password auth only)
npm install
npm run dev
```

## Access the Application

Open your browser and go to: **http://localhost:3000**

## Creating Your First Account

### Without Google Sign-in
1. Click "Sign Up"
2. Fill in the form:
   - Full Name: John Doe
   - Username: johndoe
   - Email: john@example.com
   - Phone: +1234567890
   - Date of Birth: 1990-01-01
   - Gender: Male
   - Password: password123
   - Confirm Password: password123
3. Click "Sign Up"
4. You'll be automatically logged in

### With Google Sign-in
1. Click the Google Sign-in button
2. Choose your Google account
3. You'll be automatically logged in

## Testing the Chat

To test real-time chat, you need at least 2 users:

1. **Create first user** (use the steps above)
2. **Create second user** (open an incognito/private window and repeat)
3. **Start chatting!**
   - In the first window, search for the second user
   - Click on their name to start a conversation
   - Type a message and press Enter
   - See it appear in real-time in the second window!

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure consent screen if prompted
6. Select "Web application"
7. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:5173` (Vite dev server port)
8. Copy the Client ID
9. Paste it in `client/.env` as `VITE_GOOGLE_CLIENT_ID=your_client_id`
10. Restart the frontend: `npm run dev`

## Troubleshooting

### MongoDB Connection Failed
- **Using Docker**: Run `docker-compose up -d` and wait 10 seconds
- **Local MongoDB**: Ensure `mongod` is running
- **Atlas**: Check your connection string and IP whitelist

### Port Already in Use
```bash
# Backend (port 4000)
lsof -ti:4000 | xargs kill -9

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

### Google Sign-in Not Working
- Make sure `VITE_GOOGLE_CLIENT_ID` is set in `client/.env`
- Use `http://localhost:3000` (not 127.0.0.1)
- Check browser console for errors
- Verify authorized origins in Google Console

### Messages Not Sending
- Check if both backend and frontend are running
- Check browser console for socket connection errors
- Ensure MongoDB is accessible

## Next Steps

Once you have the app running:
- [ ] Try sending messages between users
- [ ] Test typing indicators
- [ ] Check online/offline status
- [ ] Search for users
- [ ] Try the emoji picker
- [ ] Test on mobile (responsive design)

## Production Deployment

See the main README.md for production deployment instructions.

---

Need help? Check the main [README.md](./README.md) or open an issue on GitHub!
