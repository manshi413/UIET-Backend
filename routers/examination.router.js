const express = require("express");
const authMiddleware = require("../auth/auth");
const { newExamination, getAllExaminations, updateExaminaionWithId, getExaminationsBySemester, deleteExaminaionWithId } = require("../controllers/examination.controller");

const router = express.Router();

router.post("/create", authMiddleware(["DEPARTMENT"]), newExamination);
router.get("/all", authMiddleware(["DEPARTMENT"]), getAllExaminations);
router.get("/semester/:id", authMiddleware(["DEPARTMENT","TEACHER","STUDENT"]), getExaminationsBySemester);
router.patch(
  "/update/:id",
  authMiddleware(["DEPARTMENT"]),
  updateExaminaionWithId
);
router.get("/delete/:id", authMiddleware(["DEPARTMENT"]), deleteExaminaionWithId);

module.exports = router;