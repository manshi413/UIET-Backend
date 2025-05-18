const Assignment = require("../models/assignment.model");
const Subject = require("../models/subject.model");
const StudentAssignment = require("../models/studentAssignment.model");
const Student = require("../models/student.model");

// Upload a new assignment
exports.uploadAssignment = async (req, res) => {
  try {
    const { teacherId, year, subjectId, dueDate } = req.body;
    const file = req.file;

    if (!teacherId || !year || !subjectId || !file) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify teacher belongs to user's department
    const teacher = await require("../models/teacher.model").findOne({ _id: teacherId, department: req.user.department });
    if (!teacher) {
      return res.status(403).json({ message: "Access denied: Teacher does not belong to your department" });
    }

    // Verify subject belongs to user's department
    const subject = await Subject.findOne({ _id: subjectId, department: req.user.department });
    if (!subject) {
      return res.status(403).json({ message: "Access denied: Subject does not belong to your department" });
    }

    // Construct fileUrl from uploaded file path, remove 'api\' prefix if present
    let fileUrl = file.path;
    if (fileUrl.startsWith('api\\') || fileUrl.startsWith('api/')) {
      fileUrl = fileUrl.substring(4);
    }

    const assignment = new Assignment({
      teacher: teacherId,
      department: req.user.department,
      year,
      subject: subjectId,
      fileUrl,
      dueDate,  // Save dueDate
    });

    await assignment.save();

    res.status(201).json({ message: "Assignment uploaded successfully", assignment });
  } catch (error) {
    console.error("Error uploading assignment:", error.stack || error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get assignments by teacher, year, subject
exports.getAssignments = async (req, res) => {
  try {
    const { teacherId, year, subjectId } = req.query;

    // Verify teacher belongs to user's department if teacherId provided
    if (teacherId) {
      const teacher = await require("../models/teacher.model").findOne({ _id: teacherId, department: req.user.department });
      if (!teacher) {
        return res.status(403).json({ message: "Access denied: Teacher does not belong to your department" });
      }
    }

    // Verify subject belongs to user's department if subjectId provided
    if (subjectId) {
      const subject = await Subject.findOne({ _id: subjectId, department: req.user.department });
      if (!subject) {
        return res.status(403).json({ message: "Access denied: Subject does not belong to your department" });
      }
    }

    const filter = {};
    if (teacherId) filter.teacher = teacherId;
    if (year) filter.year = year;
    if (subjectId) filter.subject = subjectId;

    const assignments = await Assignment.find(filter)
      .populate("subject", "subject_name")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get assignments for the logged-in student
exports.getAssignmentsForStudent = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find the student to get department and class info
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Filter assignments by student's department and year/class
    const assignments = await Assignment.find({
      department: student.department,
      year: student.student_class,
    })
      .populate("subject", "subject_name")
      .sort({ createdAt: -1 });

    // Fetch student submissions for these assignments
    const studentSubmissions = await StudentAssignment.find({
      student: studentId,
      assignment: { $in: assignments.map(a => a._id) }
    }).select("assignment").lean();

    const submittedAssignmentIds = new Set(studentSubmissions.map(s => s.assignment.toString()));

    // Add done property to assignments
    const assignmentsWithDone = assignments.map(assignment => {
      return {
        ...assignment.toObject(),
        done: submittedAssignmentIds.has(assignment._id.toString())
      };
    });

    res.json({ success: true, assignments: assignmentsWithDone });
  } catch (error) {
    console.error("Error fetching assignments for student:", error);
    res.status(500).json({ success: false, message: "Server error fetching assignments for student" });
  }
};

// Upload assignment by student
exports.uploadAssignmentByStudent = async (req, res) => {
  try {
    console.log("uploadAssignmentByStudent req.body:", req.body);
    console.log("uploadAssignmentByStudent req.file:", req.file);

    const { studentId, assignmentId } = req.body;
    const file = req.file;

    if (!studentId || !assignmentId || !file) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Construct fileUrl from uploaded file path, remove 'api\' prefix if present
    let fileUrl = file.path;
    if (fileUrl.startsWith('api\\') || fileUrl.startsWith('api/')) {
      fileUrl = fileUrl.substring(4);
    }

    // Save the student's uploaded assignment file info to the database
    const studentAssignment = new StudentAssignment({
      student: studentId,
      assignment: assignmentId,
      fileUrl,
    });

    await studentAssignment.save();

    res.status(201).json({ message: "Student assignment uploaded successfully", studentAssignment });
  } catch (error) {
    console.error("Error uploading student assignment:", error.stack || error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get student submissions by assignmentId
exports.getStudentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.query;

    if (!assignmentId) {
      return res.status(400).json({ message: "assignmentId parameter is required" });
    }

    const submissions = await StudentAssignment.find({ assignment: assignmentId })
      .populate("student", "name email")
      .sort({ uploadedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error("Error fetching student submissions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get submission counts for all assignments of a teacher and year
exports.getSubmissionCountsBulk = async (req, res) => {
  try {
    const { teacherId, year } = req.query;

    if (!teacherId || !year) {
      return res.status(400).json({ message: "teacherId and year parameters are required" });
    }

    // Find assignments for the teacher and year
    const assignments = await Assignment.find({ teacher: teacherId, year }).select("_id");

    const assignmentIds = assignments.map(a => a._id);

    // Aggregate submission counts grouped by assignment
    const counts = await StudentAssignment.aggregate([
      { $match: { assignment: { $in: assignmentIds } } },
      { $group: { _id: "$assignment", count: { $sum: 1 } } }
    ]);

    // Map counts by assignmentId
    const countsMap = {};
    counts.forEach(c => {
      countsMap[c._id.toString()] = c.count;
    });

    res.json(countsMap);
  } catch (error) {
    console.error("Error fetching submission counts bulk:", error);
    res.status(500).json({ message: "Server error" });
  }
};
