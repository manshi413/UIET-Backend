require("dotenv").config();
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Director = require("../models/director.model");
const Teacher = require("../models/teacher.model");

module.exports = {
  registerDirector: async (req, res) => {
    try {
      const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, files) => {
        if (!fields.name || !Array.isArray(fields.name) || !fields.name[0] ||
            !fields.email || !Array.isArray(fields.email) || !fields.email[0] ||
            !fields.department || !Array.isArray(fields.department) || !fields.department[0] ||
            !fields.password || !Array.isArray(fields.password) || !fields.password[0]) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields: name, email, department, or password.",
          });
        }

        const director = await Director.findOne({ email: fields.email[0] });
        if (director) {
          return res
            .status(409)
            .json({
              success: false,
              message: "Director already exists with this email.",
            });
        } else {
          const photo = files.image[0];
          let filepath = photo.filepath;
          let originalFilename = photo.originalFilename.replace(" ", "_");
          // Resolve the directory path relative to project root
          const dirPath = path.join(__dirname, "../../", process.env.DIRECTOR_IMAGE_PATH || "uploads/director_images");
          // Ensure directory exists
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          let newPath = path.join(dirPath, originalFilename);

          let photoData = fs.readFileSync(filepath);
          fs.writeFileSync(newPath, photoData);

          const salt = bcrypt.genSaltSync(10);
          const hashPassword = bcrypt.hashSync(fields.password[0], salt);
          const newDirector = new Director({
            name: fields.name[0],
            email: fields.email[0],
            department: fields.department[0],
            director_image: originalFilename,
            password: hashPassword,
          });

          const savedDirector = await newDirector.save();
          res.status(200).json({
            success: true,
            data: savedDirector,
            message: "Director registered successfully",
          });
        }
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Director registration failed" });
    }
  },

  getDirectorProfileFromTeacher: async (req, res) => {
    try {
      const email = req.user.email;
      const teacher = await Teacher.findOne({ email: email }).populate("department").select("-password");
      if (teacher) {
        res.status(200).json({ success: true, teacher });
      } else {
        res.status(404).json({ success: false, message: "Teacher not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error: [own teacher data]",
      });
    }
  },

  loginDirector: async (req, res) => {
    try {
      console.log("Director login request body:", req.body);
      // Find the director by email
      const director = await Director.findOne({ email: req.body.email });
      console.log("Director found:", director);

      if (director) {
        console.log("Director password hash in DB:", director.password);
        console.log("Password provided:", req.body.password);
        const isAuth = bcrypt.compareSync(
          req.body.password,
          director.password
        );
        console.log("Password match result:", isAuth);
        if (isAuth) {
          const jwtSecret = process.env.JWT_SECRET;
          const token = jwt.sign(
            {
              id: director._id,
              director: director._id,
              name: director.name,
              email: director.email,
              department: director.department,
              image_url: director.director_image,
              role: "DIRECTOR",
            },
            jwtSecret
          );

          res.header("Authorization", "Bearer " + token);
          res.status(200).json({
            success: true,
            message: "Successfully logged in",
            user: {
              id: director._id,
              name: director.name,
              email: director.email,
              department: director.department,
              image_url: director.director_image,
              role: "DIRECTOR",
            },
          });
        } else {
          console.log("Password mismatch for director:", req.body.email);
          res.status(401).json({ success: false, message: "Invalid password" });
        }
      } else {
        console.log("Director not found for email:", req.body.email);
        res.status(401).json({ success: false, message: "Director not found" });
      }
    } catch (error) {
      console.error("Error in director login:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error: [director login].",
      });
    }
  },

  getAllDirectors: async (req, res) => {
    try {
      const directors = await Director.find().select([
        "-password",
        "-_id",
        "-email",
        "-department",
        "-createdAt",
      ]);
      res.status(200).json({
        success: true,
        message: "Success in fetching all directors",
        directors,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error: [all directors]",
      });
    }
  },

  getDirectorOwnData: async (req, res) => {
    try {
      const id = req.user.id;
      const director = await Director.findOne({ _id: id }).select(["-password"]);
      if (director) {
        res.status(200).json({ success: true, director });
      } else {
        res.status(404).json({ success: false, message: "Director not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error: [own director data]",
      });
    }
  },

  updateDirector: async (req, res) => {
    try {
      const id = req.params.id || req.user.id;

      if (req.is('multipart/form-data')) {
        // Use formidable to parse multipart/form-data
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Error in form parsing" });
          }

          // If isActive is being set to true, set all other directors to false
          if (fields.isActive && fields.isActive[0] === "true") {
            await Director.updateMany({ _id: { $ne: id } }, { isActive: false });
          }

          const director = await Director.findOne({ _id: id });
          if (!director) {
            return res.status(404).json({ success: false, message: "Director not found" });
          }

          if (files && files.image) {
            const photo = files.image[0];
            let filepath = photo.filepath;
            let originalFilename = photo.originalFilename.replace(" ", "_");

            if (director.director_image) {
              let oldImagePath = path.join(
                __dirname,
                "../../",
                process.env.DIRECTOR_IMAGE_PATH || "uploads/director_images",
                director.director_image
              );
              if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                  if (err) console.log("Error deleting old image:", err);
                });
              }
            }

            // Resolve the directory path relative to project root
            const dirPath = path.join(__dirname, "../../", process.env.DIRECTOR_IMAGE_PATH || "uploads/director_images");
            // Ensure directory exists
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true });
            }
            let newPath = path.join(dirPath, originalFilename);
            let photoData = fs.readFileSync(filepath);
            fs.writeFileSync(newPath, photoData);

            director.director_image = originalFilename;
          }

          if (fields.password) {
            const salt = bcrypt.genSaltSync(10);
            const hashPassword = bcrypt.hashSync(fields.password[0], salt);
            director.password = hashPassword;
          }

          Object.keys(fields).forEach((field) => {
            if (field !== "password") {
              director[field] = fields[field][0];
            }
          });

          await director.save();

          res.status(200).json({
            success: true,
            message: "Director updated successfully",
            director,
          });
        });
      } else if (req.is('application/json')) {
        // Handle JSON request body
        const fields = req.body;

        // If isActive is being set to true, set all other directors to false
        if (fields.isActive === true || fields.isActive === 'true') {
          await Director.updateMany({ _id: { $ne: id } }, { isActive: false });
        }

        const director = await Director.findOne({ _id: id });
        if (!director) {
          return res.status(404).json({ success: false, message: "Director not found" });
        }

        Object.keys(fields).forEach((field) => {
          if (field !== "password") {
            director[field] = fields[field];
          }
        });

        if (fields.password) {
          const salt = bcrypt.genSaltSync(10);
          const hashPassword = bcrypt.hashSync(fields.password, salt);
          director.password = hashPassword;
        }

        await director.save();

        res.status(200).json({
          success: true,
          message: "Director updated successfully",
          director,
        });
      } else {
        res.status(400).json({ success: false, message: "Unsupported content type" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error updating director" });
    }
  },
  deleteDirector: async (req, res) => {
    try {
      const id = req.params.id;
      const director = await Director.findById(id);
      if (!director) {
        return res.status(404).json({ success: false, message: "Director not found" });
      }

      if (director.director_image) {
        const imagePath = path.join(__dirname, "../../", process.env.DIRECTOR_IMAGE_PATH || "uploads/director_images", director.director_image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await Director.deleteOne({ _id: id });
      res.status(200).json({ success: true, message: "Director deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error deleting director" });
    }
  },

  fetchDirectorsWithQuery: async (req, res) => {
    try {
      const query = req.query.search ? { name: { $regex: req.query.search, $options: "i" } } : {};
      const directors = await Director.find(query).select("-password");
      res.status(200).json({ success: true, directors });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching directors with query" });
    }
  },

  createOrUpdateDirectorFromTeacher: async (req, res) => {
    try {
      const { teacherId, isActive } = req.body;
      console.log("Received teacherId:", teacherId, "isActive:", isActive);
      if (!teacherId) {
        return res.status(400).json({ success: false, message: "teacherId is required" });
      }

      // Fetch teacher details from Teacher model (assuming it exists)
      const Teacher = require("../models/teacher.model");
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        console.log("Teacher not found for id:", teacherId);
        return res.status(404).json({ success: false, message: "Teacher not found" });
      }

      // Find the single director document (singleton)
      let director = await Director.findOne();

      console.log("Teacher password hash:", teacher.password);
      if (director) {
        console.log("Existing director password hash:", director.password);
      } else {
        console.log("No existing director found");
      }

      if (!director) {
        console.log("Creating new singleton director for teacher email:", teacher.email);
        const defaultPassword = "Manshi413@";
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(defaultPassword, salt);
        director = new Director({
          name: teacher.name,
          email: teacher.email,
          department: teacher.department,
          director_image: teacher.director_image || "default.png",
          password: hashPassword,
          isActive: !!isActive,
        });
      } else {
        console.log("Updating singleton director:", director._id);
        const defaultPassword = "Manshi413@";
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(defaultPassword, salt);
        director.name = teacher.name;
        director.email = teacher.email;
        director.department = teacher.department;
        director.director_image = teacher.director_image || director.director_image;
        director.password = hashPassword;
        director.isActive = !!isActive;
      }

      await director.save();
      console.log("Singleton director saved:", director._id);

      res.status(200).json({ success: true, message: "Singleton director created/updated successfully", director });
    } catch (error) {
      console.error("Error in createOrUpdateDirectorFromTeacher:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  fetchSelectedDirectors: async (req, res) => {
    try {
      // Placeholder implementation: return empty array or implement actual logic
      res.status(200).json({ success: true, directors: [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching selected directors" });
    }
  },

  getSelectedDirectorForTeacher: async (req, res) => {
    try {
      // Placeholder implementation: return null or implement actual logic
      res.status(200).json({ success: true, director: null });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching selected director for teacher" });
    }
  },
};