# Chat App - Full-Stack Social Media & Messaging Platform

A modern, feature-rich social media and real-time messaging application built with React (Vite), Node.js, Socket.io, and MongoDB. Combines the best features of WhatsApp, Instagram, and modern social platforms - including messaging, video/audio calling, posts, stories, profiles, and social interactions.

## ✨ Features

### 🔐 Authentication & Security
- Google OAuth 2.0 Sign-in
- Traditional email/password signup and login
- JWT-based authentication with secure tokens
- Protected routes and middleware
- Password hashing with bcryptjs

### 💬 Real-time Messaging (WhatsApp-Inspired)
- One-on-one chat with instant delivery
- Group chats with multiple participants
- Group admin controls (add/remove members, promote admins)
- Real-time message delivery via Socket.io
- WhatsApp-style read receipts (✓ sent, ✓✓ read)
- Typing indicators
- Online/offline status with real-time updates
- Message timestamps
- File/image sharing in chats
- Message history with conversation persistence

### 📞 Video & Audio Calling (WebRTC)
- **1-on-1 calls**: Voice and video calls between any two users
- **Group calls**: Multi-party audio and video calls for group conversations
- **WebRTC mesh topology**: Direct peer-to-peer connections for low-latency media
- **Call controls**: Mute/unmute microphone, toggle camera on/off
- **Call states**: Incoming call ring, outgoing call animation, active call UI
- **Video grid layout**: Adaptive grid that scales with participant count (1→full, 2→side-by-side, 4→2×2, 6→3×2)
- **Picture-in-picture**: Local video shown as a floating overlay during video calls
- **Group call indicators**: Shows participant count, group name, and stacked avatars
- **Call duration timer**: Real-time call duration tracking
- **STUN/NAT traversal**: Uses Google's public STUN servers for connectivity through firewalls
- **Socket.io signaling**: WebRTC offer/answer/ICE candidate exchange via existing Socket.io connection

### 📱 Social Feed (Instagram-Inspired)
- Personalized feed showing posts from followed users
- Create posts with images and captions
- Like/unlike posts with real-time updates
- Comment on posts
- Post engagement metrics (likes, comments count)
- Delete own posts
- User profile with post grid
- Story rings display (coming soon)

### 👥 User Profiles & Social Features
- Customizable user profiles
- Bio, website, and avatar support
- Follow/unfollow system
- Followers and following lists
- User search functionality
- View other users' profiles
- Post count, followers, and following statistics
- Private account support

### 📖 Stories (24-hour ephemeral content)
- Create stories with images/videos
- Automatic expiration after 24 hours
- View stories from followed users
- Story viewer tracking
- Grouped by user with story rings

### 🎨 UI/UX Design
- Responsive design (mobile, tablet, desktop)
- WhatsApp-inspired green chat interface
- Instagram-inspired gradient backgrounds
- Modern, clean component design
- Smooth animations and transitions
- Emoji picker integration
- Lucide React icons throughout
- Tailwind CSS styling

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Socket.io-client** - Real-time communication
- **React Router v6** - Client-side routing
- **@react-oauth/google** - Google authentication
- **emoji-picker-react** - Emoji support
- **date-fns** - Date formatting
- **Axios** - HTTP client
- **Lucide React** - Modern icon library
- **jwt-decode** - JWT token parsing

### Backend
- **Node.js** with TypeScript
- **Express.js 5** - Web framework
- **Socket.io** - WebSocket server
- **MongoDB** with Mongoose - Database
- **Redis** + **@socket.io/redis-adapter** - Horizontal scaling (optional)
- **ioredis** - Redis client
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### Development Tools
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **ts-node-dev** - Development server
- **Docker Compose** - Local MongoDB + Redis services

## 📋 Prerequisites

