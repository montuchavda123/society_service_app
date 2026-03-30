const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Society = require('../models/Society');
const Complaint = require('../models/Complaint');

// @route   GET /api/admin/stats
// @desc    Get system-wide statistics for SuperAdmin dashboard
router.get('/stats', protect, authorize('SuperAdmin'), async (req, res) => {
  try {
    const totalSocieties = await Society.countDocuments();
    const totalUsers = await User.countDocuments({ role: { $ne: 'SuperAdmin' } });
    const totalMechanics = await User.countDocuments({ role: 'Mechanic' });
    const totalMembers = await User.countDocuments({ role: 'Member' });
    const totalSecretaries = await User.countDocuments({ role: 'Secretary' });
    
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: { $in: ['Pending', 'Assigned', 'Accepted'] } });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'In Progress' });
    const completedComplaints = await Complaint.countDocuments({ status: { $in: ['Completed', 'Closed'] } });

    res.json({
      societies: totalSocieties,
      users: {
        total: totalUsers,
        mechanics: totalMechanics,
        members: totalMembers,
        secretaries: totalSecretaries
      },
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints,
        inProgress: inProgressComplaints,
        completed: completedComplaints
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/societies
// @desc    Get all societies with basic stats
router.get('/societies', protect, authorize('SuperAdmin'), async (req, res) => {
  try {
    const societies = await Society.find().populate('secretaryId', 'name email phone');
    res.json(societies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/mechanics
// @desc    Get all mechanics system-wide
router.get('/mechanics', protect, authorize('SuperAdmin'), async (req, res) => {
  try {
    const mechanics = await User.find({ role: 'Mechanic' }).select('-password').populate('societyId', 'name');
    res.json(mechanics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/societies
// @desc    Create a new society (SuperAdmin)
router.post('/societies', protect, authorize('SuperAdmin'), async (req, res) => {
  const { name } = req.body;
  try {
    const societyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const society = await Society.create({ name, societyCode });
    res.status(201).json(society);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/societies/:id
// @desc    Delete a society (SuperAdmin)
router.delete('/societies/:id', protect, authorize('SuperAdmin'), async (req, res) => {
  try {
    await Society.findByIdAndDelete(req.params.id);
    res.json({ message: 'Society deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/mechanics
// @desc    Register a new mechanic (SuperAdmin)
router.post('/mechanics', protect, authorize('SuperAdmin'), async (req, res) => {
  const { name, email, password, phone, skills, societyId } = req.body;
  try {
    const user = await User.create({
      name, email, password, phone, role: 'Mechanic', skills, societyId
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/mechanics/:id
// @desc    Update mechanic details or availability (SuperAdmin)
router.put('/mechanics/:id', protect, authorize('SuperAdmin'), async (req, res) => {
  const { name, phone, skills, isAvailable, societyId } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, skills, isAvailable, societyId },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
