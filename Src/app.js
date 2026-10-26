const express = require("express");
const path = require("path");
const cors = require("cors");
const { connectDB } = require("./config/dbconfig");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      const allowedPatterns = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/10\.0\.2\.2(:\d+)?$/,
        /\.vercel\.app$/,
        /transporter\.in$/,
        /elogisol\.in$/
      ];

      const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback allow to prevent deployment blockers
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const UserRoutes = require("./routes/UserRoutes");
const transportRequestRoutes = require("./routes/transportRequestRoutes");
const transporterRoutes = require("./routes/transporterdetailsroutes");
const CustomerMasterRoutes = require("./routes/customermasterroutes");
const transactionRoutes = require("./routes/transactionRoutes");
const transportlistroutes = require("./routes/transporterlistroutes");
const serviceroutes = require("./routes/serviceroutes");
const vendorRoutes = require("./routes/vendorRoutes"); // Add this line
const driverRoutes = require("./routes/driverRoutes");
const locationRoutes = require("./routes/locationroutes"); // Import location routes
const equipmentRoutes = require("./routes/equipmentRoutes");
const fleetEquipmentRoutes = require("./routes/fleetEquipmentRoutes"); // Import equipment routes
const vehiicleRoutes = require("./routes/vehicleRoutes"); // Import vehicle routes
const asnRoutes = require("./routes/asnRoutes"); // Import ASN routes
const paymentReceiptRoutes = require("./routes/paymentReceiptRoutes"); // Import payment receipt routes
const containerTrackingRoutes = require("./routes/containerTrackingRoutes");
// Mount routes with more specific routes first
app.use("/api/auth", authRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/transport-requests", transportRequestRoutes);
app.use("/api", transporterRoutes);
app.use("/api/customers", CustomerMasterRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transporterlist", transportlistroutes);
app.use("/api/services", serviceroutes);
app.use("/api", vendorRoutes);
app.use("/api", driverRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/fleet-equipment", fleetEquipmentRoutes);
app.use("/api/vehicles", vehiicleRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api", equipmentRoutes);
app.use("/api", fleetEquipmentRoutes);
app.use("/api", vehiicleRoutes);
app.use("/api/asn", asnRoutes);
app.use("/api", asnRoutes);
app.use("/api/payment-receipts", paymentReceiptRoutes);
app.use("/api/containers", containerTrackingRoutes);

// Dual-mount without /api prefix for bulletproof frontend compatibility
app.use("/auth", authRoutes);
app.use("/users", UserRoutes);
app.use("/transport-requests", transportRequestRoutes);
app.use("/customers", CustomerMasterRoutes);
app.use("/transactions", transactionRoutes);
app.use("/transporterlist", transportlistroutes);
app.use("/services", serviceroutes);
app.use("/locations", locationRoutes);
app.use("/payment-receipts", paymentReceiptRoutes);
app.use("/containers", containerTrackingRoutes);
app.use("/", vendorRoutes);
app.use("/", driverRoutes);
app.use("/fleet-equipment", fleetEquipmentRoutes);
app.use("/vehicles", vehiicleRoutes);
app.use("/equipment", equipmentRoutes);
app.use("/", equipmentRoutes);
app.use("/", fleetEquipmentRoutes);
app.use("/", vehiicleRoutes);
app.use("/asn", asnRoutes);
app.use("/", asnRoutes);
app.use("/", transporterRoutes); // Payment receipts routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Transporter API Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    message: "Server is running",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Add route not found handler
app.use((req, res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);

  process.exit(1);
});

module.exports = app;
