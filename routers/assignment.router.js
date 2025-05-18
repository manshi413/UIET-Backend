const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../auth/auth");
const assignmentController = require("../controllers/assignment.controller");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // Save files in api/uploads directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post("/", authMiddleware(), upload.single("file"), assignmentController.uploadAssignment);

router.get("/", authMiddleware(), assignmentController.getAssignments);

// Get assignments for student
router.get("/student", authMiddleware(), assignmentController.getAssignmentsForStudent);

// Upload assignment by student
router.post("/student/upload", upload.single("file"), assignmentController.uploadAssignmentByStudent);

// Get student submissions by assignmentId
router.get("/student/submissions", assignmentController.getStudentSubmissions);

// Get submission counts for all assignments of a teacher and year in bulk
router.get("/submission-counts-bulk", assignmentController.getSubmissionCountsBulk);

// Serve uploaded file by filename
const fs = require("fs");

router.get("/file/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../uploads", filename);
  console.log(`Serving file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return res.status(404).json({ success: false, message: "File not found" });
  }
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).json({ success: false, message: "Error sending file" });
    }
  });
});

module.exports = router;
