require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const departmentRouter = require("./routers/department.router");
const semesterRouter = require("./routers/semester.router");
const subjectRouter = require("./routers/subject.router");
const studentRouter = require("./routers/student.router");
const teacherRouter = require("./routers/teacher.router");
const examinationRouter = require("./routers/examination.router");
const noticeRouter = require("./routers/notice.router");
const scheduleRouter = require("./routers/schedule.router");
const attendanceRouter = require("./routers/attendance.router");
const assignmentRouter = require("./routers/assignment.router");
const noteRouter = require("./routers/note.router");
const directorRouter = require("./routers/director.router");
const hodRouter = require("./routers/hod.router");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const path = require("path");

// Serve static files from uploads directory
// Removed redundant static serving to avoid conflicts
// app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files for teacher images
app.use('/teacher_images', express.static(path.join(__dirname, 'uploads/teacher_images')));

// Serve static files for student images
app.use('/student_images', express.static(path.join(__dirname, 'uploads/student_images')));

// CORS Configuration (Allow frontend access)
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:5173"];
if (!process.env.CLIENT_URL) {
  console.warn("⚠️ CLIENT_URL is not defined. Using default localhost URL.");
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Allow cookies & authorization headers
    allowedHeaders: ["Authorization", "Content-Type"],
    exposedHeaders: ["Authorization"], // Ensure frontend can access token
  })
);

// MongoDB Connection
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/UIET-CONNECT";
if (!process.env.MONGO_URI) {
  console.warn("⚠️ MONGO_URI is not defined. Using default localhost URI.");
}

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit the process if DB connection fails
  }
};

connectMongoDB();

// Routes
app.use("/api/department", departmentRouter);
app.use("/api/semester", semesterRouter);
app.use("/api/subject", subjectRouter);
app.use("/api/student", studentRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/examination", examinationRouter);
app.use("/api/notice", noticeRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/note", noteRouter);
app.use("/api/director", directorRouter);
app.use("/api/hod", hodRouter);
const directorNoticeRouter = require("./routers/directorNotice.router");
app.use("/api/directorNotice", directorNoticeRouter);

// Handle Undefined Routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
