const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Society = require('../models/Society');
const User = require('../models/User');

// Helper to generate a 6-digit code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// @route   POST /api/society/register
// @desc    Onboard a new society (Secretary)
router.post('/register', protect, authorize('Secretary'), async (req, res) => {
  const { name } = req.body;

  try {
    const code = generateCode();
    const society = await Society.create({
      name,
      code,
      secretaryId: req.user._id,
    });

    if (society) {
      // Update the secretary's user record with the societyId
      await User.findByIdAndUpdate(req.user._id, { societyId: society._id, societyCode: code });
      res.status(201).json(society);
    } else {
      res.status(400).json({ message: 'Invalid society data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/society/join
// @desc    Join a society using its code (Member/Mechanic)
router.post('/join', protect, async (req, res) => {
  const { code } = req.body;

  try {
    const society = await Society.findOne({ code });
    if (!society) {
      return res.status(404).json({ message: 'Society not found with this code' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { societyId: society._id, societyCode: code },
      { new: true }
    );

    res.json({
      message: 'Joined society successfully',
      societyName: society.name,
      societyId: society._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/society/members
// @desc    Get all members of the secretary's society
router.get('/members', protect, authorize('Secretary'), async (req, res) => {
    try {
        const members = await User.find({ societyId: req.user.societyId }).select('-password');
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/society/members
// @desc    Manually add a member to the society (Secretary)
router.post('/members', protect, authorize('Secretary'), async (req, res) => {
  const { name, email, phone, flatNumber, role } = req.body;
  try {
    const user = await User.create({
      name,
      email,
      phone,
      flatNumber,
      role: role || 'Member',
      societyId: req.user.societyId,
      societyCode: req.user.societyCode,
      password: 'password123', // Default password for manual entry
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/society/members/:id
// @desc    Update member details (Secretary)
router.put('/members/:id', protect, authorize('Secretary'), async (req, res) => {
  const { name, phone, flatNumber, role } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, flatNumber, role },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/society/members/:id
// @desc    Remove a member from the society (Secretary)
router.delete('/members/:id', protect, authorize('Secretary'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
