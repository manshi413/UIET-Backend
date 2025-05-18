const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.ObjectId, ref: "Department" },
  subject_name: { type: String, required: true },
  subject_codename: { type: String, required: true },
  year: { type: mongoose.Schema.ObjectId, ref: "Semester" },
  teacher: { type: mongoose.Schema.ObjectId, ref: "Teacher" },
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Subject", subjectSchema);
