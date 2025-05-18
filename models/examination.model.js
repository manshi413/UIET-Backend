const mongoose = require("mongoose");

const examinationSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.ObjectId, ref: "Department" },
  examDate: { type: Date, require: true },
  examType: { type: String, require: true },
  subject: { type: mongoose.Schema.ObjectId, ref: "Subject" },
  semester: { type: mongoose.Schema.ObjectId, ref: "Semester" },

  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Examination", examinationSchema);
