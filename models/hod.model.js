const mongoose = require("mongoose");

const hodSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.ObjectId, ref: "Department", required: true, unique: true },
  teacher: { type: mongoose.Schema.ObjectId, ref: "Teacher", required: true },
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("HOD", hodSchema);
