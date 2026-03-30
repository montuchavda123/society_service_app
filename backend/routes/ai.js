const express = require('express');
const router = express.Router();
const multer = require('multer');
const OpenAI = require('openai');
const { protect } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({ dest: 'uploads/' });

// @route   POST /api/ai/process-voice
// @desc    Transcribe audio and structure the complaint
router.post('/process-voice', protect, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No audio file provided' });
  }

  const filePath = req.file.path;

  try {
    // 1. Transcription (Whisper)
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
    });

    const rawText = transcription.text;

    // 2. Structuring (GPT-4)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant for a society management app. Convert the following user complaint into a structured JSON object with keys: "title" (concise, clear), "description" (cleaned English version of the input), "category" (Plumbing, Electrical, Appliance, Security, Cleaning, Others), and "priority" (Urgent, High, Medium, Low). Detect priority rigorously based on severity (e.g. fire/flood = Urgent, broken door = High). Input may be in Hinglish, ensure output is professional English.',
        },
        {
          role: 'user',
          content: rawText,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const structuredData = JSON.parse(completion.choices[0].message.content);

    // Clean up file
    fs.unlinkSync(filePath);

    res.json({
      rawText,
      structuredData,
    });
  } catch (error) {
    console.error(error);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ message: 'AI processing failed', error: error.message });
  }
});

module.exports = router;
