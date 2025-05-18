const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.ObjectId, ref: "Department" },
  student: { type: mongoose.Schema.ObjectId, ref: "Student" },
  date: { type: Date, required: true },
  semester: { type: mongoose.Schema.ObjectId, ref: "Semester" },
  subject: { type: mongoose.Schema.ObjectId, ref: "Subject"},
  status: { type: String, enum: ["Present", "Absent"], default: "Absent" },

  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Attendance", attendanceSchema);
