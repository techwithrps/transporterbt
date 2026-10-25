const { pool, sql } = require("../config/dbconfig");

const getAllVehicles = async () => {
  try {
    const request = pool.request();
    const result = await request.query("SELECT * FROM VEHICLE_MASTER ORDER BY vehicle_id DESC");
    return result.recordset;
  } catch (err) {
    console.error("Error in getAllVehicles model:", err);
    throw err;
  }
};

const createVehicle = async (vehicleData) => {
  try {
    const {
      vehicle_number,
      vehicle_type,
      make,
      model,
      year,
      chassis_number,
      engine_number,
      registration_date,
      owner_name,
      owner_contact,
      insurance_expiry_date,
      fitness_expiry_date,
    } = vehicleData;

    const maxRes = await pool.request().query("SELECT COALESCE(MAX(vehicle_id), 0) + 1 AS next_id FROM vehicle_master");
    const nextId = maxRes.recordset[0].next_id;

    const result = await pool.request()
      .input("vehicle_id", sql.Int, nextId)
      .input("vehicle_number", sql.VarChar(50), (vehicle_number || "").toUpperCase().trim())
      .input("vehicle_type", sql.VarChar(50), vehicle_type || "Truck")
      .input("make", sql.VarChar(50), make || null)
      .input("model", sql.VarChar(50), model || null)
      .input("year", sql.Int, year || null)
      .input("chassis_number", sql.VarChar(50), chassis_number || null)
      .input("engine_number", sql.VarChar(50), engine_number || null)
      .input("registration_date", sql.Date, registration_date || null)
      .input("owner_name", sql.VarChar(100), owner_name || null)
      .input("owner_contact", sql.VarChar(20), owner_contact || null)
      .input("insurance_expiry_date", sql.Date, insurance_expiry_date || null)
      .input("fitness_expiry_date", sql.Date, fitness_expiry_date || null)
      .query(`
        INSERT INTO vehicle_master (
          vehicle_id, vehicle_number, vehicle_type, make, model, year,
          chassis_number, engine_number, registration_date, owner_name,
          owner_contact, insurance_expiry_date, fitness_expiry_date
        )
        OUTPUT INSERTED.*
        VALUES (
          @vehicle_id, @vehicle_number, @vehicle_type, @make, @model, @year,
          @chassis_number, @engine_number, @registration_date, @owner_name,
          @owner_contact, @insurance_expiry_date, @fitness_expiry_date
        )
      `);

    return result.recordset[0];
  } catch (err) {
    console.error("Error in createVehicle model:", err);
    throw err;
  }
};

const deleteVehicle = async (id) => {
  try {
    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM vehicle_master WHERE vehicle_id = @id");
    return true;
  } catch (err) {
    console.error("Error in deleteVehicle model:", err);
    throw err;
  }
};

module.exports = {
  getAllVehicles,
  createVehicle,
  deleteVehicle,
};
