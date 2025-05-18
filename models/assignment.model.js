const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.ObjectId, ref: "Teacher", required: true },
  department: { type: mongoose.Schema.ObjectId, ref: "Department" },
  year: { type: String, required: true },
  subject: { type: mongoose.Schema.ObjectId, ref: "Subject", required: true },
  fileUrl: { type: String, required: true },
  dueDate: { type: Date },  // Added dueDate field
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Assignment", assignmentSchema);
