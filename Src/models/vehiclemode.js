const { pool, sql } = require("../config/dbconfig");

const sanitizeVehicle = (v) => {
  if (!v) return v;
  const hasRc = !!(v.rc_doc_data || v.RC_DOC_DATA);
  const hasIns = !!(v.insurance_doc_data || v.INSURANCE_DOC_DATA);
  const hasFit = !!(v.fitness_doc_data || v.FITNESS_DOC_DATA);

  const {
    rc_doc_data, RC_DOC_DATA,
    insurance_doc_data, INSURANCE_DOC_DATA,
    fitness_doc_data, FITNESS_DOC_DATA,
    ...rest
  } = v;

  return {
    ...rest,
    HAS_RC_DOC: hasRc ? "true" : "false",
    has_rc_doc: hasRc ? "true" : "false",
    HAS_INSURANCE_DOC: hasIns ? "true" : "false",
    has_insurance_doc: hasIns ? "true" : "false",
    HAS_FITNESS_DOC: hasFit ? "true" : "false",
    has_fitness_doc: hasFit ? "true" : "false",
  };
};

const getAllVehicles = async () => {
  try {
    const request = pool.request();
    const result = await request.query(`
      SELECT 
        v.*,
        CASE WHEN v.rc_doc_data IS NOT NULL THEN 'true' ELSE 'false' END AS HAS_RC_DOC,
        CASE WHEN v.insurance_doc_data IS NOT NULL THEN 'true' ELSE 'false' END AS HAS_INSURANCE_DOC,
        CASE WHEN v.fitness_doc_data IS NOT NULL THEN 'true' ELSE 'false' END AS HAS_FITNESS_DOC
      FROM VEHICLE_MASTER v
      ORDER BY v.vehicle_id DESC
    `);
    return (result.recordset || []).map(sanitizeVehicle);
  } catch (err) {
    console.error("Error in getAllVehicles model:", err);
    throw err;
  }
};

const getVehicleById = async (id) => {
  try {
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM vehicle_master WHERE vehicle_id = @id");
    return result.recordset[0] ? sanitizeVehicle(result.recordset[0]) : null;
  } catch (err) {
    console.error("Error in getVehicleById model:", err);
    throw err;
  }
};

