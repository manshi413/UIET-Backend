const express = require('express');

const authMiddleware = require("../auth/auth");
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');

router.use((req, res, next) => {
  console.log("Authorization header:", req.headers.authorization);
  next();
});

console.log("attendanceController:", attendanceController);

// Route to mark attendance
router.post('/mark', authMiddleware(), attendanceController.recordAttendance);

// Route to get attendance by student
router.get('/student/:studentId', authMiddleware(), attendanceController.getAttendance);

// Route to check attendance for a specific date and semester
router.get('/check/:semesterId', attendanceController.checkAttendance);


// Route to generate attendance PDF
router.get('/generateAttendancePDF/:subjectId/:date', authMiddleware(), attendanceController.generateAttendancePDF);



// Route to get stored attendance PDFs for logged-in teacher
router.get('/pdfs', authMiddleware(), attendanceController.getAttendancePDFsByTeacher);

// Route to get PDF data by PDF id
router.get('/pdf/:pdfId', authMiddleware(), attendanceController.getAttendancePDFById);

module.exports = router;
