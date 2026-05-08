import express from "express";

import list from "./list.js";
import create from "./create.js";
import update from "./update.js";
import remove from "./delete.js";
import bulkCreate from "./bulkCreate.js";

const router = express.Router();

router.get("/list", list);
router.post("/create", create);
router.put("/update", update);
router.delete("/delete", remove);
router.post("/bulk-create", bulkCreate);

export default router;
