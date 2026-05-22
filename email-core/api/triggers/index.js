import express from "express";
import listTriggers from "./list.js";
import updateTrigger from "./update.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.use(auth);

router.get("/list", checkPermission("sender.view"), listTriggers);
router.post("/update", checkPermission("sender.manage"), updateTrigger);

export default router;
