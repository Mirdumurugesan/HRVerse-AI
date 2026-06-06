const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const upload  = require("../middleware/upload");
const { uploadInterview, getInterviews } = require("../controllers/interviewController");

const hrAdmin = ["Admin","HR"];

router.get ("/",       protect, authorize(...hrAdmin), getInterviews);
router.post("/upload", protect, authorize(...hrAdmin), upload.single("video"), uploadInterview);

module.exports = router;
