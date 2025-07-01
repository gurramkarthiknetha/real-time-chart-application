const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { _id: false });

const readReceiptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: function() {
      return !this.file; // Content is required if there's no file
    },
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  file: {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    url: String
  },
  reactions: [reactionSchema],
  readBy: [readReceiptSchema],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// A message must belong to either a room or a conversation
messageSchema.pre('validate', function(next) {
  if (!this.room && !this.conversation) {
    next(new Error('Message must belong to either a room or a conversation'));
  } else {
    next();
  }
});

// Index for faster queries
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
