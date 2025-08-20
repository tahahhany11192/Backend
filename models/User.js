const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: { type: String, unique: true },
  password: String,
  photo: String,
  avatar: { type: String, default: '' },
  online: { type: Boolean, default: false },
  lastSeen: { type: Date },
  role: { 
  type: String, 
  enum: ['student'], 
  default: 'student' 
},
modelType: { type: String, default: 'User' }, // Add this
  paidCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // ✅ Add this
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
