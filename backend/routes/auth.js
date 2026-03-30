const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Society = require('../models/Society');
const { sendSocietyCodeEmail } = require('../services/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper to generate a 6-digit code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password, role, societyCode, phone, companyName } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // 1. For Members/Mechanics, find societyId from code
    let initialSocietyId = null;
    if (role !== 'Secretary' && societyCode) {
      const society = await Society.findOne({ code: societyCode.toUpperCase() });
      if (!society) {
        return res.status(400).json({ message: 'Invalid Society Code' });
      }
      initialSocietyId = society._id;
    }

    // 2. Create User first (so we have user._id)
    const user = await User.create({
      name,
      email,
      password,
      role,
      societyCode: role !== 'Secretary' ? societyCode?.toUpperCase() : undefined,
      societyId: initialSocietyId,
      phone,
      companyName,
    });

    if (user) {
      let finalSocietyCode = societyCode;
      let finalSocietyId = null;

      // 2. Special handling for Secretary: Create Society & Generate Code
      if (role === 'Secretary') {
        finalSocietyCode = generateCode();
        const society = await Society.create({
          name: companyName || `${name}'s Society`,
          code: finalSocietyCode,
          secretaryId: user._id,
        });
        
        finalSocietyId = society._id;
        
        // Update user with generated code and society link
        user.societyCode = finalSocietyCode;
        user.societyId = finalSocietyId;
        await user.save();

        // 3. Send Email Notification with Society Code
        // We do this asynchronously to avoid blocking the response
        sendSocietyCodeEmail(user.email, user.name, finalSocietyCode, companyName || `${name}'s Society`)
          .then(result => {
             if(!result.success) console.error('Failed to send registration email:', result.error);
          });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyCode: user.societyCode,
        societyId: user.societyId,
        message: role === 'Secretary' 
            ? `Society registered successfully! Your unique Society Code is: ${user.societyCode}`
            : 'Registration successful',
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyId: user.societyId,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
