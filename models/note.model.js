const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.ObjectId, ref: "Subject", required: true },
  department: { type: mongoose.Schema.ObjectId, ref: "Department" },
  filePath: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Note", noteSchema);
