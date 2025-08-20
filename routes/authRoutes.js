const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth =require('../middleware/auth.js');

const router = express.Router();

router.get('/room-token', auth, (req, res) => {
  const payload = {
    sessionId: `session-${Date.now()}`,
    userId: req.user.id || req.user._id,
    role: req.user.role || 'instructor'
  };

  const roomToken = jwt.sign(payload, process.env.ROOM_TOKEN_SECRET, { expiresIn: '1h' });
  res.json({ roomToken });
});




// Register route
router.post("/register", async (req, res) => {
  console.log("✅ Received register request:", req.body);

  try {
    const { name, age, email, password } = req.body;

    if (!name || !age || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, age, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: "Error registering user" });
  }
});




// Login route
router.post("/login", async (req, res) => {
  console.log("✅ Received login request:", req.body);
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

      const { password: pwd, ...userData } = user.toObject();

  res.status(200).json({
    token,
    role: user.role,
    userId: user._id,
    user: userData, // return full safe user object
  });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});





module.exports = router;