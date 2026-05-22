import express from "express";
import createRequest from "./create.js";
import listRequests from "./list.js";
import reviewRequest from "./review.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.use(auth);

// Mailer access
router.post("/request", createRequest);

// Admin access
router.get("/list", checkPermission("admin.roles"), listRequests);
router.post("/review", checkPermission("admin.roles"), reviewRequest);

export default router;
