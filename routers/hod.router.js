const express = require("express");
const authMiddleware = require("../auth/auth");
const { saveOrUpdateHOD, getHODs } = require("../controllers/hod.controller");

const router = express.Router();

router.post("/save", authMiddleware(["DIRECTOR", "DEPARTMENT"]), saveOrUpdateHOD);
router.get("/fetch", authMiddleware(["DIRECTOR", "DEPARTMENT"]), getHODs);

module.exports = router;
