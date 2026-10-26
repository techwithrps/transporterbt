const bcrypt = require("bcrypt");
const { pool, sql } = require("../config/dbconfig");

// Normalize role string (e.g. "admin" -> "Admin", "customer" -> "Customer")
const normalizeRole = (role) => {
  if (!role) return "Customer";
  const r = role.trim().toLowerCase();
  if (r === "admin") return "Admin";
  if (r === "driver") return "Driver";
  return "Customer";
};

// 1. Get all users
exports.getAllusers = async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT id, name, email, phone, role, created_at 
      FROM users
      ORDER BY id ASC
    `);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.recordset || [],
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error fetching users",
    });
  }
};

// 2. Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT id, name, email, phone, role, created_at FROM users WHERE id = @id");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error("Get user by id error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error fetching user",
    });
  }
};

// 3. Create user (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const formattedRole = normalizeRole(role);

    // Check if user already exists
    const checkRes = await pool
      .request()
      .input("email", sql.VarChar, cleanEmail)
      .query("SELECT id FROM users WHERE LOWER(email) = @email");

    if (checkRes.recordset && checkRes.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertRes = await pool
      .request()
      .input("name", sql.VarChar, name.trim())
      .input("email", sql.VarChar, cleanEmail)
      .input("phone", sql.VarChar, phone ? phone.trim() : "9999999999")
      .input("password", sql.VarChar, hashedPassword)
      .input("role", sql.VarChar, formattedRole)
      .query(`
        INSERT INTO users (name, email, phone, password, role)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.created_at
        VALUES (@name, @email, @phone, @password, @role)
      `);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: insertRes.recordset[0],
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error creating user",
    });
  }
};

// 4. Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const formattedRole = normalizeRole(role);

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("role", sql.VarChar, formattedRole)
      .query("UPDATE users SET role = @role WHERE id = @id");

    res.status(200).json({
      success: true,
      message: `User role updated to ${formattedRole}`,
      role: formattedRole,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error updating user role",
    });
  }
};

// 5. Update user details
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, password } = req.body;

    const reqDb = pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.VarChar, name || "")
      .input("phone", sql.VarChar, phone || "")
      .input("role", sql.VarChar, normalizeRole(role));

    let query = `UPDATE users SET name = @name, phone = @phone, role = @role`;

    if (email && email.trim()) {
      reqDb.input("email", sql.VarChar, email.trim().toLowerCase());
      query += `, email = @email`;
    }

    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password.trim(), salt);
      reqDb.input("password", sql.VarChar, hashedPassword);
      query += `, password = @password`;
    }

    query += ` WHERE id = @id`;
    await reqDb.query(query);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error updating user",
    });
  }
};

// 6. Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    // Check if user exists
    const checkRes = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT id, email, role FROM users WHERE id = @id");

    if (!checkRes.recordset || checkRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const targetUser = checkRes.recordset[0];

    // Delete user from database
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM users WHERE id = @id");

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error deleting user",
    });
  }
};
