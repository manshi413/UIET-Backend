const HOD = require("../models/hod.model");

module.exports = {
  saveOrUpdateHOD: async (req, res) => {
    try {
      const hodArray = req.body;

      if (!Array.isArray(hodArray) || hodArray.length === 0) {
        return res.status(400).json({ success: false, message: "Request body must be a non-empty array of HOD objects" });
      }

      const results = [];

      for (const hodData of hodArray) {
        const { department, teacher } = hodData;

        if (!department || !teacher) {
          return res.status(400).json({ success: false, message: "Each HOD object must have department and teacher" });
        }

        let hod = await HOD.findOne({ department });

        if (hod) {
          hod.teacher = teacher;
          await hod.save();
          results.push(hod);
        } else {
          hod = new HOD({ department, teacher });
          await hod.save();
          results.push(hod);
        }
      }

      res.status(200).json({ success: true, message: "HODs saved successfully", hods: results });
    } catch (error) {
      console.error("Error saving HODs:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getHODs: async (req, res) => {
    try {
      const hods = await HOD.find({}).populate('department').populate('teacher');
      res.status(200).json({ success: true, hods });
    } catch (error) {
      console.error("Error fetching HODs:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
};
