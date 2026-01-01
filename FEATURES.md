# Features Documentation

This document provides a detailed overview of all features in the Chat App.

## 🔐 Authentication & Authorization

### Google OAuth Sign-in
- **One-click sign-in** with Google account
- Automatic profile picture import from Google
- Secure JWT token generation
- 7-day token expiration

### Traditional Registration
- Username/password based signup
- Email validation
- Password strength requirements (minimum 6 characters)
- Form validation with helpful error messages
- Automatic login after registration

### Security
- Passwords hashed with bcryptjs
- JWT tokens for session management
- Protected routes (cannot access chat without login)
- Token stored securely in localStorage
- Automatic token expiration and re-authentication

## 💬 Real-time Messaging

### One-on-One Chat
- **Instant message delivery** via WebSocket (Socket.io)
- Message persistence in MongoDB
- Conversation creation on first message
- Message history loading
- Smooth scrolling to latest message

### Message Features
- **Text messages** with emoji support
- **Timestamps** for each message (HH:mm format)
- **Read receipts** (✓ sent, ✓✓ read)
- **Typing indicators** (see when someone is typing)
- **Message bubbles** (sender on right, receiver on left)
- **WhatsApp-style** green message bubbles for own messages

### Group Chats
- Create group conversations
- Add multiple participants
- Group name and avatar
- Broadcast messages to all members

## 👥 User Management

### User Discovery
- **Search functionality** - find users by name, username, or email
- **Contact list** - see all registered users
- **Real-time search** - results update as you type
- **User avatars** - display profile pictures or initials

### Online Status
- **Real-time online/offline indicators** (green dot)
- **Last seen** timestamps
- **Automatic status updates** on login/logout
- **Connection status** displayed in UI

## 🎨 User Interface

### WhatsApp-Inspired Elements
- **Green color scheme** (#25d366) for primary actions
- **Chat bubbles** with tail-like design
- **Sidebar layout** with conversations list
- **Status indicators** in chat list
- **Smooth animations** for messages

### Instagram-Inspired Elements
- **Gradient backgrounds** (purple to pink) on auth pages
- **Modern card design** for login/signup
- **Profile avatars** in circular frames
- **Color-coded user indicators**

### Responsive Design
- **Mobile-first approach**
- **Collapsible sidebar** on mobile
- **Touch-friendly** buttons and inputs
- **Adaptive layouts** for different screen sizes
- **Optimized for** tablets, phones, and desktops

### UI Components
- **Emoji Picker** - Full emoji selection modal
- **Search Bar** - Instant user search
- **Avatar Display** - Profile pictures or initials
- **Status Icons** - Online/offline/typing indicators
- **Timestamp Display** - Relative and absolute time
- **Loading States** - Spinners and skeletons
- **Error Messages** - User-friendly error displays

## 🔌 Real-time Features

### WebSocket Events
All real-time features powered by Socket.io:

#### User Status
- `userOnline` - User comes online
- `userOffline` - User goes offline
- `userStatusChange` - Broadcast status to all users

#### Messaging
- `sendMessage` - Send a message
- `receiveMessage` - Receive a message
- `messageSent` - Confirmation of sent message
- `messageError` - Error sending message

#### Interactions
- `typing` - User is typing
- `userTyping` - Receive typing notification
- `markAsRead` - Mark message as read
- `messageRead` - Receive read receipt

## 📱 Pages & Navigation

### Login Page (`/login`)
- Username/password form
- Google Sign-in button
- Link to signup page
- Remember me functionality
- Error display

### Signup Page (`/signup`)
- Comprehensive registration form
  - Full Name
  - Username (unique)
  - Email (unique)
  - Phone number
  - Date of Birth
  - Gender selection
  - Password & confirmation
- Google Sign-in option
- Link to login page
- Form validation

### Chat Page (`/chat`)
- **Sidebar** with contacts list
- **Main chat window**
- **Message input** with emoji picker
- **Search functionality**
- **Settings menu**
- **Logout button**

### Protected Routes
- Automatic redirect to login if not authenticated
- Session persistence across page refreshes
- Token validation before showing protected content

## 🛠️ Technical Features

### Frontend Architecture
- **React 18** with functional components
- **TypeScript** for type safety
- **React Router** for navigation
- **Context API** for state management (Auth, Socket)
- **Vite** for fast development and building
- **Tailwind CSS** for styling

### Backend Architecture
- **Express.js** REST API
- **Socket.io** WebSocket server
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **bcryptjs** password hashing

### Database Models
- **User Model**
  - Personal information
  - Google ID (optional)
  - Avatar URL
  - Online status
  - Last seen timestamp
  
- **Conversation Model**
  - Participants array
  - Group flag
  - Last message reference
  - Timestamps
  
- **Message Model**
  - Sender reference
  - Conversation reference
  - Content
  - Type (text/image/video/etc)
  - Read status
  - Timestamps

### API Endpoints
Organized REST API with:
- **Auth routes** (`/api/auth/*`)
- **User routes** (`/api/users/*`)
- **Chat routes** (`/api/chats/*`)

### Error Handling
- Try-catch blocks in all async operations
- Meaningful error messages
- HTTP status codes
- Client-side error display
- Console logging for debugging

## 🚀 Performance Optimizations

### Frontend
- **Code splitting** with dynamic imports
- **Lazy loading** of components
- **Memoization** with React.memo
- **Debounced search** to reduce API calls
- **Optimistic UI updates**

### Backend
- **Database indexing** on frequently queried fields
- **Pagination** for message loading
- **Connection pooling** for MongoDB
- **Compression** of API responses

### WebSocket
- **Efficient event handling**
- **Room-based messaging** (only to participants)
- **Automatic reconnection**
- **Connection status tracking**

## 🔮 Future Features (Not Yet Implemented)

### Planned Features
- [ ] File sharing (images, videos, documents)
- [ ] Voice messages
- [ ] Video calling
- [ ] Audio calling
- [ ] Story/Status feature
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Message deletion
- [ ] Edit sent messages
- [ ] Push notifications
- [ ] Desktop notifications
- [ ] Dark/Light theme toggle
- [ ] Custom themes
- [ ] Stickers
- [ ] GIF support
- [ ] Link previews
- [ ] User blocking
- [ ] Report functionality
- [ ] Admin panel
- [ ] Analytics dashboard
- [ ] Export chat history
- [ ] Backup & restore

### Enhancement Ideas
- [ ] End-to-end encryption
- [ ] Self-destructing messages
- [ ] Scheduled messages
- [ ] Message pinning
- [ ] Custom emoji reactions
- [ ] Voice/video call recording
- [ ] Screen sharing
- [ ] Location sharing
- [ ] Contact card sharing
- [ ] QR code login
- [ ] Multi-device sync
- [ ] Message search
- [ ] Advanced filters
- [ ] User presence details
- [ ] Custom status messages

## 📊 Use Cases

### Personal Use
- Chat with friends and family
- Create group conversations
- Share updates in real-time
- See when friends are online

### Professional Use
- Team collaboration
- Quick messaging
- Group discussions
- Real-time updates

### Educational Use
- Student groups
- Class discussions
- Study groups
- Teacher-student communication

---

For implementation details, see the [README.md](./README.md) and [SETUP_GUIDE.md](./SETUP_GUIDE.md).
