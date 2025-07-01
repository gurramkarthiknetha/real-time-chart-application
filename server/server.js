const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const { socketAuth } = require('./middleware/auth');

// Routes
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use(`/${process.env.UPLOAD_DIR}`, express.static(path.join(__dirname, process.env.UPLOAD_DIR)));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// Base route
app.get('/', (_, res) => {
  res.send('chart application Server is running');
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Default Vite dev server port
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Import models
const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Authenticate user (optional at first connection)
  socket.on('authenticate', async ({ token }) => {
    try {
      // Verify token and get user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        socket.emit('auth_error', { message: 'User not found' });
        return;
      }

      // Store user info in socket
      socket.data.user = user;
      socket.data.authenticated = true;

      // Update user status to online
      user.status = 'online';
      user.lastSeen = Date.now();
      await user.save();

      // Join user's rooms
      const rooms = await Room.find({ members: user._id });
      rooms.forEach(room => {
        socket.join(`room:${room._id}`);
      });

      // Join user's private channel for direct messages
      socket.join(`user:${user._id}`);

      // Notify friends that user is online
      io.to(`friends:${user._id}`).emit('friend_status_changed', {
        userId: user._id,
        status: 'online'
      });

      socket.emit('authenticated', { user: user.toJSON() });

      console.log(`User authenticated: ${user.username} (${socket.id})`);
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  // Legacy join chat for non-authenticated users
  socket.on('join_chat', (username) => {
    // Store username in socket for later use
    socket.data.username = username;
    socket.data.authenticated = false;

    // Broadcast to all clients that a new user has joined
    io.emit('user_joined', {
      id: socket.id,
      username,
      message: `${username} has joined the chat`
    });

    // Send current users list to the new user
    const users = [];
    for (const [id, socket] of io.of('/').sockets) {
      if (socket.data.username || (socket.data.user && socket.data.user.username)) {
        users.push({
          id,
          username: socket.data.username || socket.data.user.username
        });
      }
    }
    io.emit('users_list', users);
  });

  // Join a room
  socket.on('join_room', async ({ roomId }) => {
    if (!socket.data.authenticated && !socket.data.username) {
      socket.emit('error', { message: 'You must be authenticated or have a username to join a room' });
      return;
    }

    try {
      // If authenticated, check if user is a member of the room
      if (socket.data.authenticated) {
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.isPrivate && !room.members.includes(socket.data.user._id)) {
          socket.emit('error', { message: 'You are not a member of this room' });
          return;
        }
      }

      // Join the room
      socket.join(`room:${roomId}`);

      // Notify room members
      const username = socket.data.authenticated
        ? socket.data.user.username
        : socket.data.username;

      socket.to(`room:${roomId}`).emit('user_joined_room', {
        roomId,
        user: {
          id: socket.id,
          username
        }
      });

      console.log(`${username} joined room: ${roomId}`);
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave a room
  socket.on('leave_room', ({ roomId }) => {
    socket.leave(`room:${roomId}`);

    const username = socket.data.authenticated
      ? socket.data.user.username
      : socket.data.username || 'Anonymous';

    socket.to(`room:${roomId}`).emit('user_left_room', {
      roomId,
      user: {
        id: socket.id,
        username
      }
    });

    console.log(`${username} left room: ${roomId}`);
  });

  // Send message to room
  socket.on('send_room_message', async (data) => {
    try {
      const { roomId, content, replyTo, file } = data;

      if (!socket.data.authenticated && !socket.data.username) {
        socket.emit('error', { message: 'You must be authenticated or have a username to send messages' });
        return;
      }

      let messageData = {
        roomId,
        content,
        sender: {
          id: socket.id,
          username: socket.data.authenticated ? socket.data.user.username : socket.data.username
        },
        timestamp: new Date().toISOString()
      };

      // If authenticated, save message to database
      if (socket.data.authenticated) {
        // Create message in database
        const message = await Message.create({
          content,
          sender: socket.data.user._id,
          room: roomId,
          replyTo: replyTo || null,
          file: file || null
        });

        // Populate sender info
        await message.populate('sender', 'username avatar');

        // If replying, populate reply info
        if (replyTo) {
          await message.populate({
            path: 'replyTo',
            select: 'content sender',
            populate: {
              path: 'sender',
              select: 'username avatar'
            }
          });
        }

        messageData = {
          ...messageData,
          _id: message._id,
          sender: {
            _id: message.sender._id,
            username: message.sender.username,
            avatar: message.sender.avatar
          },
          replyTo: message.replyTo,
          file: message.file
        };
      }

      // Broadcast the message to all clients in the room
      io.to(`room:${roomId}`).emit('receive_room_message', messageData);
    } catch (error) {
      console.error('Send room message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Send direct message
  socket.on('send_direct_message', async (data) => {
    try {
      const { recipientId, content, replyTo, file } = data;

      if (!socket.data.authenticated) {
        socket.emit('error', { message: 'You must be authenticated to send direct messages' });
        return;
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [socket.data.user._id, recipientId] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [socket.data.user._id, recipientId]
        });
      }

      // Create message
      const message = await Message.create({
        content,
        sender: socket.data.user._id,
        conversation: conversation._id,
        replyTo: replyTo || null,
        file: file || null
      });

      // Update conversation with last message and increment unread count
      const unreadCount = new Map(conversation.unreadCount);
      unreadCount.set(recipientId, (unreadCount.get(recipientId) || 0) + 1);

      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: message._id,
        unreadCount
      });

      // Populate sender info
      await message.populate('sender', 'username avatar');

      // If replying, populate reply info
      if (replyTo) {
        await message.populate({
          path: 'replyTo',
          select: 'content sender',
          populate: {
            path: 'sender',
            select: 'username avatar'
          }
        });
      }

      const messageData = {
        _id: message._id,
        content: message.content,
        sender: {
          _id: message.sender._id,
          username: message.sender.username,
          avatar: message.sender.avatar
        },
        conversationId: conversation._id,
        replyTo: message.replyTo,
        file: message.file,
        timestamp: message.createdAt
      };

      // Send to recipient
      io.to(`user:${recipientId}`).emit('receive_direct_message', messageData);

      // Send back to sender
      socket.emit('receive_direct_message', messageData);
    } catch (error) {
      console.error('Send direct message error:', error);
      socket.emit('error', { message: 'Failed to send direct message' });
    }
  });

  // Mark messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { messageIds } = data;

      if (!socket.data.authenticated) {
        socket.emit('error', { message: 'You must be authenticated to mark messages as read' });
        return;
      }

      // Update messages
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          'readBy.user': { $ne: socket.data.user._id }
        },
        {
          $addToSet: {
            readBy: { user: socket.data.user._id, readAt: new Date() }
          }
        }
      );

      // Find conversations for these messages and reset unread count
      const messages = await Message.find({ _id: { $in: messageIds } });
      const conversationIds = [...new Set(
        messages
          .filter(msg => msg.conversation)
          .map(msg => msg.conversation.toString())
      )];

      for (const convId of conversationIds) {
        const conversation = await Conversation.findById(convId);
        if (conversation) {
          const unreadCount = new Map(conversation.unreadCount);
          unreadCount.set(socket.data.user._id.toString(), 0);

          await Conversation.findByIdAndUpdate(convId, { unreadCount });
        }
      }

      socket.emit('messages_marked_read', { messageIds });
    } catch (error) {
      console.error('Mark messages read error:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Add reaction to message
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, emoji } = data;

      if (!socket.data.authenticated) {
        socket.emit('error', { message: 'You must be authenticated to add reactions' });
        return;
      }

      // Find message
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Remove existing reaction from this user if any
      message.reactions = message.reactions.filter(
        reaction => reaction.user.toString() !== socket.data.user._id.toString()
      );

      // Add new reaction
      message.reactions.push({
        emoji,
        user: socket.data.user._id
      });

      await message.save();

      // Populate user info for reactions
      await message.populate({
        path: 'reactions.user',
        select: 'username avatar'
      });

      // Determine where to send the reaction update
      let recipients = [];
      if (message.room) {
        recipients = [`room:${message.room}`];
      } else if (message.conversation) {
        const conversation = await Conversation.findById(message.conversation);
        if (conversation) {
          recipients = conversation.participants.map(p => `user:${p}`);
        }
      }

      // Send reaction update
      const reactionData = {
        messageId,
        reactions: message.reactions.map(r => ({
          emoji: r.emoji,
          user: {
            _id: r.user._id,
            username: r.user.username,
            avatar: r.user.avatar
          }
        }))
      };

      recipients.forEach(recipient => {
        io.to(recipient).emit('message_reaction_updated', reactionData);
      });
    } catch (error) {
      console.error('Add reaction error:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { roomId, conversationId, isTyping } = data;

    const username = socket.data.authenticated
      ? socket.data.user.username
      : socket.data.username || 'Anonymous';

    const typingData = {
      id: socket.id,
      username,
      isTyping
    };

    if (roomId) {
      socket.to(`room:${roomId}`).emit('user_typing', {
        ...typingData,
        roomId
      });
    } else if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        ...typingData,
        conversationId
      });
    } else {
      // Legacy global typing
      socket.broadcast.emit('user_typing', typingData);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    // If authenticated, update user status
    if (socket.data.authenticated && socket.data.user) {
      try {
        const user = await User.findById(socket.data.user._id);
        if (user) {
          user.status = 'offline';
          user.lastSeen = Date.now();
          await user.save();

          // Notify friends that user is offline
          io.to(`friends:${user._id}`).emit('friend_status_changed', {
            userId: user._id,
            status: 'offline'
          });
        }

        console.log(`User disconnected: ${user.username} (${socket.id})`);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    } else if (socket.data.username) {
      // Legacy non-authenticated user
      console.log(`User disconnected: ${socket.id} (${socket.data.username})`);

      // Notify all clients that a user has left
      io.emit('user_left', {
        id: socket.id,
        username: socket.data.username,
        message: `${socket.data.username} has left the chat`
      });

      // Update users list
      const users = [];
      for (const [id, socket] of io.of('/').sockets) {
        if (socket.data.username || (socket.data.user && socket.data.user.username)) {
          users.push({
            id,
            username: socket.data.username || socket.data.user.username
          });
        }
      }
      io.emit('users_list', users);
    } else {
      console.log(`Socket disconnected: ${socket.id}`);
    }
  });
});

// Start the server with error handling for port conflicts
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Try to find an available port
    const tryPort = (port) => {
      server.once('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
          tryPort(port + 1);
        } else {
          console.error('Server error:', error);
          process.exit(1);
        }
      });

      server.once('listening', () => {
        const address = server.address();
        const actualPort = address.port;
        console.log(`Server running on port ${actualPort}`);

        // Log the URLs for easy reference
        console.log(`API URL: http://localhost:${actualPort}/api`);
        console.log(`Socket URL: http://localhost:${actualPort}`);
        console.log(`Update your client .env file with these URLs if needed`);
      });

      server.listen(port);
    };

    // Start with the initial port
    tryPort(PORT);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
