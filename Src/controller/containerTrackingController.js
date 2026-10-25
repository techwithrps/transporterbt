const { pool, sql } = require("../config/dbconfig");

// Track container by container number
exports.trackContainer = async (req, res) => {
  try {
    const { containerNo } = req.params;
    if (!containerNo || !containerNo.trim()) {
      return res.status(400).json({ success: false, message: "Container number is required" });
    }

    const cleanNo = containerNo.trim();

    // Query container and linked transport request
    const result = await pool.request()
      .input("containerNo", sql.VarChar(100), cleanNo)
      .query(`
        SELECT 
          td.id AS transporter_detail_id,
          td.request_id,
          td.container_no,
          td.container_type,
          td.container_size,
          td.line,
          td.seal_no,
          td.seal1,
          td.seal2,
          td.container_total_weight,
          td.cargo_total_weight,
          td.vehicle_number,
          td.driver_name,
          td.driver_contact,
          td.license_number,
          td.transporter_name,
          td.total_charge,
          td.vin_no,
          td.created_at AS assigned_at,
          tr.shipa_no,
          tr.status AS request_status,
          tr.pickup_location,
          tr.stuffing_location,
          tr.delivery_location,
          tr.commodity,
          tr.cargo_type,
          tr.vehicle_status,
          tr.consignee,
          tr.consigner,
          tr.expected_pickup_date,
          tr.expected_pickup_time,
          tr.expected_delivery_date,
          tr.expected_delivery_time,
          tr.created_at AS request_created_at
        FROM transporter_details td
        LEFT JOIN transport_requests tr ON td.request_id = tr.id
        WHERE LOWER(td.container_no) = LOWER(@containerNo)
           OR LOWER(td.container_no) LIKE '%' || LOWER(@containerNo) || '%'
        ORDER BY td.id DESC
        LIMIT 1
      `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Container ${containerNo} not found in system`
      });
    }

    const item = result.recordset[0];
    const status = item.request_status || "Vehicle Assigned";

    // Build timeline stages
    const isCompleted = (target) => {
      const order = ["Pending", "Vehicle Assigned", "Loaded", "In Transit", "Delivered"];
      const currentIndex = order.indexOf(status);
      const targetIndex = order.indexOf(target);
      return currentIndex >= targetIndex;
    };

    const stages = [
      {
        id: 1,
        title: "Request Created",
        description: `Booking #${item.request_id} created by ${item.consigner || "Customer"}`,
        timestamp: item.request_created_at,
        completed: true,
        current: status === "Pending",
        location: item.pickup_location
      },
      {
        id: 2,
        title: "Vehicle & Driver Assigned",
        description: `Assigned to vehicle ${item.vehicle_number} (Driver: ${item.driver_name})`,
        timestamp: item.assigned_at,
        completed: isCompleted("Vehicle Assigned"),
        current: status === "Vehicle Assigned",
        location: item.pickup_location
      },
      {
        id: 3,
        title: "Loaded & Sealed",
        description: item.seal_no ? `Seal #${item.seal_no} verified at ${item.stuffing_location || item.pickup_location}` : `Loaded at ${item.pickup_location}`,
        timestamp: item.expected_pickup_date,
        completed: isCompleted("Loaded"),
        current: status === "Loaded",
        location: item.stuffing_location || item.pickup_location
      },
      {
        id: 4,
        title: "In Transit",
        description: `Moving towards ${item.delivery_location}`,
        timestamp: item.expected_pickup_date,
        completed: isCompleted("In Transit"),
        current: status === "In Transit",
        location: `En route to ${item.delivery_location}`
      },
      {
        id: 5,
        title: "Delivered / Handover",
        description: `Delivered at ${item.delivery_location} for ${item.consignee || "Consignee"}`,
        timestamp: item.expected_delivery_date,
        completed: status === "Delivered",
        current: status === "Delivered",
        location: item.delivery_location
      }
    ];

    let currentLocation = item.pickup_location;
    if (status === "Delivered") {
      currentLocation = `${item.delivery_location} (Delivered)`;
    } else if (status === "In Transit") {
      currentLocation = `In Transit (${item.pickup_location} → ${item.delivery_location})`;
    } else if (status === "Loaded") {
      currentLocation = item.stuffing_location || item.pickup_location;
    } else if (item.vehicle_number) {
      currentLocation = `${item.pickup_location} (Vehicle Assigned)`;
    }

    return res.status(200).json({
      success: true,
      container: {
        container_no: item.container_no,
        container_type: item.container_type || "Standard Dry",
        container_size: item.container_size || "40ft",
        line: item.line || "Direct",
        seal_no: item.seal_no || item.seal1 || "Verified",
        vehicle_number: item.vehicle_number,
        driver_name: item.driver_name,
        driver_contact: item.driver_contact,
        transporter_name: item.transporter_name,
        request_id: item.request_id,
        shipa_no: item.shipa_no,
        pickup_location: item.pickup_location,
        delivery_location: item.delivery_location,
        consignee: item.consignee,
        consigner: item.consigner,
        expected_pickup_date: item.expected_pickup_date,
        expected_delivery_date: item.expected_delivery_date,
        status: status,
        current_location: currentLocation,
        stages: stages
      }
    });

  } catch (error) {
    console.error("Error in trackContainer:", error);
    res.status(500).json({ success: false, message: "Error tracking container: " + error.message });
  }
};

// Get all tracked containers
exports.getAllContainers = async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        td.id,
        td.container_no,
        td.container_size,
        td.container_type,
        td.vehicle_number,
        td.driver_name,
        td.driver_contact,
        td.transporter_name,
        td.request_id,
        td.created_at,
        tr.status AS request_status,
        tr.pickup_location,
        tr.delivery_location,
        tr.consignee,
        tr.consigner
      FROM transporter_details td
      LEFT JOIN transport_requests tr ON td.request_id = tr.id
      WHERE td.container_no IS NOT NULL AND TRIM(td.container_no) != ''
      ORDER BY td.id DESC
      LIMIT 100
    `);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error("Error in getAllContainers:", error);
    res.status(500).json({ success: false, message: "Error fetching containers: " + error.message });
  }
};
