require("dotenv").config();
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Teacher = require("../models/teacher.model");

module.exports = {
  registerTeacher: async (req, res) => {
    try {
      const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, files) => {
        const teacher = await Teacher.findOne({ email: fields.email[0] });
        if (teacher) {
          return res.status(409).json({
            success: false,
            message: "Teacher already exists with this email.",
          });
        } else {
          const photo = files.image[0];
          let filepath = photo.filepath;
          let originalFilename = photo.originalFilename.replace(" ", "_");
          let newPath = path.join(
            __dirname,
            process.env.TEACHER_IMAGE_PATH,
            originalFilename
          );

          let photoData = fs.readFileSync(filepath);
          fs.writeFileSync(newPath, photoData);

          const salt = bcrypt.genSaltSync(10);
          const hashPassword = bcrypt.hashSync(fields.password[0], salt);
          const newTeacher = new Teacher({
            department: req.user.department,
            email: fields.email[0],
            name: fields.name[0],
            gender: fields.gender[0],
            age: fields.age[0],
            qualification: fields.qualification[0],
            teacher_image: originalFilename,
            password: hashPassword,
          });

          const savedTeacher = await newTeacher.save();
          res.status(200).json({
            success: true,
            data: savedTeacher,
            message: "Teacher registered successfully",
          });
        }
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Teacher registration failed" });
    }
  },

  loginTeacher: async (req, res) => {
    try {
      const teacher = await Teacher.findOne({ email: req.body.email });
      if (teacher) {
        const isAuth = bcrypt.compareSync(req.body.password, teacher.password);
        if (isAuth) {
          const jwtSecret = process.env.JWT_SECRET;
          const token = jwt.sign(
            {
              id: teacher._id,
              department: teacher.department,
              name: teacher.name,
              image_url: teacher.teacher_image,
              role: "TEACHER",
            },
            jwtSecret
          );

          res.header("Authorization", token);
          res.status(200).json({
            success: true,
            message: "successfully login",
            user: {
              id: teacher._id,
              department: teacher.department,
              teacher_name: teacher.teacher_name,
              image_url: teacher.teacher_image,
              role: "TEACHER",
            },
          });
        } else {
          res.status(401).json({ success: false, message: "invalid password" });
        }
      } else {
        res.status(401).json({ success: false, message: "Teacher not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "internal server error:[Teacher login].",
      });
    }
  },

  getTeachersWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      // Enable department filter to fetch teachers only from admin's department
      const department = req.user.department;
      filterQuery["department"] = department;

      if (req.query.hasOwnProperty("search")) {
        filterQuery["name"] = { $regex: req.query.search, $options: "i" };
      }

      const teachers = await Teacher.find(filterQuery);
      res.status(200).json({
        success: true,
        message: "success in fetching all Teachers",
        teachers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "internal server error:[all Teacher]",
      });
    }
  },

  getAllTeachers: async (req, res) => {
    try {
      const filterQuery = {};

      if (req.query.hasOwnProperty("search")) {
        filterQuery["name"] = { $regex: req.query.search, $options: "i" };
      }

      const teachers = await Teacher.find(filterQuery);
      res.status(200).json({
        success: true,
        message: "success in fetching all Teachers without department filter",
        teachers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "internal server error:[all Teachers without department]",
      });
    }
  },

  getTeacherOwnData: async (req, res) => {
    try {
      console.log("getTeacherOwnData req.user:", req.user);
      console.log("Raw department id from token payload:", req.user.department);
      let id, department;
      try {
        id = new mongoose.Types.ObjectId(req.user.id);
        department = new mongoose.Types.ObjectId(req.user.department);
      } catch (err) {
        console.error("Invalid ObjectId in token payload:", err);
        return res.status(400).json({ success: false, message: "Invalid user id or department in token" });
      }
      console.log("Searching teacher with id:", id, "and department:", department);

      const teacherById = await Teacher.findOne({ _id: id }).populate("department").select();
      console.log("Teacher found by id only:", teacherById);
      if (teacherById) {
        console.log("Department id in teacher document:", teacherById.department?._id || teacherById.department);
      }

      const teacher = await Teacher.findOne({
        _id: id,
        department: department,
      }).populate("department").select();

      console.log("Teacher found by id and department:", teacher);

      if (teacher) {
        res.status(200).json({ success: true, teacher });
      } else {
        console.log("Teacher not found for given id and department");
        res.status(404).json({ success: false, message: "Teacher not found" });
      }
    } catch (error) {
      console.error("Error in getTeacherOwnData:", error);
      res.status(500).json({
        success: false,
        message: "internal server error:[own  Teacher data]",
      });
    }
  },

  getTeacherWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const department = req.user.department;
      const teacher = await Teacher.findOne({
        _id: id,
        department: department,
      }).select(["-password"]);
      if (teacher) {
        res.status(200).json({ success: true, teacher });
      } else {
        res.status(404).json({ success: false, message: "Teacher not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "internal server error:[own  Teacher data]",
      });
    }
  },

  updateTeacher: async (req, res) => {
    try {
      const id = req.params.id;
      const form = new formidable.IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Error in form parsing" });
        }

        const teacher = await Teacher.findOne({ _id: id });
        if (!teacher) {
          return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        if (files.image) {
          const photo = files.image[0];
          let filepath = photo.filepath;
          let originalFilename = photo.originalFilename.replace(" ", "_");

          if (teacher.teacher_image) {
            let oldImagePath = path.join(__dirname, process.env.TEACHER_IMAGE_PATH, teacher.teacher_image);
            if (fs.existsSync(oldImagePath)) {
              fs.unlink(oldImagePath, (err) => { if (err) console.log("Error deleting old image:", err); });
            }
          }

          let newPath = path.join(__dirname, process.env.TEACHER_IMAGE_PATH, originalFilename);
          let photoData = fs.readFileSync(filepath);
          fs.writeFileSync(newPath, photoData);

          teacher.teacher_image = originalFilename;
        }

        if (fields.password) {
          const salt = bcrypt.genSaltSync(10);
          const hashPassword = bcrypt.hashSync(fields.password[0], salt);
          teacher.password = hashPassword;
        }

        Object.keys(fields).forEach((field) => {
          if (field !== 'password') {
            teacher[field] = fields[field][0];
          }
        });

        await teacher.save();

        res.status(200).json({ success: true, message: "Teacher updated successfully", teacher });
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error updating Teacher" });
    }
  },

  deleteTeacherWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const department = req.user.department;
      const teacher = await Teacher.findOneAndDelete({
        _id: id,
        department: department,
      });
      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found" });
      }
      res.status(200).json({
        success: true,
        message: "Teacher deleted successfully",
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Error deleting Teacher" });
    }
  },
};
