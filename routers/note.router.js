const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../auth/auth");
const noteController = require("../controllers/note.controller");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: fileFilter,
});

// Upload a note PDF linked to a subject
router.post("/upload", authMiddleware(["TEACHER", "DEPARTMENT"]), upload.single("note"), noteController.uploadNote);

// Get notes by subject ID
router.get("/subject/:subjectId", authMiddleware(["TEACHER", "DEPARTMENT", "STUDENT"]), noteController.getNotesBySubject);

module.exports = router;
