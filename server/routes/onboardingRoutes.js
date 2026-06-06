const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/rbac");
const { getAll, getById, create, updateStep, remove } = require("../controllers/onboardingController");

const hrAdmin = ["Admin", "HR", "Manager"];

router.get    ("/",                    protect, authorize(...hrAdmin), getAll);
router.get    ("/:id",                 protect, authorize(...hrAdmin), getById);
router.post   ("/",                    protect, authorize(...hrAdmin), create);
router.put    ("/:id/step/:stepIndex",  protect, authorize(...hrAdmin), updateStep);
router.delete ("/:id",                 protect, authorize(...hrAdmin), remove);

module.exports = router;
