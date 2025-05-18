const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  registerDirector,
  loginDirector,
  getAllDirectors,
  updateDirector,
  getDirectorOwnData,
  getDirectorProfileFromTeacher,
  deleteDirector,
  fetchDirectorsWithQuery,
  createOrUpdateDirectorFromTeacher,
  fetchSelectedDirectors,
  getSelectedDirectorForTeacher,
} = require("../controllers/director.controller");

const router = express.Router();

router.post("/register", registerDirector);
router.get("/all", getAllDirectors);
router.post("/login", loginDirector);
router.post("/create-or-update-from-teacher", createOrUpdateDirectorFromTeacher);
router.patch("/update/:id", authMiddleware(["DIRECTOR", "DEPARTMENT"]), updateDirector);
router.delete("/delete/:id", authMiddleware(["DIRECTOR", "DEPARTMENT"]), deleteDirector);
router.get("/fetch-with-query", authMiddleware(["DIRECTOR", "DEPARTMENT"]), fetchDirectorsWithQuery);
router.get("/fetch-single", authMiddleware(["DIRECTOR", "DEPARTMENT"]), getDirectorProfileFromTeacher);
router.get("/selected", authMiddleware(["DIRECTOR", "DEPARTMENT"]), fetchSelectedDirectors);
router.get("/teacher/selected-director", authMiddleware(["TEACHER"]), getSelectedDirectorForTeacher);

module.exports = router;