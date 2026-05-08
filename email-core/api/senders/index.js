import express from "express";
import createSender from "./create.js";
import listSenders from "./list.js";
import updateSender from "./update.js";
import deleteSender from "./delete.js";
import toggleSenderStatus from "./toggleStatus.js";
import auth from "../../middleware/auth.js";
import checkPermission from "../../middleware/checkPermission.js";

const router = express.Router();

router.use(auth);

router.get("/", checkPermission("sender.view"), listSenders);
router.post("/", checkPermission("sender.manage"), createSender);
router.put("/:id", checkPermission("sender.manage"), updateSender);
router.delete("/:id", checkPermission("sender.manage"), deleteSender);
router.patch("/:id/toggle", checkPermission("sender.manage"), toggleSenderStatus);

export default router;