import express from "express";
import listUsers from "./list.js";
import createUser from "./create.js";
import updateRole from "./updateRole.js";
import deleteUser from "./delete.js";

const router = express.Router();

router.get("/list", listUsers);
router.post("/create", createUser);
router.put("/updateRole", updateRole);
router.delete("/delete", deleteUser);

export default router;