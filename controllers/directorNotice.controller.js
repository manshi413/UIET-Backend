const Notice = require("../models/notice.model");
const NoticeDirector = require("../models/noticeDirector.model");


const mongoose = require('mongoose');

module.exports = {
  createNotice: async (req, res) => {
    try {
      const { title, message, audience, selectedAudienceMembers, recipientNames } = req.body;
      // Removed department filter as per user request

      let notices = [];

      if (selectedAudienceMembers && selectedAudienceMembers.length > 0) {
        if (!recipientNames || recipientNames.length !== selectedAudienceMembers.length) {
          return res.status(400).json({
            success: false,
            message: "recipientNames array length must match selectedAudienceMembers length",
          });
        }

        // Create notices for each selected audience member in NoticeDirector collection
        notices = await Promise.all(
          selectedAudienceMembers.map(async (memberId) => {
            const recipientIndex = selectedAudienceMembers.findIndex(id => id === memberId);
            const recipientName = recipientNames[recipientIndex] || "";

            const newNotice = new NoticeDirector({
              // department: department, // Removed department field
              title: title,
              message: message,
              audience: audience,
              recipient: memberId,
              recipientName: recipientName,
            });
            await newNotice.save();
            return newNotice;
          })
        );
      } else {
        // Create a group notice with recipient set to null
        const newNotice = new NoticeDirector({
          // department: department, // Removed department field
          title: title,
          message: message,
          audience: audience,
          recipient: null,
          recipientName: "All " + audience,
        });
        await newNotice.save();
        notices.push(newNotice);
      }

      res.status(200).json({
        success: true,
        message: "Notices successfully created",
        notices: notices,
      });
    } catch (error) {
      console.error("Error creating director notices:", error);
      res.status(500).json({
        success: false,
        message: "Server error in creating director notices",
      });
    }
  },

  getNoticesForDirector: async (req, res) => {
    try {
      // Removed department filter as per user request
      const notices = await NoticeDirector.find({ audience: { $in: ["Teachers", "HODs"] } });
      res.status(200).json({
        success: true,
        message: "Notices fetched for director",
        data: notices,
      });
    } catch (error) {
      console.error("Error fetching director notices:", error);
      res.status(500).json({
        success: false,
        message: "Server error in fetching director notices",
      });
    }
  },

  getNoticesForRecipient: async (req, res) => {
    try {
      if (!req.user || !req.user.id || !req.user.name) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User information missing",
        });
      }
      const recipientId = new mongoose.Types.ObjectId(req.user.id);
      const recipientName = req.user.name;
      console.log("Fetching notices for recipient:", recipientId, "with name:", recipientName);
      const notices = await NoticeDirector.find({
        $or: [
          { recipient: recipientId },
          { recipient: null, recipientName: recipientName }
        ],
        audience: { $in: ["Teachers", "HODs"] }
      });
      console.log(`Found ${notices.length} notices for recipient ${recipientId} with name ${recipientName}`);
      console.log("Notices details:", notices);
      res.status(200).json({
        success: true,
        message: "Notices fetched for recipient",
        data: notices,
      });
    } catch (error) {
      console.error("Error fetching notices for recipient:", error);
      res.status(500).json({
        success: false,
        message: "Server error in fetching notices for recipient",
      });
    }
  },

  updateNotice: async (req, res) => {
    try {
      const noticeId = req.params.id;
      const { title, message } = req.body;

      const updatedNotice = await NoticeDirector.findByIdAndUpdate(
        noticeId,
        { title, message },
        { new: true }
      );

      if (!updatedNotice) {
        return res.status(404).json({ success: false, message: "Notice not found" });
      }

      res.status(200).json({ success: true, message: "Notice updated", notice: updatedNotice });
    } catch (error) {
      console.error("Error updating notice:", error);
      res.status(500).json({ success: false, message: "Server error updating notice" });
    }
  },

  deleteNotice: async (req, res) => {
    try {
      const noticeId = req.params.id;

      const deletedNotice = await NoticeDirector.findByIdAndDelete(noticeId);

      if (!deletedNotice) {
        return res.status(404).json({ success: false, message: "Notice not found" });
      }

      res.status(200).json({ success: true, message: "Notice deleted" });
    } catch (error) {
      console.error("Error deleting notice:", error);
      res.status(500).json({ success: false, message: "Server error deleting notice" });
    }
  }
};