Before you begin, ensure you have installed:
- **Node.js** 20.x or higher
- **MongoDB** (local installation or Atlas cloud)
- **npm** or **yarn**
- **Redis** (optional — only needed for running multiple server instances)
- **Google OAuth credentials** (optional, for Google Sign-in)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Harihkvent/chat-app.git
cd chat-app
```

### 2. MongoDB Setup

**Option A: Using Docker (Recommended)**
```bash
docker-compose up -d
```
This starts MongoDB on `localhost:27017` (and Redis on `localhost:6379`) with default credentials.

**Option B: Local MongoDB**
```bash
# Install and start MongoDB locally
mongod
```

**Option C: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get your connection string
3. Whitelist your IP address

### 2b. Redis Setup (Optional — for Horizontal Scaling)

Redis is **only needed** when running multiple server instances behind a load balancer. When `REDIS_URL` is not set, the server uses in-memory state and works perfectly in single-instance mode.

**Option A: Using Docker**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Option B: Local Redis**
```bash
# macOS
brew install redis && redis-server

# Ubuntu/Debian
sudo apt-get install redis-server && sudo systemctl start redis
```

**Option C: Cloud Redis (Redis Cloud, AWS ElastiCache, Upstash)**
1. Create a Redis instance on your preferred cloud provider
2. Use the provided connection URL in `REDIS_URL`

### 3. Google OAuth Setup (Optional)

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (Vite dev server)
   - `http://localhost:3000`
6. Copy the Client ID for environment variables

### 4. Environment Variables

**Backend Configuration**

Create `server/.env`:
```env
PORT=4000 
MONGO_URI=mongodb://localhost:27017/chatapp
# For Docker: mongodb://root:example@localhost:27017/chatapp?authSource=admin
# For Atlas: your_mongodb_atlas_connection_string

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_CLIENT_ID=your_google_client_id_here  # Optional

# Redis (optional — for horizontal scaling with multiple server instances)
# REDIS_URL=redis://localhost:6379
```

**Frontend Configuration**

Create `client/.env`:
```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here  # Optional
```

### 5. Install Dependencies & Run

**Install all dependencies:**
```bash
# Backend
cd server
npm install

# Frontend (in a new terminal)
cd client
npm install
```

**Start the application:**
```bash
# Terminal 1: Start Backend Server
cd server
npm run dev
# Server runs on http://localhost:4000

# Terminal 2: Start Frontend
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

The application should now be running at `http://localhost:5173` 🎉

## 📱 Using the Application

### Authentication
1. **Sign Up**: Create account with username, email, and password
2. **Login**: Use credentials or Google Sign-in
3. Auto-redirect to feed page after authentication

### Feed & Social Features
1. **View Feed**: Home icon in navigation shows posts from followed users
2. **Create Post**: 
   - Click the **+** (Plus) icon in navigation
   - Upload image or provide image URL
   - Add caption and share
3. **Like Posts**: Click heart icon to like/unlike
4. **Comment**: Click comment icon to add comments
5. **View Profiles**: Click on usernames to view profiles

### Messaging
1. **Start Chat**: 
   - Click message icon in navigation
   - Search for users
   - Click on a user to start conversation
2. **Send Messages**: Type and press Enter or click Send
3. **Group Chats**: Create groups with multiple participants
4. **Real-time Features**:
   - See typing indicators
   - View online/offline status
   - Get read receipts (✓✓)

### Video & Audio Calling
1. **Start a 1-on-1 Call**:
   - Open a chat conversation
   - Click the **📞 phone icon** for a voice call or **📹 video icon** for a video call
   - Wait for the other user to accept
2. **Start a Group Call**:
   - Open a group conversation
   - Click the phone or video icon — all group members will be invited
3. **Receive a Call**:
   - An incoming call overlay appears with caller name and call type
   - Click **Accept** to join or **Decline** to reject
4. **During a Call**:
   - **Mute/Unmute**: Toggle your microphone
   - **Camera On/Off**: Toggle your camera (video calls)
   - **End Call**: Hang up and leave the call
   - Call duration is displayed in real time
