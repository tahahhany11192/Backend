const User = require('../models/User');
const Course = require('../models/Course');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



// ==============================
// LOGIN CONTROLLER
// ==============================
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  // Exclude password before sending user
  const { password: pwd, ...userData } = user.toObject();

  res.status(200).json({
    token,
    role: user.role,
    userId: user._id,
    user: userData, // return full safe user object
  });
};
exports.login = login;


// ==============================
// REGISTER CONTROLLER (with photo)
// ==============================
exports.register = async (req, res) => {
  try {
    const { name, age, email, password } = req.body;
    const photo = req.file ? req.file.filename : null;

    if (!name || !age || !email || !password || !photo) {
      return res.status(400).json({ message: "All fields including photo are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      age,
      email,
      password: hashedPassword,
      photo,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: "Error registering user" });
  }
};