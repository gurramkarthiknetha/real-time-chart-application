const Room = require('../models/Room');
const User = require('../models/User');
const Message = require('../models/Message');

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res) => {
  try {
    const { name, description, isPrivate, members } = req.body;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Room name must be at least 2 characters long' });
    }

    if (name.trim().length > 30) {
      return res.status(400).json({ message: 'Room name cannot exceed 30 characters' });
    }

    if (description && description.length > 200) {
      return res.status(400).json({ message: 'Description cannot exceed 200 characters' });
    }

    // Create new room
    const room = await Room.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      isPrivate: isPrivate || false,
      owner: req.user._id,
      members: members ? [...new Set([...members, req.user._id.toString()])] : [req.user._id]
    });

    // Add room to each member's rooms array
    if (members && members.length > 0) {
      try {
        await User.updateMany(
          { _id: { $in: members } },
          { $addToSet: { rooms: room._id } }
        );
      } catch (memberError) {
        console.error('Error adding room to members:', memberError);
        // Continue execution even if this fails
      }
    }

    // Add room to owner's rooms array
    try {
      await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { rooms: room._id } }
      );
    } catch (ownerError) {
      console.error('Error adding room to owner:', ownerError);
      // Continue execution even if this fails
    }

    // Return the created room
    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Failed to create room', error: error.message });
  }
};

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res) => {
  try {
    // Get all public rooms and private rooms where user is a member
    // Limit fields returned to improve performance
    const rooms = await Room.find({
      $or: [
        { isPrivate: false },
        { members: req.user._id }
      ]
    })
    .select('name description isPrivate owner members image createdAt updatedAt')
    .populate('owner', 'username avatar')
    .lean(); // Use lean() for better performance

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);

    // Send a more user-friendly error message
    res.status(500).json({
      message: 'Failed to fetch rooms. Please try again later.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('members', 'username avatar status');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user has access to this room
    if (room.isPrivate && !room.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to access this room' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the owner
    if (!room.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this room' });
    }

    const { name, description, isPrivate, image } = req.body;

    room.name = name || room.name;
    room.description = description || room.description;
    room.isPrivate = isPrivate !== undefined ? isPrivate : room.isPrivate;
    room.image = image || room.image;

    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the owner
    if (!room.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this room' });
    }

    // Remove room from all members' rooms array
    await User.updateMany(
      { _id: { $in: room.members } },
      { $pull: { rooms: room._id } }
    );

    // Delete all messages in the room
    await Message.deleteMany({ room: room._id });

    // Delete the room
    await room.remove();

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add member to room
// @route   POST /api/rooms/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the owner or already a member
    if (!room.owner.equals(req.user._id) && !room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to add members to this room' });
    }

    // Check if user to add exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    if (room.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this room' });
    }

    // Add user to room members
    room.members.push(userId);
    await room.save();

    // Add room to user's rooms
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { rooms: room._id } }
    );

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove member from room
// @route   DELETE /api/rooms/:id/members/:userId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the owner or the member being removed
    if (!room.owner.equals(req.user._id) && !req.user._id.equals(req.params.userId)) {
      return res.status(403).json({ message: 'Not authorized to remove members from this room' });
    }

    // Cannot remove the owner
    if (room.owner.equals(req.params.userId)) {
      return res.status(400).json({ message: 'Cannot remove the room owner' });
    }

    // Remove user from room members
    room.members = room.members.filter(
      member => member.toString() !== req.params.userId
    );
    await room.save();

    // Remove room from user's rooms
    await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { rooms: room._id } }
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  addMember,
  removeMember
};
