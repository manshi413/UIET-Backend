const mongoose = require("mongoose");

const noticeDirectorSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.ObjectId, ref: "Department" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: { type: String, enum: ["teacher", "hod", "Teachers", "HODs"], required: true },
  recipient: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  recipientName: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("NoticeDirector", noticeDirectorSchema);
