const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.ObjectId, ref: "Department" },
  email: { type: String, required: true },
  name: { type: String, required: true },
  dob: { type: String, required: false },
  teacher_contact: { type: String, required: false },
  qualification: { type: String, required: true },
  gender: { type: String, required: true },
  age: { type: Number, required: true },
  teacher_image: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Teacher", teacherSchema);