# Contributing to Chat App

Thank you for your interest in contributing to the **Chat App** project! 🎉

This is a full-stack social media and real-time messaging platform built with React, Node.js, Socket.io, and MongoDB. We welcome contributions of all kinds — new features, bug fixes, documentation improvements, and more.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [What Can I Work On?](#what-can-i-work-on)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [How to Raise a Pull Request](#how-to-raise-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Review Process](#review-process)

## Code of Conduct

By participating in this project, you agree to be respectful and constructive in all interactions. Please:

- Be kind and considerate to other contributors
- Use welcoming and inclusive language
- Accept constructive criticism gracefully
- Focus on what is best for the community and the project

## How Can I Contribute?

There are many ways to contribute, regardless of your skill level:

| Contribution Type | Description |
|---|---|
| 🐛 **Bug Fixes** | Find and fix bugs in the codebase |
| ✨ **New Features** | Implement features from the roadmap or propose your own |
| 📝 **Documentation** | Improve README, add guides, or write inline code comments |
| 🎨 **UI/UX Improvements** | Enhance styling, responsiveness, or user experience |
| 🧪 **Testing** | Write tests or improve test coverage |
| ♻️ **Refactoring** | Improve code quality, readability, or performance |
| 🌐 **Translations** | Help translate the app into other languages |

## What Can I Work On?

### 🚀 Features Roadmap (Open for Contributions)

The following features are planned and ready for contributors to pick up:

- **Message reactions** — Add emoji reactions to individual messages
- **Message forwarding** — Allow users to forward messages to other chats
- **Voice messages** — Record and send audio messages in chats
- **Story creation UI** — Improve the UI for creating and viewing stories
- **Story viewer modal** — Build a full-screen story viewer with navigation
- **Advanced search filters** — Add filters for searching messages, users, and posts
- **Notifications system** — Push and in-app notifications for messages, follows, likes, etc.
- **Message encryption** — End-to-end encryption for private chats
- **GIF support** — Integrate a GIF picker (e.g., Giphy or Tenor)
- **Message editing and deletion** — Let users edit or delete sent messages
- **Profile verification badges** — Add verified badges for user profiles
- **Trending posts** — Display trending/popular posts on the feed
- **Hashtag system** — Support hashtags in posts with search/filtering

### 🐛 Bug Fixes & Improvements

Look through the [open issues](https://github.com/Harihkvent/chat-app/issues) for bugs to fix. Common areas that may need attention:

- **WebRTC calling** — Connectivity issues with NAT/firewall traversal
- **Socket.io reconnection** — Handle edge cases when the connection drops
- **File upload handling** — Large file support, file type validation
- **Responsive design** — Layout issues on specific screen sizes
- **Performance** — Optimize rendering for large message lists or feeds

### 💡 Have Your Own Idea?

If you have an idea that isn't on the roadmap, [open an issue](https://github.com/Harihkvent/chat-app/issues/new) first to discuss it with the maintainers before starting work.

## Development Setup

### Prerequisites

Make sure you have the following installed:

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **MongoDB** (local, Docker, or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Redis** (optional — only needed for horizontal scaling)
- **Docker & Docker Compose** (optional but recommended for MongoDB)
- **Git**

### Step 1: Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/chat-app.git
cd chat-app
```

### Step 2: Set Up MongoDB

**Using Docker (recommended):**
```bash
docker-compose up -d
```

**Or use a local MongoDB installation or MongoDB Atlas.** See the [README](README.md) for full details.

### Step 3: Configure Environment Variables

**Backend** — Create `server/.env`:
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/chatapp
# For Docker: mongodb://root:example@localhost:27017/chatapp?authSource=admin
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_CLIENT_ID=your_google_client_id_here  # Optional
# REDIS_URL=redis://localhost:6379            # Optional
```

**Frontend** — Create `client/.env`:
```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here  # Optional
```

### Step 4: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 5: Run the Development Servers

Open two terminal windows:

```bash
# Terminal 1 — Backend
cd server
npm run dev
# Runs on http://localhost:4000

# Terminal 2 — Frontend
cd client
npm run dev
# Runs on http://localhost:5173
```

### Step 6: Verify Everything Works

1. Open http://localhost:5173 in your browser
2. Create a test account or sign in with Google
3. Try sending a message to verify real-time communication

## Project Structure

```
chat-app/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React context providers
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Page-level components
│   │   ├── styles/          # CSS/Tailwind styles
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── middleware/      # Auth & request middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API route handlers
│   │   ├── store.ts         # In-memory state store
│   │   └── index.ts         # Server entry point
│   ├── uploads/             # File uploads directory
│   └── package.json
├── docs/                    # Documentation files
├── docker-compose.yml       # MongoDB Docker setup
└── README.md
```

## Coding Guidelines

### General Rules

- **TypeScript** — All code must be written in TypeScript
- **Consistent style** — Follow the existing code patterns and conventions in the codebase
- **Meaningful names** — Use clear, descriptive variable and function names
- **Small functions** — Keep functions focused on a single responsibility
- **No console.log in production code** — Remove debug logging before submitting

### Frontend (React + Vite)

- Use **functional components** with React hooks
- Use **Tailwind CSS** classes for styling (avoid inline styles or separate CSS files)
- Follow the existing component structure in `client/src/components/`
- Use **Axios** for HTTP requests and **Socket.io-client** for real-time events
- Run the linter before committing:
  ```bash
  cd client
  npm run lint
  ```

### Backend (Node.js + Express)

- Use **Express.js** routing patterns as seen in `server/src/routes/`
- Use **Mongoose** models for database operations
- Add proper error handling with try/catch blocks
- Validate request inputs before processing
- Use the middleware patterns in `server/src/middleware/`

### Commit Messages

Write clear, concise commit messages:

```
feat: add emoji reactions to messages
fix: resolve WebRTC connection timeout on slow networks
docs: update API endpoint documentation
style: fix responsive layout on mobile devices
refactor: extract message parsing into utility function
```

**Prefixes:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — UI/styling changes (no logic changes)
- `refactor:` — Code restructuring (no behavior changes)
- `test:` — Adding or updating tests
- `chore:` — Build process, dependencies, or tooling changes

## How to Raise a Pull Request

### Step 1: Create a Branch

Always create a new branch from the latest `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

**Branch naming convention:**
- `feature/description` — For new features (e.g., `feature/message-reactions`)
- `fix/description` — For bug fixes (e.g., `fix/socket-reconnection`)
- `docs/description` — For documentation changes (e.g., `docs/api-endpoints`)

### Step 2: Make Your Changes

- Write clean, well-structured code
- Follow the [Coding Guidelines](#coding-guidelines)
- Test your changes locally

### Step 3: Verify Your Changes

```bash
# Run the frontend linter
cd client
npm run lint

# Build the frontend to check for errors
npm run build

# Build the backend to check for TypeScript errors
cd ../server
npm run build
```

### Step 4: Commit and Push

```bash
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

### Step 5: Open a Pull Request

1. Go to the [chat-app repository](https://github.com/Harihkvent/chat-app) on GitHub
2. Click **"Compare & pull request"**
3. Fill in the PR template:
   - **Title**: A clear summary of the change
   - **Description**: Explain what you changed and why
   - **Screenshots**: Include screenshots for any UI changes
   - **Testing**: Describe how you tested your changes
4. Submit the pull request

### Pull Request Checklist

Before submitting your PR, make sure:

- [ ] Your code compiles and runs without errors
- [ ] You have tested your changes locally
- [ ] The frontend linter passes (`npm run lint` in `client/`)
- [ ] The frontend and backend build successfully
- [ ] You have written clear commit messages
- [ ] You have updated documentation if needed
- [ ] Your PR is focused on a single feature or fix
- [ ] Screenshots are attached for any UI changes

## Reporting Bugs

If you find a bug, please [open an issue](https://github.com/Harihkvent/chat-app/issues/new) with the following information:

1. **Description** — What happened?
2. **Steps to Reproduce** — How can we reproduce the bug?
3. **Expected Behavior** — What should have happened?
4. **Actual Behavior** — What happened instead?
5. **Screenshots** — If applicable, add screenshots
6. **Environment** — Browser, OS, Node.js version, etc.

## Suggesting Features

To suggest a new feature:

1. Check the [Features Roadmap](#-features-roadmap-open-for-contributions) to see if it's already planned
2. Check existing [issues](https://github.com/Harihkvent/chat-app/issues) to avoid duplicates
3. [Open a new issue](https://github.com/Harihkvent/chat-app/issues/new) with:
   - A clear title and description of the feature
   - The problem it solves or the value it adds
   - Any mockups or examples if applicable

## Review Process

1. A maintainer will review your PR, usually within a few days
2. You may be asked to make changes — this is normal and part of the process
3. Once approved, your PR will be merged into `main`
4. Your contribution will be acknowledged in the project 🎉

---

Thank you for helping make Chat App better! Every contribution, no matter how small, makes a difference. 💚