const getVehicleDocument = async (id, docType) => {
  try {
    const dt = (docType || "").toLowerCase();
    let colData, colName, colType;
    if (dt === "rc" || dt === "rc_doc") {
      colData = "rc_doc_data"; colName = "rc_doc_name"; colType = "rc_doc_type";
    } else if (dt === "insurance" || dt === "insurance_doc") {
      colData = "insurance_doc_data"; colName = "insurance_doc_name"; colType = "insurance_doc_type";
    } else if (dt === "fitness" || dt === "fitness_doc") {
      colData = "fitness_doc_data"; colName = "fitness_doc_name"; colType = "fitness_doc_type";
    } else {
      throw new Error("Invalid vehicle document type. Must be rc, insurance, or fitness.");
    }

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          ${colData} AS data, 
          ${colName} AS name, 
          ${colType} AS type 
        FROM vehicle_master 
        WHERE vehicle_id = @id AND ${colData} IS NOT NULL
      `);

    return result.recordset[0] || null;
  } catch (err) {
    console.error("Error in getVehicleDocument model:", err);
    throw err;
  }
};

const createVehicle = async (vehicleData, files = {}) => {
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

    const rcFile = files.rc_doc ? (Array.isArray(files.rc_doc) ? files.rc_doc[0] : files.rc_doc) : null;
    const insFile = files.insurance_doc ? (Array.isArray(files.insurance_doc) ? files.insurance_doc[0] : files.insurance_doc) : null;
    const fitFile = files.fitness_doc ? (Array.isArray(files.fitness_doc) ? files.fitness_doc[0] : files.fitness_doc) : null;

    const result = await pool.request()
      .input("vehicle_id", sql.Int, nextId)
      .input("vehicle_number", sql.VarChar(50), (vehicle_number || "").toUpperCase().trim())
      .input("vehicle_type", sql.VarChar(50), vehicle_type || "Truck")
      .input("make", sql.VarChar(50), make || null)
      .input("model", sql.VarChar(50), model || null)
      .input("year", sql.Int, year ? parseInt(year) : null)
      .input("chassis_number", sql.VarChar(50), chassis_number || null)
      .input("engine_number", sql.VarChar(50), engine_number || null)
      .input("registration_date", sql.Date, registration_date ? new Date(registration_date) : null)
      .input("owner_name", sql.VarChar(100), owner_name || null)
      .input("owner_contact", sql.VarChar(20), owner_contact || null)
      .input("insurance_expiry_date", sql.Date, insurance_expiry_date ? new Date(insurance_expiry_date) : null)
      .input("fitness_expiry_date", sql.Date, fitness_expiry_date ? new Date(fitness_expiry_date) : null)
      .input("rc_doc_data", sql.VarBinary(sql.MAX), rcFile?.buffer || null)
      .input("rc_doc_name", sql.VarChar(255), rcFile?.originalname || null)
      .input("rc_doc_type", sql.VarChar(100), rcFile?.mimetype || null)
      .input("insurance_doc_data", sql.VarBinary(sql.MAX), insFile?.buffer || null)
      .input("insurance_doc_name", sql.VarChar(255), insFile?.originalname || null)
      .input("insurance_doc_type", sql.VarChar(100), insFile?.mimetype || null)
      .input("fitness_doc_data", sql.VarBinary(sql.MAX), fitFile?.buffer || null)
      .input("fitness_doc_name", sql.VarChar(255), fitFile?.originalname || null)
      .input("fitness_doc_type", sql.VarChar(100), fitFile?.mimetype || null)
      .query(`
        INSERT INTO vehicle_master (
          vehicle_id, vehicle_number, vehicle_type, make, model, year,
          chassis_number, engine_number, registration_date, owner_name,
          owner_contact, insurance_expiry_date, fitness_expiry_date,
          rc_doc_data, rc_doc_name, rc_doc_type,
          insurance_doc_data, insurance_doc_name, insurance_doc_type,
          fitness_doc_data, fitness_doc_name, fitness_doc_type
        )
        OUTPUT INSERTED.*
        VALUES (
          @vehicle_id, @vehicle_number, @vehicle_type, @make, @model, @year,
          @chassis_number, @engine_number, @registration_date, @owner_name,
          @owner_contact, @insurance_expiry_date, @fitness_expiry_date,
          @rc_doc_data, @rc_doc_name, @rc_doc_type,
          @insurance_doc_data, @insurance_doc_name, @insurance_doc_type,
          @fitness_doc_data, @fitness_doc_name, @fitness_doc_type
        )
      `);

    return sanitizeVehicle(result.recordset[0]);
  } catch (err) {
    console.error("Error in createVehicle model:", err);
    throw err;
  }
};

const updateVehicle = async (id, vehicleData, files = {}) => {
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

    const req = pool.request()
      .input("id", sql.Int, id)
      .input("vehicle_number", sql.VarChar(50), (vehicle_number || "").toUpperCase().trim())
      .input("vehicle_type", sql.VarChar(50), vehicle_type || "Truck")
      .input("make", sql.VarChar(50), make || null)
      .input("model", sql.VarChar(50), model || null)
      .input("year", sql.Int, year ? parseInt(year) : null)
      .input("chassis_number", sql.VarChar(50), chassis_number || null)
      .input("engine_number", sql.VarChar(50), engine_number || null)
      .input("registration_date", sql.Date, registration_date ? new Date(registration_date) : null)
      .input("owner_name", sql.VarChar(100), owner_name || null)
      .input("owner_contact", sql.VarChar(20), owner_contact || null)
      .input("insurance_expiry_date", sql.Date, insurance_expiry_date ? new Date(insurance_expiry_date) : null)
      .input("fitness_expiry_date", sql.Date, fitness_expiry_date ? new Date(fitness_expiry_date) : null);

    let query = `
      UPDATE vehicle_master SET
        vehicle_number = @vehicle_number,
        vehicle_type = @vehicle_type,
        make = @make,
        model = @model,
        year = @year,
        chassis_number = @chassis_number,
        engine_number = @engine_number,
        registration_date = @registration_date,
        owner_name = @owner_name,
        owner_contact = @owner_contact,
        insurance_expiry_date = @insurance_expiry_date,
        fitness_expiry_date = @fitness_expiry_date,
        updated_at = NOW()
    `;

    const rcFile = files.rc_doc ? (Array.isArray(files.rc_doc) ? files.rc_doc[0] : files.rc_doc) : null;
    const insFile = files.insurance_doc ? (Array.isArray(files.insurance_doc) ? files.insurance_doc[0] : files.insurance_doc) : null;
    const fitFile = files.fitness_doc ? (Array.isArray(files.fitness_doc) ? files.fitness_doc[0] : files.fitness_doc) : null;

    if (rcFile) {
      req.input("rc_doc_data", sql.VarBinary(sql.MAX), rcFile.buffer)
         .input("rc_doc_name", sql.VarChar(255), rcFile.originalname)
         .input("rc_doc_type", sql.VarChar(100), rcFile.mimetype);
      query += `, rc_doc_data = @rc_doc_data, rc_doc_name = @rc_doc_name, rc_doc_type = @rc_doc_type`;
    }

    if (insFile) {
      req.input("insurance_doc_data", sql.VarBinary(sql.MAX), insFile.buffer)
         .input("insurance_doc_name", sql.VarChar(255), insFile.originalname)
         .input("insurance_doc_type", sql.VarChar(100), insFile.mimetype);
      query += `, insurance_doc_data = @insurance_doc_data, insurance_doc_name = @insurance_doc_name, insurance_doc_type = @insurance_doc_type`;
    }

    if (fitFile) {
      req.input("fitness_doc_data", sql.VarBinary(sql.MAX), fitFile.buffer)
         .input("fitness_doc_name", sql.VarChar(255), fitFile.originalname)
         .input("fitness_doc_type", sql.VarChar(100), fitFile.mimetype);
      query += `, fitness_doc_data = @fitness_doc_data, fitness_doc_name = @fitness_doc_name, fitness_doc_type = @fitness_doc_type`;
    }

    query += ` WHERE vehicle_id = @id`;
    await req.query(query);

    return { success: true };
  } catch (err) {
    console.error("Error in updateVehicle model:", err);
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
  getVehicleById,
  getVehicleDocument,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
