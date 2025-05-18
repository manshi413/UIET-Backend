const Note = require("../models/note.model");
const Subject = require("../models/subject.model");
const path = require("path");
const fs = require("fs");

module.exports = {
  uploadNote: async (req, res) => {
    try {
      const subjectId = req.body.subjectId;
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }
      const filePath = req.file.filename;

      // Check if subject exists and belongs to user's department
      const subject = await Subject.findOne({ _id: subjectId, department: req.user.department });
      if (!subject) {
        return res.status(404).json({ success: false, message: "Subject not found or access denied" });
      }

      // Create new note entry
      const newNote = new Note({
        subject: subjectId,
        department: req.user.department,
        filePath: filePath,
      });

      await newNote.save();

      res.status(200).json({ success: true, message: "Note uploaded successfully", data: newNote });
    } catch (error) {
      console.error("Error uploading note:", error);
      res.status(500).json({ success: false, message: "Server error uploading note", error: error.message });
    }
  },

  getNotesBySubject: async (req, res) => {
    try {
      const subjectId = req.params.subjectId;
      // Verify subject belongs to user's department
      const subject = await Subject.findOne({ _id: subjectId, department: req.user.department });
      if (!subject) {
        return res.status(404).json({ success: false, message: "Subject not found or access denied" });
      }
      const notes = await Note.find({ subject: subjectId });
      res.status(200).json({ success: true, data: notes });
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ success: false, message: "Server error fetching notes" });
    }
  },
};
