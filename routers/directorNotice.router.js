const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  createNotice,
  getNoticesForDirector,
  getNoticesForRecipient,
  updateNotice,
  deleteNotice,
} = require("../controllers/directorNotice.controller");

const router = express.Router();

router.post("/create", authMiddleware(["DIRECTOR"]), createNotice);
router.get("/all", authMiddleware(["DIRECTOR"]), getNoticesForDirector);
router.get("/recipient", authMiddleware(["TEACHER", "HOD"]), getNoticesForRecipient);
router.put("/update/:id", authMiddleware(["DIRECTOR"]), updateNotice);
router.delete("/delete/:id", authMiddleware(["DIRECTOR"]), deleteNotice);

module.exports = router;
