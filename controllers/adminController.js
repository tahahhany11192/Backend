// controllers/adminController.js
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Get admin profile
exports.getProfile = async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select("-password");
  res.json(admin);
};

// Update profile info
exports.updateProfile = async (req, res) => {
  const updates = req.body;
  if (req.file) updates.photo = req.file.filename;

  const admin = await Admin.findByIdAndUpdate(req.admin.id, updates, { new: true }).select("-password");
  res.json(admin);
};

// Change password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin.id);
  
  const isMatch = await admin.comparePassword(oldPassword);
  if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

  admin.password = newPassword;
  await admin.save();
  res.json({ message: "Password updated successfully" });
};
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
