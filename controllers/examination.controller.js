const Examination = require("../models/examination.model");

module.exports = {
  newExamination: async (req, res) => {
    try {
      const department = req.user.department;
      const { date, subjectId, examType, semesterId } = req.body;
      const newExamination = new Examination({
        department: department,
        examDate: date,
        examType: examType,
        subject: subjectId,
        semester: semesterId,
      });

      const savedData = await newExamination.save();
      res.status(200).json({
        success: true,
        message: "success in creating new examination",
        data: savedData,
      });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "error in creating new examination" });
    }
  },
  getAllExaminations: async (req, res) => {
    try {
      const department = req.user.department;
      const examinations = await Examination.find({ department: department })
        .populate("subject", "subject_name")
        .populate("semester", "semester_text semester_num");

      res.status(200).json({
        success: true,
        examinations,
      });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "error in fetching examination" });
    }
  },

  getExaminationsBySemester: async (req, res) => {
    try {
      const department = req.user.department;
      const semesterId = req.params.id;
      const examinations = await Examination.find({
        semester: semesterId,
        department: department,
      })
        .populate("subject", "subject_name")
        .populate("semester", "semester_text semester_num");

      res.status(200).json({
        success: true,
        examinations,
      });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "error in fetching examination" });
    }
  },

  updateExaminaionWithId: async (req, res) => {
    try {
      const department = req.user.department;
      const examinationId = req.params.id;
      const { examDate, subjectId, examType } = req.body;
      await Examination.findOneAndUpdate(
        { _id: examinationId, department: department },
        { $set: { examDate: examDate, subject: subjectId, examType: examType } }
      );
      res.status(200).json({
        success: true,
        message: "examination is updating successfully",
      });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "error in updating  examination" });
    }
  },
  deleteExaminaionWithId: async (req, res) => {
    try {
      const department = req.user.department;
      const examinationId = req.params.id;

      await Examination.findOneAndDelete({
        _id: examinationId,
        department: department,
      });
      res.status(200).json({
        success: true,
        message: "examination deleted successfully",
      });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "error in deleting  examination" });
    }
  },
};
