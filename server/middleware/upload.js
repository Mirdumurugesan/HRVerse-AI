const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".mp4", ".mov", ".avi", ".webm"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Unsupported file type: " + ext), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:  200 * 1024 * 1024, // 200 MB max — covers interview videos
    files:     10,                // max 10 files per request (batch resume upload)
  },
});

module.exports = upload;
