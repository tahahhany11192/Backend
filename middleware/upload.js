const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// middleware/upload.js or inside route handler
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // e.g., 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.mp4', '.mov', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, videos, and PDFs are allowed.'));
    }
  }
});

// Expect the exact field names from the frontend
const uploadLessonFiles = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'pdfs', maxCount: 10 }
]);

module.exports = uploadLessonFiles;

module.exports = upload
