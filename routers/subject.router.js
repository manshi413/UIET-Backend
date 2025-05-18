const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  createSubject,
  getAllSubjects,
  updateSubjectWithId,
  deleteSubjectWithId,
  getSubjectsWithQuery,
} = require("../controllers/subject.controller");
const router = express.Router();

router.post("/create", authMiddleware(["DEPARTMENT"]), createSubject);
router.get("/fetch-with-query",authMiddleware(['DEPARTMENT','TEACHER','STUDENT']), getSubjectsWithQuery);
router.get("/all", authMiddleware(["DEPARTMENT"]), getAllSubjects);
router.patch("/update/:id", updateSubjectWithId);
router.get("/delete/:id", authMiddleware(["DEPARTMENT"]), deleteSubjectWithId);

module.exports = router;
