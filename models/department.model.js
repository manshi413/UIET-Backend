const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  department_name: { type: String, required: true },

  hod_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  department_image: { type: String, required: true },

  password: { type: String, required: true },

  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Department", departmentSchema);
