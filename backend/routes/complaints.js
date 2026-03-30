const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Complaint = require('../models/Complaint');

// Helper to get socket io instance
const getIo = (req) => req.app.get('io');

// @route   POST /api/complaints
// @desc    Raise a new complaint (Member)
router.post('/', protect, authorize('Member'), async (req, res) => {
  const { title, description, category, priority, voiceNoteUrl, aiTranscription } = req.body;

  try {
    const complaint = await Complaint.create({
      userId: req.user._id,
      societyId: req.user.societyId,
      title,
      description,
      category,
      priority,
      voiceNoteUrl,
      aiTranscription,
    });

    const io = getIo(req);
    if (io) io.to(`society_${req.user.societyId}`).emit('complaint_created', complaint);

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/complaints
// @desc    Get all complaints for the user (Resident) or society (Secretary) or mechanic
router.get('/', protect, async (req, res) => {
  try {
    let complaints;
    if (req.user.role === 'Member') {
      complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'Secretary') {
      complaints = await Complaint.find({ societyId: req.user.societyId }).sort({ createdAt: -1 }).populate('userId', 'name email flatNumber');
    } else if (req.user.role === 'Mechanic') {
      complaints = await Complaint.find({ mechanicId: req.user._id }).sort({ createdAt: -1 }).populate('userId', 'name email flatNumber');
    }
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/complaints/:id/assign
// @desc    Assign a mechanic to a complaint (Secretary)
router.put('/:id/assign', protect, authorize('Secretary'), async (req, res) => {
  const { mechanicId } = req.body;

  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { mechanicId, status: 'Assigned' },
      { new: true }
    );
    
    const io = getIo(req);
    if (io) {
      io.to(`user_${mechanicId}`).emit('complaint_assigned', complaint);
      io.to(`user_${complaint.userId}`).emit('complaint_status_update', complaint);
    }
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status (Mechanic)
router.put('/:id/status', protect, authorize('Mechanic'), async (req, res) => {
  const { status } = req.body;

  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    const io = getIo(req);
    if (io) {
      io.to(`user_${complaint.userId}`).emit('complaint_status_update', complaint);
      io.to(`society_${req.user.societyId}`).emit('complaint_status_update', complaint);
    }
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/complaints/:id/feedback
// @desc    Update feedback and rating (Member)
router.put('/:id/feedback', protect, authorize('Member'), async (req, res) => {
  const { feedback, rating } = req.body;

  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { feedback, rating, status: 'Closed' },
      { new: true }
    );
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
