const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.ObjectId, ref: "Department" },
  email: { type: String, required: true },
  name: { type: String, required: true },
  rollNo: { type: String, required: false },
  dob: { type: String, required: false },
  student_class: { type: mongoose.Schema.ObjectId, ref: "Semester" },
  gender: { type: String, required: true },
  age: { type: Number, required: true },
  student_contact: { type: String, required: true },
  guardian: { type: String, required: true },
  guardian_phone: { type: String, required: true },
  student_image: { type: String, required: true },
  password: { type: String, required: true },

  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Student", studentSchema);