5. **Requirements**:
   - Browser must support WebRTC (Chrome, Firefox, Safari, Edge)
   - Microphone permission is required for all calls
   - Camera permission is required for video calls
   - Both users must be online for the call to connect

### User Profile
1. **View Your Profile**: Click profile icon
2. **Edit Profile**: Update bio, avatar, website
3. **Follow Users**: Visit profiles and click Follow
4. **View Stats**: See followers, following, and post counts

### Stories (Coming Soon)
- Create 24-hour ephemeral stories
- View stories from followed users
- Story rings display at top of feed

## 🏗️ Project Structure

```
chat-app/
├── client/                         # React frontend application
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── CallModal.tsx       # Video/audio call overlay UI
│   │   │   ├── ChatSidebar.tsx     # Chat conversation list
│   │   │   ├── ChatWindow.tsx      # Chat message interface
│   │   │   ├── CreateGroupModal.tsx # Group creation
│   │   │   ├── CreatePostModal.tsx  # Post creation modal
│   │   │   ├── Navigation.tsx      # Global navigation bar
│   │   │   └── ProtectedRoute.tsx  # Auth route guard
│   │   ├── contexts/               # React context providers
│   │   │   ├── AuthContext.tsx     # Authentication state
│   │   │   ├── CallContext.tsx     # WebRTC call state & peer connections
│   │   │   ├── ThemeContext.tsx    # Dark/light mode theme state
│   │   │   └── SocketContext.tsx   # Socket.io connection
│   │   ├── lib/
│   │   │   └── api.ts              # Axios API client
│   │   ├── pages/                  # Main application pages
│   │   │   ├── ChatPage.tsx        # Messaging interface
│   │   │   ├── FeedPage.tsx        # Social feed
│   │   │   ├── LoginPage.tsx       # Login UI
│   │   │   ├── ProfilePage.tsx     # User profiles
│   │   │   ├── SettingsPage.tsx    # Profile/account settings
│   │   │   └── SignupPage.tsx      # Registration UI
│   │   ├── styles/
│   │   │   └── index.css           # Global styles
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # Application entry
│   ├── index.html
│   ├── vite.config.ts              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS config
│   └── package.json
│
├── server/                         # Node.js backend application
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts             # JWT authentication
│   │   ├── models/                 # MongoDB schemas
│   │   │   ├── Comment.ts          # Post comments
│   │   │   ├── Conversation.ts     # Chat conversations
│   │   │   ├── Message.ts          # Chat messages
│   │   │   ├── Post.ts             # Social posts
│   │   │   ├── Story.ts            # 24hr stories
│   │   │   └── User.ts             # User accounts
│   │   ├── routes/                 # API endpoints
│   │   │   ├── auth.ts             # Auth routes
│   │   │   ├── chats.ts            # Messaging routes
│   │   │   ├── posts.ts            # Post routes
│   │   │   ├── stories.ts          # Story routes
│   │   │   └── users.ts            # User routes
│   │   ├── store.ts                # Redis/in-memory shared state (user sockets, call rooms)
│   │   └── index.ts                # Server entry & Socket.io
│   ├── tsconfig.json
│   └── package.json
│
├── uploads/                        # Runtime uploads directory
│   └── chats/                      # Chat media
│
├── docs/                           # Documentation
│   ├── COMPLETION_SUMMARY.md
│   ├── DEMO.md
│   ├── FEATURES.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── NEW_FEATURES.md
│   ├── QUICK_START.md
│   ├── SETUP_GUIDE.md
│   └── TESTING_CHECKLIST.md
│
├── docker-compose.yml              # Local MongoDB + Redis services
├── client_secret_*.json            # Google OAuth credentials
└── README.md
```

## 🔌 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/google` | Google OAuth login | No |

