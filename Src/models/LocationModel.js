const { pool, sql } = require("../config/dbconfig");

// Fetch all locations
const getAllLocations = async () => {
  try {
    const result = await pool.request().query("SELECT * FROM LOCATION_MASTER ORDER BY LOCATION_NAME ASC");
    return result.recordset.map(loc => ({
      ...loc,
      LOCATION_NAME: loc.LOCATION_NAME || loc.location_name,
      LOCATION_ID: loc.LOCATION_ID || loc.location_id,
      location_name: loc.location_name || loc.LOCATION_NAME,
      location_id: loc.location_id || loc.LOCATION_ID
    }));
  } catch (error) {
    throw new Error("Error fetching locations: " + error.message);
  }
};

// Create a new location
const createLocation = async (locationData) => {
  try {
    const { location_name, terminal_id, distance, toll } = locationData;
    const maxRes = await pool.request().query("SELECT COALESCE(MAX(location_id), 0) + 1 AS next_id FROM location_master");
    const nextId = maxRes.recordset[0].next_id;

    const result = await pool.request()
      .input("location_id", sql.Int, nextId)
      .input("location_name", sql.VarChar(100), (location_name || "").toUpperCase().trim())
      .input("terminal_id", sql.Int, terminal_id || null)
      .input("distance", sql.Decimal(10, 2), distance || null)
      .input("toll", sql.Decimal(10, 2), toll || null)
      .query(`
        INSERT INTO location_master (location_id, location_name, terminal_id, distance, toll)
        OUTPUT INSERTED.*
        VALUES (@location_id, @location_name, @terminal_id, @distance, @toll)
      `);

    return result.recordset[0];
  } catch (error) {
    throw new Error("Error creating location: " + error.message);
  }
};

module.exports = {
  getAllLocations,
  createLocation,
};
