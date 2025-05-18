const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  createSchedule,
  getScheduleWithSemester,
  updateScheduleWithId,
  deleteScheduleWithId,
} = require("../controllers/schedule.controller");

const router = express.Router();

// Create a schedule for a specific day of the week
router.post("/create", authMiddleware(["DEPARTMENT"]), createSchedule);

// Fetch schedule by semester and organize it by days of the week
router.get("/fetch-with-semester/:id", authMiddleware(["DEPARTMENT","TEACHER","STUDENT"]), getScheduleWithSemester);

// Update schedule by ID
router.patch("/update/:id", authMiddleware(["DEPARTMENT"]), updateScheduleWithId);

// Delete schedule by ID
router.delete("/delete/:id", authMiddleware(["DEPARTMENT"]), deleteScheduleWithId);

module.exports = router;
