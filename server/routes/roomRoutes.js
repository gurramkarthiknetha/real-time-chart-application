const express = require('express');
const router = express.Router();
const { 
  createRoom, 
  getRooms, 
  getRoomById, 
  updateRoom, 
  deleteRoom,
  addMember,
  removeMember
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
  .post(createRoom)
  .get(getRooms);

router.route('/:id')
  .get(getRoomById)
  .put(updateRoom)
  .delete(deleteRoom);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
