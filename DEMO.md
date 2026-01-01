# Demo Mode (Without MongoDB)

If you want to demo the UI without setting up MongoDB, you can run the frontend in demo mode.

## Running Demo Mode

### 1. Start the Frontend Only

```bash
cd client
npm install
npm run dev
```

### 2. Access the Application

Open your browser to: **http://localhost:3000**

### 3. Demo Features

In demo mode (without backend connection):
- ✅ View the login page with Google Sign-in button
- ✅ View the signup page
- ✅ See the UI design and layout
- ❌ Cannot actually sign in/up (requires backend)
- ❌ Cannot send/receive messages (requires backend + MongoDB)

### 4. Full Setup (Required for Real Functionality)

To get full functionality including:
- User registration and login
- Real-time messaging
- Google OAuth
- Message history
- User search
- Typing indicators

You must:
1. Set up MongoDB (local, Docker, or Atlas)
2. Start the backend server
3. Configure environment variables

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete instructions.

## UI Preview

You can preview the UI design by:

1. **Login Page**: Beautiful gradient background with Google Sign-in
2. **Signup Page**: Instagram-inspired gradient with all fields
3. **Chat Page**: Will show "Please login" redirect (needs backend)

## Screenshots

The app features:
- 💚 WhatsApp-inspired green chat interface
- 💜 Instagram-inspired purple/pink gradients
- 📱 Fully responsive design
- 🎨 Modern, clean UI with Tailwind CSS
- 😊 Emoji picker integration
- 🔍 User search functionality

---

**Note**: For the full experience with real-time messaging, you must complete the full setup with MongoDB!
