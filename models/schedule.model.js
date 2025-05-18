const mongoose = require("mongoose");

const scheduleschema = new mongoose.Schema({
  department: { type: mongoose.Schema.ObjectId, ref: "Department" },
  teacher: { type: mongoose.Schema.ObjectId, ref: "Teacher", required: true },
  subject: { type: mongoose.Schema.ObjectId, ref: "Subject", required: true },
  semester: { type: mongoose.Schema.ObjectId, ref: "Semester", required: true },
  day: { type: Number, required: true }, // Added for day-wise scheduling
  startTime: { type: String, required: true }, // Changed to String (since it's just HH:MM)
  endTime: { type: String, required: true },   // Changed to String
});

module.exports = mongoose.model("Schedule", scheduleschema);
