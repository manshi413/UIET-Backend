const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  getAllDepartments,
  registerDepartment,
  loginDepartment,
  updateDepartment,
  getDepartmentOwnData,
} = require("../controllers/department.controller");
const router = express.Router();

router.post("/register", registerDepartment);
router.get("/all", getAllDepartments);
router.post("/login", loginDepartment);
router.patch("/update",authMiddleware(["DEPARTMENT"]), updateDepartment);
router.get("/fetch-single",authMiddleware(["DEPARTMENT"]),getDepartmentOwnData);


module.exports = router;