### User Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/contacts` | Get all users (contacts) | Yes |
| GET | `/api/users/search?q=query` | Search users | Yes |
| GET | `/api/users/:userId` | Get user profile | Yes |
| PATCH | `/api/users/profile` | Update current user profile | Yes |
| POST | `/api/users/:userId/follow` | Follow user | Yes |
| DELETE | `/api/users/:userId/follow` | Unfollow user | Yes |
| GET | `/api/users/:userId/followers` | Get followers list | Yes |
| GET | `/api/users/:userId/following` | Get following list | Yes |

### Chat Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chats/conversations` | Get user's conversations | Yes |
| POST | `/api/chats/conversations` | Create/get conversation | Yes |
| GET | `/api/chats/messages/:conversationId` | Get messages | Yes |
| POST | `/api/chats/messages` | Send message | Yes |
| POST | `/api/chats/groups` | Create group chat | Yes |
| POST | `/api/chats/groups/:conversationId/members` | Add members to group | Yes |
| DELETE | `/api/chats/groups/:conversationId/members/:memberId` | Remove member | Yes |
| POST | `/api/chats/groups/:conversationId/admins/:memberId` | Make member admin | Yes |
| PATCH | `/api/chats/groups/:conversationId` | Update group info | Yes |

### Post Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/posts/feed` | Get personalized feed | Yes |
| GET | `/api/posts/user/:userId` | Get user's posts | Yes |
| POST | `/api/posts` | Create new post | Yes |
| POST | `/api/posts/:postId/like` | Like/unlike post | Yes |
| GET | `/api/posts/:postId/comments` | Get comments | Yes |
| POST | `/api/posts/:postId/comments` | Add comment | Yes |
| DELETE | `/api/posts/:postId` | Delete post | Yes |

### Story Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stories` | Get stories from followed users | Yes |
| GET | `/api/stories/my-stories` | Get own stories | Yes |
| POST | `/api/stories` | Create story | Yes |
| POST | `/api/stories/:storyId/view` | Mark story as viewed | Yes |
| GET | `/api/stories/:storyId/viewers` | Get story viewers | Yes |
| DELETE | `/api/stories/:storyId` | Delete story | Yes |

### Health Endpoint
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Service health check | No |

### WebSocket Events

**Client → Server Events (Messaging):**
- `userOnline` - User comes online
- `userOffline` - User goes offline  
- `sendMessage` - Send a chat message
- `typing` - User is typing
- `markAsRead` - Mark message as read
- `joinGroup` - Join a group conversation room
- `leaveGroup` - Leave a group conversation room

**Server → Client Events (Messaging):**
- `receiveMessage` - Receive new message
- `messageSent` - Message sent confirmation
- `userStatusChange` - User online/offline status change
- `userTyping` - User typing indicator
- `messageRead` - Message read receipt

**Client → Server Events (Calling):**
- `startCall` - Create a call room and invite participants
- `joinCallRoom` - Join an active call room
- `callOffer` - Send WebRTC offer to a specific peer
- `callAnswer` - Send WebRTC answer to a specific peer
- `iceCandidate` - Relay ICE candidate to a specific peer
- `leaveCallRoom` - Leave the call (hang up)
- `rejectCall` - Decline an incoming call

**Server → Client Events (Calling):**
- `incomingCall` - Notify user of an incoming call (includes caller info and call type)
- `existingPeers` - List of peers already in the call room (sent on join)
- `peerJoined` - A new peer joined the call
- `callOffer` - Relayed WebRTC offer from a peer
- `callAnswer` - Relayed WebRTC answer from a peer
- `iceCandidate` - Relayed ICE candidate from a peer
- `peerLeft` - A peer left the call
- `callRejected` - A peer declined the call
- `callUnavailable` - All invited participants are offline

## 🧪 Testing the Application

