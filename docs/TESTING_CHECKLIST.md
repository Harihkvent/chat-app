# 🧪 Feature Testing Checklist

Use this checklist to systematically test all implemented features.

## 🔐 Authentication
- [ ] Sign up with email and password
- [ ] Login with existing account
- [ ] Login with Google OAuth
- [ ] Session persists after page refresh
- [ ] Logout clears session

## 📱 Navigation
- [ ] Navigation bar appears on all pages
- [ ] Home icon navigates to feed
- [ ] Message icon navigates to chat
- [ ] Plus icon opens create post modal
- [ ] Profile icon navigates to profile
- [ ] Active page is highlighted
- [ ] Logout button works

## 📰 Feed & Posts

### View Feed
- [ ] Feed page loads without errors
- [ ] Story rings appear at top
- [ ] Posts from followed users appear
- [ ] Own posts appear in feed
- [ ] Posts display correctly (image, caption, stats)
- [ ] Empty state shows when no posts

### Create Post
- [ ] Click plus icon opens modal
- [ ] Can enter caption
- [ ] Can add image URL
- [ ] Image preview works
- [ ] Share button creates post
- [ ] New post appears in feed
- [ ] Post count increments on profile

### Interact with Posts
- [ ] Like button works (heart icon)
- [ ] Like count updates
- [ ] Like persists after refresh
- [ ] Unlike works
- [ ] Comment button is visible
- [ ] View comments link shows
- [ ] Can add comments
- [ ] Comment count updates

## 📖 Stories

### View Stories
- [ ] Story rings appear on feed page
- [ ] Can click on story ring
- [ ] Story viewer opens
- [ ] Story displays correctly
- [ ] Can swipe/navigate between stories
- [ ] Viewer count shows for own stories

### Create Story
- [ ] Can create new story
- [ ] Media URL input works
- [ ] Caption optional
- [ ] Story appears after creation
- [ ] Story shows in ring at top
- [ ] Story auto-expires after 24h

### Story Interactions
- [ ] View count increments
- [ ] Viewers list shows (for own stories)
- [ ] Cannot view expired stories
- [ ] Can delete own stories

## 👤 Profile

### View Profile
- [ ] Own profile accessible via nav
- [ ] Profile shows avatar/name/username
- [ ] Bio displays if set
- [ ] Website link works
- [ ] Stats show (posts/followers/following)
- [ ] Posts grid displays
- [ ] Can view other users' profiles

### Edit Profile
- [ ] Edit button appears on own profile
- [ ] Can update name
- [ ] Can update username
- [ ] Can update bio
- [ ] Can update website
- [ ] Can update avatar URL
- [ ] Can toggle privacy
- [ ] Changes save successfully
- [ ] Changes reflect immediately

### Posts Grid
- [ ] Posts display in 3-column grid
- [ ] Hover shows likes/comments count
- [ ] Click opens post detail (if implemented)
- [ ] Empty state shows if no posts

## 🤝 Follow System

### Follow/Unfollow
- [ ] Follow button on other profiles
- [ ] Click to follow works
- [ ] Button changes to "Following"
- [ ] Follower count updates
- [ ] Posts appear in feed after following
- [ ] Unfollow works
- [ ] Counts update correctly

### Followers/Following Lists
- [ ] Can view followers list
- [ ] Can view following list
- [ ] Lists show user info
- [ ] Can navigate to user profiles

## 💬 Chat - Basic

### One-on-One Chat
- [ ] Can start chat with contact
- [ ] Messages send successfully
- [ ] Messages display in bubbles
- [ ] Own messages on right (colored)
- [ ] Others' messages on left (white)
- [ ] Messages show timestamp
- [ ] Scroll to bottom on new message

### Typing Indicators
- [ ] "typing..." appears when other user types
- [ ] Indicator disappears after 1 second
- [ ] Indicator shows in chat header
- [ ] Works in real-time

### Read Receipts
- [ ] Single checkmark (✓) when delivered
- [ ] Double checkmark (✓✓) when read
- [ ] Marks update in real-time
- [ ] Works for both sent and received

### Online Status
- [ ] Green dot shows when user online
- [ ] "online" text shows in header
- [ ] "offline" shows when disconnected
- [ ] Status updates in real-time

## 👥 Group Chats

### Create Group
- [ ] Can create new group
- [ ] Must enter group name
- [ ] Must select 2+ members
- [ ] Search contacts works
- [ ] Selected members show checkmark
- [ ] Member count updates
- [ ] Create button works
- [ ] Group appears in chat list

