const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const upload  = require("../middleware/upload");
const { uploadResume } = require("../controllers/resumeController");

const hrAdmin = ["Admin","HR"];

router.post("/upload", protect, authorize(...hrAdmin), upload.single("resume"), uploadResume);

module.exports = router;
