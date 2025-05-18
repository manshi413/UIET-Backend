const mongoose = require("mongoose");

const attendancePDFSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.ObjectId, ref: "Teacher", required: true },
  subject: { type: mongoose.Schema.ObjectId, ref: "Subject", required: true },
  date: { type: Date, required: true },
  pdfData: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AttendancePDF", attendancePDFSchema);
