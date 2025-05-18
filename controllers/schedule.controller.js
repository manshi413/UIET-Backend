const Subject = require("../models/subject.model");
const Student = require("../models/student.model");
const Exam = require("../models/examination.model");
const Schedule = require("../models/schedule.model");

module.exports = {
  getScheduleWithSemester: async (req, res) => {
    try {
      const department = req.user.department;
      const semesterId = req.params.id;
      const schedules = await Schedule.find({
        department: department,
        semester: semesterId,
      }).populate(["teacher", "subject"]);

      res.status(200).json({
        success: true,
        message: "Successfully fetched all schedules",
        data: schedules,
      });
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({
        success: false,
        message: "Server error in getting schedule",
      });
    }
  },

  createSchedule: async (req, res) => {
    try {
      const { teacher, subject, semester, day, startTime, endTime } = req.body;

      if (!day) {
        return res.status(400).json({
          success: false,
          message: "Day is required for scheduling",
        });
      }

      const newSchedule = new Schedule({
        department: req.user.department,
        teacher,
        subject,
        semester,
        day, // Storing day instead of date
        startTime,
        endTime,
      });

      await newSchedule.save();
      res.status(200).json({
        success: true,
        message: "Schedule created successfully",
        data: newSchedule,
      });
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(500).json({
        success: false,
        message: "Server error in creating schedule",
      });
    }
  },

  updateScheduleWithId: async (req, res) => {
    try {
      let id = req.params.id;
      const updatedSchedule = await Schedule.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Schedule updated successfully",
        data: updatedSchedule,
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({
        success: false,
        message: "Server error in updating schedule",
      });
    }
  },

  deleteScheduleWithId: async (req, res) => {
    try {
      let id = req.params.id;
      let department = req.user.department;

      await Schedule.findOneAndDelete({ _id: id, department: department });

      res.status(200).json({
        success: true,
        message: "Schedule deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({
        success: false,
        message: "Server error in deleting schedule",
      });
    }
  },
};