### Group Management
- [ ] Group info shows (name, members)
- [ ] Can view group details
- [ ] Admins can add members
- [ ] Admins can remove members
- [ ] Admins can update group name
- [ ] Admins can set description
- [ ] Admins can change avatar
- [ ] Can promote members to admin
- [ ] Non-admins have limited access

### Group Messaging
- [ ] Messages deliver to all members
- [ ] Can see who sent message
- [ ] Typing indicators work
- [ ] Read receipts show multiple readers
- [ ] All members can send messages
- [ ] Group notifications work

## 🔍 Search & Discovery

### Search Users
- [ ] Search bar in navigation
- [ ] Can search by name
- [ ] Can search by username
- [ ] Can search by email
- [ ] Results appear quickly
- [ ] Can click to view profile

## 🔔 Real-time Features

### Socket Connection
- [ ] Connection establishes on login
- [ ] User goes online automatically
- [ ] Disconnection handled gracefully
- [ ] Reconnection works

### Real-time Updates
- [ ] New messages arrive instantly
- [ ] Typing indicators update live
- [ ] Read receipts update live
- [ ] Online status updates live
- [ ] New posts appear without refresh

## 📊 Data Persistence

### After Refresh
- [ ] User stays logged in
- [ ] Feed loads correctly
- [ ] Messages history intact
- [ ] Profile data intact
- [ ] Following relationships persist
- [ ] Likes and comments persist

## 🎨 UI/UX

### Responsive Design
- [ ] Works on desktop
- [ ] Works on tablet
- [ ] Works on mobile
- [ ] Navigation adapts
- [ ] Modals are responsive

### Visual Polish
- [ ] Animations smooth
- [ ] Loading states show
- [ ] Error messages clear
- [ ] Success feedback given
- [ ] Icons display correctly
- [ ] Images load properly
- [ ] Layout is clean

## 🐛 Error Handling

### Network Errors
- [ ] Offline handling works
- [ ] Error messages show
- [ ] Can retry actions
- [ ] Graceful degradation

### Validation
- [ ] Empty post prevented
- [ ] Invalid URLs caught
- [ ] Required fields enforced
- [ ] Character limits respected

## 🔐 Security

### Authentication
- [ ] Cannot access without login
- [ ] Token expires properly
- [ ] Protected routes work
- [ ] Own content only editable by self

### Authorization
- [ ] Can only delete own posts
- [ ] Can only delete own stories
- [ ] Group admins have proper permissions
- [ ] Private profiles respected

## 📈 Performance

### Loading Times
- [ ] Feed loads quickly
- [ ] Messages load quickly
- [ ] Profile loads quickly
- [ ] Images load efficiently

### Optimization
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] Quick interactions
- [ ] Efficient re-renders

---

## 🎯 Testing Scenarios

### Scenario 1: New User Journey
1. Sign up for new account
2. Complete profile (add bio, avatar)
3. Search and follow 2-3 users
4. View feed (should be empty or show followed users)
5. Create first post
6. Create first story
7. Start chat with a contact

### Scenario 2: Social Interaction
1. Login as User A
2. Create a post
3. Login as User B (different browser)
4. Follow User A
5. See User A's post in feed
6. Like and comment on post
7. Verify User A sees interaction

### Scenario 3: Group Chat
1. Create group with 3+ members
2. Send message in group
3. Verify all members receive
4. Check typing indicators work
5. Check read receipts show all readers
6. Add new member as admin
7. Remove a member

### Scenario 4: Story Lifecycle
1. Create a story
2. View as another user
3. Check viewers list
4. Wait for expiration (or modify time)
5. Verify story disappears
6. Check it's removed from database

### Scenario 5: Real-time Features
1. Open two browser windows
2. Login as different users
3. Start chat between them
4. Send message from User A
5. Verify instant delivery to User B
6. Type in User A's window
7. Verify "typing..." shows for User B
8. Read message in User B's window
9. Verify double checkmark for User A

---

## ✅ Success Criteria

All features should:
- Work without console errors
- Handle edge cases gracefully
- Provide user feedback
- Update in real-time
- Persist data correctly
- Be responsive and fast
- Have good UX

---

## 📝 Notes

- Use multiple browsers/incognito for multi-user testing
- Check browser console for errors
- Monitor network tab for API calls
- Test on different screen sizes
- Try edge cases (empty inputs, special characters, etc.)

---

**Testing Status:** Ready for comprehensive testing!
