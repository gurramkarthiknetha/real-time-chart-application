# chart application

A real-time chat application built with Socket.IO and React.

## Features

- Real-time messaging with Socket.IO
- User presence (join/leave notifications)
- Typing indicators
- Online users list
- Responsive design

## Tech Stack

### Backend
- Node.js
- Express
- Socket.IO

### Frontend
- React
- Vite
- Socket.IO Client
- Styled Components

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/akka-chat.git
cd akka-chat
```

2. Install dependencies for the server
```bash
cd server
npm install
```

3. Install dependencies for the client
```bash
cd ../client
npm install
```

### Running the Application

1. Start the server
```bash
cd server
npm run dev
```

2. Start the client in a new terminal
```bash
cd client
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
akka/
├── server/             # Backend Node.js with Express and Socket.IO
│   ├── package.json
│   ├── server.js       # Main server file
│   └── .env            # Environment variables
│
└── client/             # Frontend React application
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Chat.jsx
    │   │   ├── MessageInput.jsx
    │   │   ├── MessageList.jsx
    │   │   └── UserList.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── styles/
    └── package.json
```

## License

MIT