### Manual Testing
1. **Multiple Users**: Open the app in multiple browsers/incognito windows
2. **Create Accounts**: Register different users
3. **Test Features**:
   - Send messages between users
   - Create posts and verify they appear in feeds
   - Follow/unfollow users
   - Like and comment on posts
   - Create groups and add members
   - Test real-time features (typing, status, read receipts)
4. **Test Calling**:
   - Open a chat with another online user and click the phone/video icon
   - Accept the call from the other browser window
   - Test mute, camera toggle, and end call controls
   - Create a group and test group calling with multiple users

### Test Scenarios
- ✅ User registration and login
- ✅ Google OAuth authentication
- ✅ One-on-one messaging
- ✅ Group chat creation and management
- ✅ Real-time message delivery
- ✅ Read receipts and typing indicators
- ✅ Post creation and viewing
- ✅ Like/unlike functionality
- ✅ Comment system
- ✅ Follow/unfollow system
- ✅ Profile viewing and editing
- ✅ User search
- ✅ 1-on-1 voice and video calls
- ✅ Group voice and video calls
- ✅ Call controls (mute, camera toggle, end call)
- ✅ Incoming call accept/reject

For a complete testing checklist, see [docs/TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md)

## 🐛 Troubleshooting

### MongoDB Connection Issues
**Problem**: Cannot connect to MongoDB  
**Solutions**:
- Ensure MongoDB is running: `mongod` or `docker-compose up -d`
- Check `MONGO_URI` in `server/.env` is correct
- For Docker: Use `mongodb://root:example@localhost:27017/chatapp?authSource=admin`
- For Atlas: Verify IP whitelist and connection string
- Check MongoDB service status

### Google Sign-in Not Working
**Problem**: Google authentication fails  
**Solutions**:
- Verify `VITE_GOOGLE_CLIENT_ID` in `client/.env` matches your Google Console Client ID
- Check authorized JavaScript origins in Google Cloud Console
- Ensure using `http://localhost:5173` (not `127.0.0.1`)
- Clear browser cache and cookies
- Check browser console for errors

### Socket Connection Issues
**Problem**: Real-time features not working  
**Solutions**:
- Ensure both frontend and backend servers are running
- Verify `VITE_WS_URL` matches backend server URL
- Check browser console for WebSocket errors
- Verify CORS configuration in backend
- Check firewall settings

### Port Already in Use
**Problem**: Port 4000 or 5173 already in use  
**Solutions**:

**Windows:**
```powershell
# Find process using port 4000
netstat -ano | findstr :4000
# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Find process using port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Build Errors
**Problem**: npm install or build fails  
**Solutions**:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure Node.js version is 20.x or higher: `node --version`
- Clear npm cache: `npm cache clean --force`
- Try using `npm ci` instead of `npm install`

### File Upload Issues
**Problem**: Image uploads not working  
**Solutions**:
- Check `uploads/` directory exists and has write permissions
- Verify file size limits in multer configuration
- Check allowed file types (jpeg, jpg, png, gif, webp)
- Ensure correct Content-Type headers

### Video/Audio Call Issues
**Problem**: Calls not connecting  
**Solutions**:
- Ensure both users are online (check the green status indicator)
- Grant microphone and camera permissions when the browser prompts
- Check that your browser supports WebRTC (Chrome, Firefox, Safari, Edge)
- Verify both frontend and backend are running and Socket.io is connected
- If behind a corporate firewall or strict NAT, calls may fail — TURN servers are not configured by default (see below)

**Problem**: Audio or video not working during a call  
**Solutions**:
- Check browser permissions: go to browser settings → Privacy & Security → Microphone/Camera
- Ensure no other application is exclusively using the microphone or camera
- Try reloading the page and granting permissions again
- Check the mute/camera toggle buttons in the call UI

**Problem**: Call drops or has poor quality  
**Solutions**:
- Ensure a stable internet connection on both ends
- For group calls, bandwidth requirements increase with each participant (mesh topology)
- Close other bandwidth-intensive applications
- For production deployments, consider adding a TURN server to the ICE configuration in `client/src/contexts/CallContext.tsx`

## 🚀 Deployment

### Backend Deployment (Railway, Render, Heroku)

1. **Prepare Backend**:
   ```bash
   cd server
   npm run build
   ```

2. **Set Environment Variables** on your hosting platform:
   - `MONGO_URI` - MongoDB connection string
   - `JWT_SECRET` - Secret key for JWT
   - `PORT` - Port number (usually auto-set)
   - `GOOGLE_CLIENT_ID` - Optional
   - `REDIS_URL` - Redis connection string (required when running multiple instances)

3. **Deploy**:
   - Start command: `npm start`
   - Build command: `npm run build`

### Frontend Deployment (Vercel, Netlify)

1. **Build Frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Set Environment Variables**:
   - `VITE_API_URL` - Your backend API URL
   - `VITE_WS_URL` - Your backend WebSocket URL
   - `VITE_GOOGLE_CLIENT_ID` - Optional

3. **Deploy**:
   - Deploy the `dist/` folder
   - Configure build command: `npm run build`
   - Configure output directory: `dist`

### Important Deployment Notes
- Update CORS settings in backend for your frontend domain
- Update Google OAuth authorized origins with production URLs
- Use production MongoDB instance (Atlas recommended)
- Enable HTTPS for production (required for WebRTC camera/microphone access)
- Set appropriate JWT_SECRET (strong, random string)
- For video/audio calls behind strict NATs, consider adding a TURN server to the ICE configuration
- **For horizontal scaling**: Set `REDIS_URL` to enable the Socket.io Redis adapter and shared state — this allows running multiple server instances behind a load balancer (e.g., Nginx, AWS ALB) with sticky sessions

## 📚 Additional Documentation

For more detailed information, check out:
- [Quick Start Guide](docs/QUICK_START.md) - Get started quickly
- [Features Documentation](docs/FEATURES.md) - Detailed feature descriptions
- [Setup Guide](docs/SETUP_GUIDE.md) - Comprehensive setup instructions
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [Testing Checklist](docs/TESTING_CHECKLIST.md) - Complete testing scenarios

## 🤝 Contributing

Contributions are welcome! Please read our **[Contributing Guide](CONTRIBUTING.md)** for detailed instructions on:

- How to set up the development environment
- What features and bugs you can work on
- How to raise a pull request
- Coding guidelines and commit message conventions
- The review process

**Quick start:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Harihkvent**
- GitHub: [@Harihkvent](https://github.com/Harihkvent)

## 🙏 Acknowledgments

- **Socket.io** - Real-time bidirectional event-based communication
- **React Team** - Amazing frontend library
- **Vite** - Lightning-fast build tool
- **MongoDB** - Flexible NoSQL database
- **Redis** - In-memory data structure store for scaling
- **Tailwind CSS** - Utility-first CSS framework
- **Google** - OAuth 2.0 authentication
- **Lucide** - Beautiful icon library

## 🌟 Features Roadmap

### Coming Soon
- [x] Video/audio calling (1-on-1 and group calls)
- [x] Dark mode
- [x] Redis-backed horizontal scaling
- [ ] Message reactions (emoji reactions)
- [ ] Message forwarding
- [ ] Voice messages
- [ ] Story creation UI
- [ ] Story viewer modal
- [ ] Advanced search filters
- [ ] Notifications system
- [ ] Message encryption
- [ ] GIF support
- [ ] Message editing and deletion
- [ ] Profile verification badges
- [ ] Trending posts
- [ ] Hashtag system

## 📊 Statistics

- **Total Lines of Code**: ~12,000+
- **Components**: 12+
- **API Endpoints**: 30+
- **WebSocket Events**: 25+ (including calling signaling)
- **Database Models**: 6

---

**Made with ❤️ by Harihkvent**

**Happy Chatting & Sharing! 💬 📸**