const mongoose = require("mongoose");

const directorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  director_image: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Director", directorSchema);
