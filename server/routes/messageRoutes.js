const express = require('express');
const router = express.Router();
const { 
  sendRoomMessage, 
  getRoomMessages, 
  sendDirectMessage, 
  getConversationMessages,
  getConversations,
  addReaction,
  removeReaction
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Room messages
router.post('/room/:roomId', upload.single('file'), sendRoomMessage);
router.get('/room/:roomId', getRoomMessages);

// Direct messages
router.post('/conversation/:userId', upload.single('file'), sendDirectMessage);
router.get('/conversation/:userId', getConversationMessages);
router.get('/conversations', getConversations);

// Reactions
router.post('/:messageId/reactions', addReaction);
router.delete('/:messageId/reactions', removeReaction);

module.exports = router;
