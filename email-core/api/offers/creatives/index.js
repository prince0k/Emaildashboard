import express from "express";

import list from "./list.js";
import create from "./create.js";
import update from "./update.js";
import remove from "./delete.js";
import preview from "./preview.js";
import uploadImage from "./uploadImage.js";
import toggleStatus from "./toggleStatus.js";

const router = express.Router();

router.get("/list", list);
router.post("/create", create);
router.put("/update", update);
router.delete("/delete", remove);
router.get("/preview", preview);
router.post("/uploadImage", uploadImage);
router.post("/toggleStatus", toggleStatus);

export default router;
