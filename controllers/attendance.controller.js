const mongoose = require("mongoose");
const Attendance = require("../models/attendance.model");
const Student = require("../models/student.model");
const Subject = require("../models/subject.model");
const AttendancePDF = require("../models/attendancePDF.model");
const ExcelJS = require("exceljs");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { PassThrough } = require("stream");

module.exports = {
  // Check attendance for a specific semester
  checkAttendance: async (req, res) => {
    try {
      const { semesterId } = req.params;

      // Find subjects in semester and user's department
      const subjects = await Subject.find({ student_class: semesterId, department: req.user.departmentId });

      const attendanceData = {};

      for (const subject of subjects) {
        const attendanceRecords = await Attendance.find({ subject: subject._id })
          .populate('student')
          .lean();

        attendanceData[subject.subject_name] = attendanceRecords.map(record => ({
          studentName: `${record.student.first_name} ${record.student.last_name}`,
          status: record.status,
          date: record.date,
        }));
      }

      res.status(200).json({ success: true, data: attendanceData });
    } catch (error) {
      console.log("Error checking attendance", error);
      res.status(500).json({ success: false, message: "Server error checking attendance" });
    }
  },

  // Fetch attendance records for a specific student
  getAttendance: async (req, res) => {
    try {
      const { studentId } = req.params;
      const attendanceRecords = await Attendance.find({ student: studentId })
        .populate('subject', 'subject_name')
        .lean();

      const attendanceData = attendanceRecords.map(record => ({
        subjectName: record.subject.subject_name,
        status: record.status,
        date: record.date,
      }));

      res.status(200).json({ success: true, data: attendanceData });
    } catch (error) {
      console.log("Error fetching attendance for student", error);
      res.status(500).json({ success: false, message: "Server error fetching attendance for student" });
    }
  },

  // Record attendance for a student
  recordAttendance: async (req, res) => {
    try {
      const { subjectId, date, attendanceData } = req.body;

      if (!subjectId || !date || !Array.isArray(attendanceData) || attendanceData.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields or attendance data" });
      }

      for (const record of attendanceData) {
        const { studentId, status } = record;
        if (!studentId || status == null) {
          return res.status(400).json({ success: false, message: "Missing studentId or status in attendance data" });
        }

        const existingRecord = await Attendance.findOne({ student: studentId, subject: subjectId, date: date });
        if (existingRecord) {
          existingRecord.status = status;
          await existingRecord.save();
        } else {
          const attendance = new Attendance({
            student: studentId,
            subject: subjectId,
            status,
            date,
          });
          await attendance.save();
        }
      }

      res.status(201).json({ success: true, message: "Attendance recorded successfully" });
    } catch (error) {
      console.log("Error recording attendance", error);
      res.status(500).json({ success: false, message: "Server error recording attendance" });
    }
  },

  // Generate attendance PDF for a subject and date and save to DB
  generateAttendancePDF: async (req, res) => {
    try {
      const { subjectId, date } = req.params;
      const teacherName = req.user.name || (req.user._doc && req.user._doc.name);
      const Teacher = require("../models/teacher.model");

      if (!teacherName) {
        return res.status(400).json({ success: false, message: "Teacher name not found in user data" });
      }

      // Find teacher document by name
      const teacherDoc = await Teacher.findOne({ name: teacherName });
      if (!teacherDoc) {
        return res.status(404).json({ success: false, message: "Teacher not found" });
      }
      const teacherId = teacherDoc._id;

      console.log("generateAttendancePDF - teacherId:", teacherId);

      if (!teacherId) {
        return res.status(400).json({ success: false, message: "Teacher ID not found in user data" });
      }

      // Find subject and verify department
      const subject = await Subject.findOne({ _id: subjectId, department: req.user.department });
      if (!subject) {
        return res.status(404).json({ success: false, message: "Subject not found or access denied" });
      }

      // Find attendance records for subject and date
      const attendanceRecords = await Attendance.find({ subject: subjectId, date: date })
        .populate('student')
        .lean();

      // Create a PDF document
      const doc = new PDFDocument({ margin: 30, size: 'A4' });

      // Create a PassThrough stream to collect PDF data
      const stream = new PassThrough();
      let buffers = [];
      stream.on('data', (chunk) => buffers.push(chunk));
      stream.on('end', async () => {
        const pdfBuffer = Buffer.concat(buffers);

        // Save PDF buffer to AttendancePDF collection
        const existingPDF = await AttendancePDF.findOne({ teacher: teacherId, subject: subjectId, date: date });
        if (existingPDF) {
          existingPDF.pdfData = pdfBuffer;
          existingPDF.createdAt = new Date();
          await existingPDF.save();
        } else {
          const attendancePDF = new AttendancePDF({
            teacher: teacherId,
            subject: subjectId,
            date: date,
            pdfData: pdfBuffer,
          });
          await attendancePDF.save();
        }

        // Send PDF buffer as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="attendance_' + subject.subject_name + '_' + date + '.pdf"');
      res.send(pdfBuffer);
      });

      // Pipe PDF document to PassThrough stream
      doc.pipe(stream);

      // Title
      doc.fontSize(18).text(`Attendance Report for ${subject.subject_name}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Date: ${date}`, { align: 'center' });
      doc.moveDown();

      // Table header
      doc.fontSize(12);
      doc.text('Student Name', 50, doc.y, { continued: true });
      doc.text('Status', 400, doc.y);
      doc.moveDown();

      // Draw a line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Sort attendanceRecords by status: Present first, then Absent
      attendanceRecords.sort((a, b) => {
        if (a.status === b.status) return 0;
        if (a.status === 'Present') return -1;
        if (b.status === 'Present') return 1;
        return 0;
      });

      // Table rows
      attendanceRecords.forEach(record => {
        const studentName = record.student.name || "Unknown Student";
        const status = record.status;
        const y = doc.y;
        const studentNameHeight = doc.heightOfString(studentName, { width: 340 }); // width from 50 to 390 approx
        doc.text(studentName, 50, y, { width: 340 });
        // Vertically center status text relative to student name height
        const statusY = y + (studentNameHeight / 2) - (doc.currentLineHeight() / 2);
        doc.text(status, 400, statusY);
        doc.moveDown(studentNameHeight / doc.currentLineHeight());
      });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.log("Error generating attendance PDF", error);
      res.status(500).json({ success: false, message: "Server error generating attendance PDF" });
    }
   },

   // Fetch stored PDFs filtered by logged-in teacher
   getAttendancePDFsByTeacher: async (req, res) => {
     try {
       const teacherName = req.user.name || (req.user._doc && req.user._doc.name);
       const Teacher = require("../models/teacher.model");

       if (!teacherName) {
         return res.status(400).json({ success: false, message: "Teacher name not found in user data" });
       }

       // Find teacher document by name
       const teacherDoc = await Teacher.findOne({ name: teacherName });
       if (!teacherDoc) {
         return res.status(404).json({ success: false, message: "Teacher not found" });
       }
       const teacherId = teacherDoc._id;

       const attendancePDFs = await AttendancePDF.find({ teacher: teacherId })
         .populate({
           path: 'subject',
           select: 'subject_name year',
           populate: {
             path: 'year',
             select: 'semester_text semester_num'
           }
         })
         .lean();

       const pdfList = attendancePDFs.map(pdf => ({
         id: pdf._id,
         subjectName: pdf.subject.subject_name,
         date: pdf.date,
         semesterText: pdf.subject.year ? pdf.subject.year.semester_text : "Unknown Year",
         semesterNum: pdf.subject.year ? pdf.subject.year.semester_num : null,
       }));

       res.status(200).json({ success: true, data: pdfList });
     } catch (error) {
       console.log("Error fetching attendance PDFs by teacher", error);
       res.status(500).json({ success: false, message: "Server error fetching attendance PDFs" });
     }
   },

   // Fetch PDF data by PDF id
   getAttendancePDFById: async (req, res) => {
     try {
       const pdfId = req.params.pdfId;
       const teacherName = req.user.name || (req.user._doc && req.user._doc.name);
       const Teacher = require("../models/teacher.model");

       if (!teacherName) {
         return res.status(400).json({ success: false, message: "Teacher name not found in user data" });
       }

       // Find teacher document by name
       const teacherDoc = await Teacher.findOne({ name: teacherName });
       if (!teacherDoc) {
         return res.status(404).json({ success: false, message: "Teacher not found" });
       }
       const teacherId = teacherDoc._id;

       const attendancePDF = await AttendancePDF.findOne({ _id: pdfId, teacher: teacherId });
       if (!attendancePDF) {
         return res.status(404).json({ success: false, message: "PDF not found or access denied" });
       }

       res.setHeader('Content-Type', 'application/pdf');
       res.setHeader('Content-Disposition', `inline; filename="attendance_${attendancePDF.subject.subject_name}_${attendancePDF.date.toISOString().split('T')[0]}.pdf"`);
       res.send(attendancePDF.pdfData);
     } catch (error) {
       console.log("Error fetching attendance PDF by id", error);
       res.status(500).json({ success: false, message: "Server error fetching attendance PDF" });
      }
    }
  }

