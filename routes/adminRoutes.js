const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, changePassword,adminLogin } = require("../controllers/adminController");
const authenticateAdmin = require("../middleware/authenticateAdmin");
const upload = require("../middleware/upload");

// ✅ Add this check to make sure `adminController.adminLogin` is a function
if (typeof adminLogin !== "function") {
  console.error("adminLogin is not a function. Check your controller export.");
}
router.get("/profile", authenticateAdmin, getProfile);
router.put("/profile", authenticateAdmin, upload.single("photo"), updateProfile);
router.put("/change-password", authenticateAdmin, changePassword);

// ✅ Route
router.post("/login", adminLogin);

module.exports = router;
