const Message = require('../models/Message');
const Room = require('../models/Room');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Send a message to a room
// @route   POST /api/messages/room/:roomId
// @access  Private
const sendRoomMessage = async (req, res) => {
  try {
    const { content, replyTo } = req.body;
    const roomId = req.params.roomId;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member of the room
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to send messages to this room' });
    }

    // Check if replying to a valid message
    if (replyTo) {
      const replyMessage = await Message.findById(replyTo);
      if (!replyMessage || !replyMessage.room.equals(roomId)) {
        return res.status(400).json({ message: 'Invalid reply message' });
      }
    }

    // Create message
    const message = await Message.create({
      content,
      sender: req.user._id,
      room: roomId,
      replyTo: replyTo || null,
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `${req.protocol}://${req.get('host')}/${process.env.UPLOAD_DIR}/${req.file.filename}`
      } : null
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

    res.status(201).json(message);
  } catch (error) {
    console.error('Send room message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get messages from a room
// @route   GET /api/messages/room/:roomId
// @access  Private
const getRoomMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member of the room
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view messages in this room' });
    }

    // Get messages
    const messages = await Message.find({ room: roomId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      });

    // Mark messages as read by this user
    const messageIds = messages.map(message => message._id);
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        'readBy.user': { $ne: req.user._id }
      },
      { 
        $addToSet: { 
          readBy: { user: req.user._id, readAt: new Date() } 
        } 
      }
    );

    // Get total count for pagination
    const total = await Message.countDocuments({ room: roomId, isDeleted: false });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send a direct message
// @route   POST /api/messages/conversation/:userId
// @access  Private
const sendDirectMessage = async (req, res) => {
  try {
    const { content, replyTo } = req.body;
    const recipientId = req.params.userId;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot send message to self
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId]
      });
    }

    // Check if replying to a valid message
    if (replyTo) {
      const replyMessage = await Message.findById(replyTo);
      if (!replyMessage || !replyMessage.conversation.equals(conversation._id)) {
        return res.status(400).json({ message: 'Invalid reply message' });
      }
    }

    // Create message
    const message = await Message.create({
      content,
      sender: req.user._id,
      conversation: conversation._id,
      replyTo: replyTo || null,
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `${req.protocol}://${req.get('host')}/${process.env.UPLOAD_DIR}/${req.file.filename}`
      } : null
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

    res.status(201).json(message);
  } catch (error) {
    console.error('Send direct message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get messages from a conversation
// @route   GET /api/messages/conversation/:userId
// @access  Private
const getConversationMessages = async (req, res) => {
  try {
    const recipientId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Find conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });

    if (!conversation) {
      return res.json({
        messages: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    // Get messages
    const messages = await Message.find({ 
      conversation: conversation._id,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      });

    // Mark messages as read by this user
    const messageIds = messages.map(message => message._id);
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        'readBy.user': { $ne: req.user._id }
      },
      { 
        $addToSet: { 
          readBy: { user: req.user._id, readAt: new Date() } 
        } 
      }
    );

    // Reset unread count for this user
    const unreadCount = new Map(conversation.unreadCount);
    unreadCount.set(req.user._id.toString(), 0);
    
    await Conversation.findByIdAndUpdate(conversation._id, {
      unreadCount
    });

    // Get total count for pagination
    const total = await Message.countDocuments({ 
      conversation: conversation._id,
      isDeleted: false
    });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate({
        path: 'participants',
        select: 'username avatar status lastSeen'
      })
      .populate({
        path: 'lastMessage',
        select: 'content sender createdAt file'
      })
      .sort({ updatedAt: -1 });

    // Format conversations to include recipient info
    const formattedConversations = conversations.map(conv => {
      const recipient = conv.participants.find(
        p => p._id.toString() !== req.user._id.toString()
      );
      
      return {
        _id: conv._id,
        recipient: recipient,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount.get(req.user._id.toString()) || 0,
        updatedAt: conv.updatedAt
      };
    });

    res.json(formattedConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add reaction to a message
// @route   POST /api/messages/:messageId/reactions
// @access  Private
const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const messageId = req.params.messageId;

    // Check if message exists
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user has access to this message
    if (message.room) {
      const room = await Room.findById(message.room);
      if (!room || !room.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to react to this message' });
      }
    } else if (message.conversation) {
      const conversation = await Conversation.findById(message.conversation);
      if (!conversation || !conversation.participants.includes(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to react to this message' });
      }
    }

    // Remove existing reaction from this user if any
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== req.user._id.toString()
    );

    // Add new reaction
    message.reactions.push({
      emoji,
      user: req.user._id
    });

    await message.save();
    
    // Populate user info for reactions
    await message.populate({
      path: 'reactions.user',
      select: 'username avatar'
    });

    res.json(message.reactions);
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove reaction from a message
// @route   DELETE /api/messages/:messageId/reactions
// @access  Private
const removeReaction = async (req, res) => {
  try {
    const messageId = req.params.messageId;

    // Check if message exists
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Remove reaction
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== req.user._id.toString()
    );

    await message.save();
    
    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  sendRoomMessage,
  getRoomMessages,
  sendDirectMessage,
  getConversationMessages,
  getConversations,
  addReaction,
  removeReaction
};
