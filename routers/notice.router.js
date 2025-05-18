const express = require("express");
const authMiddleware = require("../auth/auth");
const { createNotice, getAllNotices, updateNoticeWithId, deleteNoticeWithId, getTeacherNotices, getStudentNotices } = require("../controllers/notice.controller");

const router = express.Router();

router.post("/create", authMiddleware(["DEPARTMENT", "DIRECTOR"]), createNotice);
router.get("/all", authMiddleware(["DEPARTMENT", "DIRECTOR"]), getAllNotices);
router.get("/teacher", authMiddleware(["TEACHER"]), getTeacherNotices);
router.get("/student", authMiddleware(["STUDENT"]), getStudentNotices);
router.patch(
  "/update/:id",
  authMiddleware(["DEPARTMENT", "DIRECTOR"]),
  updateNoticeWithId
);
router.get("/delete/:id", authMiddleware(["DEPARTMENT", "DIRECTOR"]), deleteNoticeWithId);

module.exports = router;