# 🚀 Quick Start Guide - Enhanced Chat App

## Overview
Your chat app now includes features from WhatsApp and Instagram:
- ✅ Group Chats
- ✅ Typing Indicators
- ✅ Read Receipts (Double Checkmarks)
- ✅ Instagram-style Feed
- ✅ Posts with Images
- ✅ Stories (24h expiration)
- ✅ User Profiles
- ✅ Follow/Unfollow System
- ✅ Comments and Likes

## 🏃 Running the App

### 1. Start the Server
```bash
cd server
npm run dev
```
Server runs on: `http://localhost:4000`

### 2. Start the Client
```bash
cd client
npm run dev
```
Client runs on: `http://localhost:5173`

### 3. Access the App
Open your browser and navigate to: `http://localhost:5173`

## 📱 Using the Features

### Authentication
1. **Sign Up**: Create a new account at `/signup`
2. **Login**: Login at `/login`
3. **Google OAuth**: Available for quick sign-in

### Feed & Posts
1. Click **Home icon** in the navigation to view your feed
2. Click **+ (Plus) icon** to create a new post
3. Add an image URL and caption
4. Click **Share** to post
5. **Like**: Click the heart icon
6. **Comment**: Click the comment icon
7. **Bookmark**: Click the bookmark icon (coming soon)

### Stories
1. Stories appear at the top of the feed
2. Click on a story ring to view
3. Create your own story from the feed page
4. Stories auto-delete after 24 hours

### Profile
1. Click your **avatar** in the navigation
2. View your posts, followers, and following
3. Click **Edit Profile** to update:
   - Name
   - Username
   - Bio
   - Website
   - Avatar
   - Privacy settings

### Following System
1. Visit another user's profile
2. Click **Follow** button
3. Their posts will appear in your feed
4. View your **Followers** and **Following** lists

### Chat (Enhanced)
1. Click **Message icon** in navigation
2. Start a 1-on-1 chat with any contact
3. **Create Group**: Click the group icon
   - Select 2+ members
   - Name your group
4. **Features**:
   - Real-time messaging
   - Typing indicators ("typing...")
   - Read receipts (✓✓ for read, ✓ for delivered)
   - Group messaging

## 🎯 Testing the Features

### Test Scenario 1: Social Features
1. Create 2-3 user accounts
2. Follow each other
3. Create posts from different accounts
4. Like and comment on posts
5. Check that posts appear in followers' feeds

### Test Scenario 2: Stories
1. Create a story
2. View from another account
3. Check viewers list (as story creator)
4. Wait 24 hours to see auto-deletion (or modify expiration for testing)

### Test Scenario 3: Group Chat
1. Create a group with 3+ members
2. Send messages in the group
3. Check typing indicators
4. Verify all members receive messages
5. Check read receipts (double checkmarks)

### Test Scenario 4: Read Receipts
1. Send a message to another user
2. See single checkmark (✓) when delivered
3. Wait for recipient to read
4. See double checkmark (✓✓) when read

## 🔧 Troubleshooting

### Issue: Posts not showing in feed
**Solution**: Make sure you're following the user who created the post

### Issue: Stories not appearing
**Solution**: 
- Check that the story hasn't expired (24h)
- Ensure you're following the user
- Verify the media URL is valid

### Issue: Can't create group
**Solution**: Select at least 2 members and provide a group name

### Issue: Messages not delivering
**Solution**: 
- Check that both users are online
- Check browser console for errors
- Verify WebSocket connection is established

### Issue: Read receipts not working
**Solution**:
- Ensure both users are connected
- Check that messages are being marked as read
- Verify WebSocket events are firing

## 📝 Important Notes

### Image URLs
Currently, the app uses image URLs instead of file uploads. You can use:
- Unsplash: `https://source.unsplash.com/random/800x600`
- Placeholder services: `https://via.placeholder.com/800x600`
- Your own hosted images

### Story Expiration
Stories automatically expire after 24 hours. The backend has a pre-save hook that sets the expiration time.

### Group Administration
- Group creator is automatically an admin
- Admins can:
  - Add/remove members
  - Promote other admins
  - Update group info (name, description, avatar)

### Privacy Settings
- Set profile to private to control who can follow you
- Public profiles are visible to all users

## 🌐 API Endpoints

### Posts
- `GET /api/posts/feed` - Get your personalized feed
- `POST /api/posts` - Create a post
- `POST /api/posts/:id/like` - Like/unlike a post
- `POST /api/posts/:id/comments` - Add a comment

### Stories
- `GET /api/stories` - Get stories from followed users
- `POST /api/stories` - Create a story
- `POST /api/stories/:id/view` - Mark story as viewed

### Users
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/follow` - Follow a user
- `DELETE /api/users/:id/follow` - Unfollow a user

### Groups
- `POST /api/chats/groups` - Create a group
- `POST /api/chats/groups/:id/members` - Add members
- `PATCH /api/chats/groups/:id` - Update group info

## 💡 Tips

1. **Create Multiple Test Accounts**: Use different browsers or incognito mode
2. **Test Real-time Features**: Keep two browser windows open side-by-side
3. **Check Console**: Useful for debugging WebSocket events
4. **Network Tab**: Monitor API calls and responses

## 🎨 Customization

### Change Colors
Edit `client/tailwind.config.js` to customize the theme

### Add More Features
Check `NEW_FEATURES.md` for the full feature list and future enhancements

### Modify Layouts
All components are in `client/src/components/` and `client/src/pages/`

## 🐛 Known Issues

1. **File Upload**: Currently using URLs instead of file uploads (can be added)
2. **Notifications**: Not yet implemented (can be added)
3. **Video Stories**: Supported in backend but needs player UI
4. **Message Search**: Not yet implemented

## 📚 Next Steps

1. Add file upload functionality
2. Implement push notifications
3. Add video call feature
4. Implement message search
5. Add emoji reactions to messages
6. Create story highlights
7. Add explore page
8. Implement hashtags

## 🤝 Support

For questions or issues:
1. Check the console for error messages
2. Review the `NEW_FEATURES.md` documentation
3. Check MongoDB connection status
4. Verify all dependencies are installed

---

**Happy Chatting! 🎉**
