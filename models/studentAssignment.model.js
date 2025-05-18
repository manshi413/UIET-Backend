const mongoose = require("mongoose");

const studentAssignmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("StudentAssignment", studentAssignmentSchema);
