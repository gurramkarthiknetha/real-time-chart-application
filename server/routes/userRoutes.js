const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  getUsers,
  addFriend,
  removeFriend
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/', protect, getUsers);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/friends/:id', protect, addFriend);
router.delete('/friends/:id', protect, removeFriend);

module.exports = router;
