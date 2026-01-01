# Chat App - Real-time Messaging Application

A modern, real-time chat application built with React (Vite), Node.js, Socket.io, and MongoDB. Features include Google Sign-in, one-on-one messaging, group chats, typing indicators, read receipts, and more - combining the best features of WhatsApp and Instagram.

## ✨ Features

### Authentication
- 🔐 Google OAuth Sign-in
- 📝 Traditional username/password signup
- 🔑 JWT-based authentication
- 🎨 Beautiful gradient login/signup pages

### Real-time Messaging
- 💬 One-on-one chat
- 👥 Group chats
- ⚡ Real-time message delivery via Socket.io
- ✓✓ Read receipts
- 💭 Typing indicators
- 🟢 Online/offline status
- ⏰ Message timestamps

### UI/UX (WhatsApp + Instagram inspired)
- 📱 Responsive design (mobile & desktop)
- 🎨 Modern, clean interface
- 😊 Emoji picker
- 🔍 User search functionality
- 💚 WhatsApp-inspired chat interface
- 💜 Instagram-inspired color gradients
- 🎯 Smooth animations

## 🛠️ Tech Stack

### Frontend
- ⚛️ React 18 with TypeScript
- ⚡ Vite (fast build tool)
- 🎨 Tailwind CSS
- 🔌 Socket.io-client (real-time)
- 🗺️ React Router v6
- 🔐 @react-oauth/google
- 😊 emoji-picker-react
- 📅 date-fns

### Backend
- 🟢 Node.js with TypeScript
- 🚂 Express.js 5
- 🔌 Socket.io (real-time)
- 🗄️ MongoDB with Mongoose
- 🔑 JWT authentication
- 🔒 bcryptjs for password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18.x or higher
- MongoDB (local or Atlas)
- npm or yarn
- Google OAuth credentials (for Google Sign-in)

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/Harihkvent/chat-app.git
cd chat-app
```

### 2. Set up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally and start it
mongod
```

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster
- Get your connection string

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:5173` (Vite dev server)
6. Copy the Client ID

### 4. Configure Environment Variables

**Backend (.env)**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/chatapp  # or your MongoDB Atlas URI
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_CLIENT_ID=your_google_client_id_here  # optional
```

**Frontend (.env)**
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 5. Install Dependencies

**Backend**
```bash
cd server
npm install
```

**Frontend**
```bash
cd client
npm install
```

## 🏃 Running the Application

### Development Mode

**Terminal 1: Start MongoDB** (if running locally)
```bash
mongod
```

**Terminal 2: Start Backend Server**
```bash
cd server
npm run dev
```
Server will run on `http://localhost:4000`

**Terminal 3: Start Frontend**
```bash
cd client
npm run dev
```
Frontend will run on `http://localhost:3000`

### Production Mode

**Build Backend**
```bash
cd server
npm run build
npm start
```

**Build Frontend**
```bash
cd client
npm run build
npm run preview
```

## 📱 Usage

1. **Sign Up**
   - Click "Sign Up" on the login page
   - Fill in your details or use Google Sign-in
   - You'll be automatically logged in

2. **Log In**
   - Use your credentials or Google Sign-in
   - You'll be redirected to the chat page

3. **Start Chatting**
   - Search for users in the search bar
   - Click on a user to start chatting
   - Type your message and press Enter or click Send
   - Use the emoji picker for emojis
   - See real-time typing indicators
   - View online/offline status

4. **Features to Try**
   - Send messages to multiple users
   - See real-time message delivery
   - Check read receipts (✓✓)
   - Notice typing indicators
   - Search for new users to chat with

## 🏗️ Project Structure

```
chat-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Socket)
│   │   ├── lib/           # API and utility functions
│   │   ├── pages/         # Main pages (Login, Signup, Chat)
│   │   ├── styles/        # Global styles
│   │   ├── App.tsx        # Main App component
│   │   └── main.tsx       # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── index.ts       # Server entry point
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login

### Users
- `GET /api/users/contacts` - Get all users (contacts)
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:userId` - Get user details

### Chats
- `GET /api/chats/conversations` - Get user's conversations
- `POST /api/chats/conversations` - Create/get conversation
- `GET /api/chats/messages/:conversationId` - Get messages
- `POST /api/chats/messages` - Send message
- `POST /api/chats/groups` - Create group chat

### WebSocket Events

**Client → Server**
- `userOnline` - User comes online
- `userOffline` - User goes offline
- `sendMessage` - Send a message
- `typing` - Typing indicator
- `markAsRead` - Mark message as read

**Server → Client**
- `receiveMessage` - Receive new message
- `messageSent` - Confirmation of sent message
- `userStatusChange` - User online/offline status
- `userTyping` - Someone is typing
- `messageRead` - Message was read

## 🧪 Testing

The application can be tested by:

1. Opening multiple browser windows
2. Creating different user accounts
3. Sending messages between them
4. Observing real-time updates

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check your `MONGO_URI` in `.env`
- For Atlas, check network access and IP whitelist

### Google Sign-in Not Working
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
- Check authorized JavaScript origins in Google Console
- Ensure you're using `http://localhost:3000` (not 127.0.0.1)

### Socket Connection Issues
- Ensure both frontend and backend are running
- Check `VITE_WS_URL` matches backend URL
- Check browser console for CORS errors

### Port Already in Use
```bash
# Kill process on port 4000 (backend)
lsof -ti:4000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## 🚀 Deployment

### Backend (Railway, Render, Heroku)
1. Build: `npm run build`
2. Start: `npm start`
3. Set environment variables
4. Ensure MongoDB is accessible

### Frontend (Vercel, Netlify)
1. Build: `npm run build`
2. Serve `dist` folder
3. Set environment variables
4. Update API URLs to production backend

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Author

Created with ❤️ by Harihkvent

## 🙏 Acknowledgments

- Socket.io for real-time functionality
- React team for the amazing library
- Vite for the blazing fast build tool
- MongoDB for the flexible database
- Google for OAuth integration

---

**Happy Chatting! 💬**