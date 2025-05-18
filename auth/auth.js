const jwt = require("jsonwebtoken");

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        console.log("No token found in request headers");
        return res.status(401).json({ success: false, message: "No token, Authorization denied" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded) {
        console.log("Token verification failed");
        return res.status(401).json({ success: false, message: "Invalid Token" });
      }

      console.log("Decoded token:", decoded);

      req.user = decoded; // now req.user has departmentId if token payload has it

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        console.log(`Access Denied: User role ${req.user.role} not in allowed roles ${roles}`);
        return res.status(403).json({ success: false, message: "Access Denied" });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  };
};

module.exports = authMiddleware;