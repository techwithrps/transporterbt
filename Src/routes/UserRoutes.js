const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const adminAuth = require("../middlewares/adminmiddleware");
const UserController = require("../controller/UserController");

// Get all users
router.get("/allusers", auth, UserController.getAllusers);
router.get("/", auth, UserController.getAllusers);

// Get single user
router.get("/:id", auth, UserController.getUserById);

// Create new user (Admin)
router.post("/create", auth, adminAuth, UserController.createUser);
router.post("/", auth, adminAuth, UserController.createUser);

// Update user role
router.put("/:id/role", auth, adminAuth, UserController.updateUserRole);

// Update user details
router.put("/:id", auth, adminAuth, UserController.updateUser);

// Delete user (Admin)
router.delete("/:id", auth, adminAuth, UserController.deleteUser);

module.exports = router;
