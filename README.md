# chat-app

A real-time chat application built with modern web technologies.

## Features

- Real-time messaging with instant updates
- User authentication and authorization
- Multiple chat rooms and private messaging
- File sharing and emoji support
- Message history and search
- Online/offline status indicators
- Read receipts
- Responsive design for mobile and desktop
- Dark/Light theme support

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Socket.io-client
- Redux Toolkit for state management
- React Router v6

### Backend
- Node.js
- Express.js
- Socket.io
- MongoDB
- JWT Authentication
- REST API

## Prerequisites

- Node.js 18.x or higher
- MongoDB
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chat-app.git
   cd chat-app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

3. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

## Development

1. **Start MongoDB**
   ```bash
   mongod
   ```

2. **Run backend server**
   ```bash
   cd server
   npm run dev
   ```

3. **Run frontend development server**
   ```bash
   cd client
   npm start
   ```

The app will be available at `http://localhost:3000`

## API Documentation

API endpoints are available at `http://localhost:5000/api`

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/messages` - Get chat messages
- `POST /api/messages` - Send new message

## Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## Deployment

1. Build the frontend:
   ```bash
   cd client
   npm run build
   ```

2. Start production server:
   ```bash
   cd server
   npm start
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE)