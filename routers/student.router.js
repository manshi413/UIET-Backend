const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  
  registerStudent,
  loginStudent,
  updateStudent,
  getStudentOwnData,
  getStudentsWithQuery,
  getStudentWithId,
  deleteStudentWithId,
  getTotalStudentsCount,
  getStudentImage,
} = require("../controllers/student.controller");
const router = express.Router();

router.post("/register",authMiddleware(['DEPARTMENT']), registerStudent);
router.get("/fetch-with-query",authMiddleware(['DEPARTMENT', 'TEACHER']), getStudentsWithQuery);
router.post("/login", loginStudent);
router.patch("/update/:id",authMiddleware(["DEPARTMENT", "STUDENT"]), updateStudent);
router.get("/fetch-single",authMiddleware(["STUDENT"]),getStudentOwnData);
router.get("/fetch/:id",authMiddleware(["DEPARTMENT"]),getStudentWithId);
router.delete("/delete/:id",authMiddleware(["DEPARTMENT"]),deleteStudentWithId);

// Add route for total students count
router.get("/total-count", authMiddleware(['DEPARTMENT', 'TEACHER']), getTotalStudentsCount);

module.exports = router;
