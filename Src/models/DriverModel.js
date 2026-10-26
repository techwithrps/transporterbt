const { pool, sql } = require("../config/dbconfig");

const sanitizeDriver = (d) => {
  if (!d) return d;
  const hasDl = !!(d.dl_doc_data || d.DL_DOC_DATA);
  const hasAddr = !!(d.address_doc_data || d.ADDRESS_DOC_DATA);
  const hasImg = !!(d.image_data || d.IMAGE_DATA);

  // Remove binary buffers to keep JSON payload lightweight
  const {
    dl_doc_data, DL_DOC_DATA,
    address_doc_data, ADDRESS_DOC_DATA,
    image_data, IMAGE_DATA,
    ...rest
  } = d;

  return {
    ...rest,
    HAS_DL_DOC: hasDl ? "true" : "false",
    has_dl_doc: hasDl ? "true" : "false",
    HAS_ADDRESS_DOC: hasAddr ? "true" : "false",
    has_address_doc: hasAddr ? "true" : "false",
    HAS_IMAGE: hasImg ? "true" : "false",
    has_image: hasImg ? "true" : "false",
  };
};

class DriverModel {
  // Get all drivers with vendor information
  static async getAll() {
    try {
      const result = await pool.request().query(`
        SELECT 
          d.*,
          v.VENDOR_NAME,
          v.VENDOR_CODE
        FROM DRIVER_MASTER d
        LEFT JOIN VENDOR_MASTER v ON d.VENDOR_ID = v.VENDOR_ID
        UNION ALL
        SELECT 
          -(ROW_NUMBER() OVER (ORDER BY t.driver_name)) AS DRIVER_ID,
          NULL AS VENDOR_ID,
          NULL AS TERMINAL_ID,
          t.driver_name AS DRIVER_NAME,
          NULL AS ADDRESS,
          NULL AS VEHICLE_ID,
          MAX(t.vehicle_number) AS VEHICLE_NO,
          MAX(t.driver_contact) AS CONTACT_NO,
          MAX(t.driver_contact) AS MOBILE_NO,
          NULL AS EMAIL_ID,
          NULL AS BLOOD_GROUP,
          NULL AS JOINING_DATE,
          MAX(t.license_number) AS DL_NO,
          NULL AS DL_RENEWABLE_DATE,
          NULL AS SALARY,
          'Y' AS ACTIVE_FLAGE,
          NULL AS CREATED_BY,
          NULL AS CREATED_ON,
          NULL AS IMAGE,
          NULL AS BAL_AMT,
          NULL AS TRIP_BAL,
          NULL AS CLOSE_STATUS,
          NULL AS JO_CLOSE_STATUS,
          NULL AS GAURANTOR,
          NULL AS DRIVER_CODE,
          NULL AS FATHER_NAME,
          NULL AS ATTACH_STATUS,
          NULL AS DL_DOC,
          NULL AS ADDRESS_DOC,
          NULL AS EMERG_PHONE,
          NULL AS PHONE_NO,
          NULL AS dl_doc_data,
          NULL AS dl_doc_name,
          NULL AS dl_doc_type,
          NULL AS address_doc_data,
          NULL AS address_doc_name,
          NULL AS address_doc_type,
          NULL AS image_data,
          NULL AS image_name,
          NULL AS image_type,
          MAX(t.transporter_name) AS VENDOR_NAME,
          'HISTORIC' AS VENDOR_CODE
        FROM transporter_details t
        WHERE t.driver_name IS NOT NULL AND LTRIM(RTRIM(t.driver_name)) != '' AND NOT EXISTS (
            SELECT 1 FROM DRIVER_MASTER dm WHERE UPPER(LTRIM(RTRIM(dm.DRIVER_NAME))) = UPPER(LTRIM(RTRIM(t.driver_name)))
          )
        GROUP BY t.driver_name
        ORDER BY DRIVER_NAME
      `);
      return (result.recordset || []).map(sanitizeDriver);
    } catch (error) {
      console.error("Get all drivers error:", error);
      throw error;
    }
  }

  // Get driver by ID with vendor information
  static async getById(driverId) {
    try {
      const result = await pool
        .request()
        .input("driver_id", sql.Numeric(18, 0), driverId)
        .query(`
          SELECT 
            d.*,
            v.VENDOR_NAME,
            v.VENDOR_CODE
          FROM DRIVER_MASTER d
          LEFT JOIN VENDOR_MASTER v ON d.VENDOR_ID = v.VENDOR_ID
          WHERE d.DRIVER_ID = @driver_id
        `);

      return result.recordset[0] ? sanitizeDriver(result.recordset[0]) : null;
    } catch (error) {
      console.error("Get driver by ID error:", error);
      throw error;
    }
  }

  // Get driver document binary stream
  static async getDriverDocument(driverId, docType) {
    try {
      const dt = (docType || "").toLowerCase();
      let colData, colName, colType;
      if (dt === "dl" || dt === "dl_doc") {
        colData = "dl_doc_data"; colName = "dl_doc_name"; colType = "dl_doc_type";
      } else if (dt === "address" || dt === "address_doc") {
        colData = "address_doc_data"; colName = "address_doc_name"; colType = "address_doc_type";
      } else if (dt === "image" || dt === "photo") {
        colData = "image_data"; colName = "image_name"; colType = "image_type";
      } else {
        throw new Error("Invalid document type. Must be dl, address, or image.");
      }

      const result = await pool
        .request()
        .input("driver_id", sql.Numeric(18, 0), driverId)
        .query(`
          SELECT 
            ${colData} AS data, 
            ${colName} AS name, 
            ${colType} AS type 
          FROM DRIVER_MASTER 
          WHERE DRIVER_ID = @driver_id AND ${colData} IS NOT NULL
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error("Get driver document error:", error);
      throw error;
    }
  }

  // Get next driver ID (since DRIVER_ID is not auto-increment)
  static async getNextDriverId() {
    try {
      const result = await pool.request().query(`
        SELECT ISNULL(MAX(DRIVER_ID), 0) + 1 AS next_id FROM DRIVER_MASTER
      `);
      return result.recordset[0].next_id;
    } catch (error) {
      console.error("Get next driver ID error:", error);
      throw error;
    }
  }

  // Create new driver
  static async create(data, files = {}) {
    try {
      const {
        vendor_id,
        terminal_id,
        driver_name,
        address,
        vehicle_id,
        vehicle_no,
        contact_no,
        mobile_no,
        email_id,
        blood_group,
        joining_date,
        dl_no,
        dl_renewable_date,
        salary,
        active_flage,
        created_by,
        image,
        bal_amt,
        trip_bal,
        close_status,
        jo_close_status,
        gaurantor,
        driver_code,
        father_name,
        attach_status,
        dl_doc,
        address_doc,
        emerg_phone,
        phone_no
      } = data;

      if (!vendor_id) {
        throw new Error("Vendor ID is required");
      }
      if (!driver_name) {
        throw new Error("Driver name is required");
      }

      const nextDriverId = await this.getNextDriverId();

      const dlFile = files.dl_doc ? (Array.isArray(files.dl_doc) ? files.dl_doc[0] : files.dl_doc) : null;
      const addrFile = files.address_doc ? (Array.isArray(files.address_doc) ? files.address_doc[0] : files.address_doc) : null;
      const imgFile = files.image ? (Array.isArray(files.image) ? files.image[0] : files.image) : null;

      await pool
        .request()
        .input("driver_id", sql.Numeric(18, 0), nextDriverId)
        .input("vendor_id", sql.Numeric(10, 0), vendor_id)
        .input("terminal_id", sql.Numeric(18, 0), terminal_id || null)
        .input("driver_name", sql.VarChar(100), driver_name)
        .input("address", sql.VarChar(300), address || null)
        .input("vehicle_id", sql.Numeric(18, 0), vehicle_id || null)
        .input("vehicle_no", sql.VarChar(20), vehicle_no || null)
        .input("contact_no", sql.VarChar(50), contact_no || null)
        .input("mobile_no", sql.VarChar(50), mobile_no || null)
        .input("email_id", sql.VarChar(300), email_id || null)
        .input("blood_group", sql.VarChar(300), blood_group || null)
        .input("joining_date", sql.Date, joining_date ? new Date(joining_date) : null)
        .input("dl_no", sql.VarChar(50), dl_no || null)
        .input("dl_renewable_date", sql.Date, dl_renewable_date ? new Date(dl_renewable_date) : null)
        .input("salary", sql.Numeric(18, 2), salary || null)
        .input("active_flage", sql.Char(1), active_flage || "Y")
        .input("created_by", sql.VarChar(30), created_by || "SYSTEM")
        .input("created_on", sql.DateTime, new Date())
        .input("image", sql.VarChar(200), imgFile ? imgFile.originalname : (image || null))
        .input("bal_amt", sql.VarChar(10), bal_amt || null)
        .input("trip_bal", sql.Numeric(18, 2), trip_bal || null)
        .input("close_status", sql.Int, close_status || null)
        .input("jo_close_status", sql.VarChar(10), jo_close_status || null)
        .input("gaurantor", sql.VarChar(100), gaurantor || null)
        .input("driver_code", sql.VarChar(10), driver_code || null)
        .input("father_name", sql.VarChar(100), father_name || null)
        .input("attach_status", sql.VarChar(10), attach_status || null)
        .input("dl_doc", sql.VarChar(300), dlFile ? dlFile.originalname : (dl_doc || null))
        .input("address_doc", sql.VarChar(300), addrFile ? addrFile.originalname : (address_doc || null))
        .input("emerg_phone", sql.VarChar(20), emerg_phone || null)
        .input("phone_no", sql.VarChar(20), phone_no || null)
        .input("dl_doc_data", sql.VarBinary(sql.MAX), dlFile?.buffer || null)
        .input("dl_doc_name", sql.VarChar(255), dlFile?.originalname || null)
        .input("dl_doc_type", sql.VarChar(100), dlFile?.mimetype || null)
        .input("address_doc_data", sql.VarBinary(sql.MAX), addrFile?.buffer || null)
        .input("address_doc_name", sql.VarChar(255), addrFile?.originalname || null)
        .input("address_doc_type", sql.VarChar(100), addrFile?.mimetype || null)
        .input("image_data", sql.VarBinary(sql.MAX), imgFile?.buffer || null)
        .input("image_name", sql.VarChar(255), imgFile?.originalname || null)
        .input("image_type", sql.VarChar(100), imgFile?.mimetype || null)
        .query(`
          INSERT INTO DRIVER_MASTER (
            DRIVER_ID, VENDOR_ID, TERMINAL_ID, DRIVER_NAME, ADDRESS, VEHICLE_ID, VEHICLE_NO, 
            CONTACT_NO, MOBILE_NO, EMAIL_ID, BLOOD_GROUP, JOINING_DATE, 
            DL_NO, DL_RENEWABLE_DATE, SALARY, ACTIVE_FLAGE, CREATED_BY, 
            CREATED_ON, IMAGE, BAL_AMT, TRIP_BAL, CLOSE_STATUS, 
            JO_CLOSE_STATUS, GAURANTOR, DRIVER_CODE, FATHER_NAME, 
            ATTACH_STATUS, DL_DOC, ADDRESS_DOC, EMERG_PHONE, PHONE_NO,
            dl_doc_data, dl_doc_name, dl_doc_type,
            address_doc_data, address_doc_name, address_doc_type,
            image_data, image_name, image_type
          ) 
          VALUES (
            @driver_id, @vendor_id, @terminal_id, @driver_name, @address, @vehicle_id, @vehicle_no, 
            @contact_no, @mobile_no, @email_id, @blood_group, @joining_date, 
            @dl_no, @dl_renewable_date, @salary, @active_flage, @created_by, 
            @created_on, @image, @bal_amt, @trip_bal, @close_status, 
            @jo_close_status, @gaurantor, @driver_code, @father_name, 
            @attach_status, @dl_doc, @address_doc, @emerg_phone, @phone_no,
            @dl_doc_data, @dl_doc_name, @dl_doc_type,
            @address_doc_data, @address_doc_name, @address_doc_type,
            @image_data, @image_name, @image_type
          )
        `);

      return { success: true, driver_id: nextDriverId };
    } catch (error) {
      console.error("Create driver error:", error);
      throw error;
    }
  }

  // Update driver
  static async update(driverId, data, files = {}) {
    try {
      const {
        vendor_id,
        terminal_id,
        driver_name,
        address,
        vehicle_id,
        vehicle_no,
        contact_no,
        mobile_no,
        email_id,
        blood_group,
        joining_date,
        dl_no,
        dl_renewable_date,
        salary,
        active_flage,
        image,
        bal_amt,
        trip_bal,
        close_status,
        jo_close_status,
        gaurantor,
        driver_code,
        father_name,
        attach_status,
        dl_doc,
        address_doc,
        emerg_phone,
        phone_no
      } = data;

      if (!driver_name) {
        throw new Error("Driver name is required");
      }

      const req = pool
        .request()
        .input("driver_id", sql.Numeric(18, 0), driverId)
        .input("vendor_id", sql.Numeric(10, 0), vendor_id)
        .input("terminal_id", sql.Numeric(18, 0), terminal_id || null)
        .input("driver_name", sql.VarChar(100), driver_name)
        .input("address", sql.VarChar(300), address || null)
        .input("vehicle_id", sql.Numeric(18, 0), vehicle_id || null)
        .input("vehicle_no", sql.VarChar(20), vehicle_no || null)
        .input("contact_no", sql.VarChar(50), contact_no || null)
        .input("mobile_no", sql.VarChar(50), mobile_no || null)
        .input("email_id", sql.VarChar(300), email_id || null)
        .input("blood_group", sql.VarChar(300), blood_group || null)
        .input("joining_date", sql.Date, joining_date ? new Date(joining_date) : null)
        .input("dl_no", sql.VarChar(50), dl_no || null)
        .input("dl_renewable_date", sql.Date, dl_renewable_date ? new Date(dl_renewable_date) : null)
        .input("salary", sql.Numeric(18, 2), salary || null)
        .input("active_flage", sql.Char(1), active_flage || "Y")
        .input("bal_amt", sql.VarChar(10), bal_amt || null)
        .input("trip_bal", sql.Numeric(18, 2), trip_bal || null)
        .input("close_status", sql.Int, close_status || null)
        .input("jo_close_status", sql.VarChar(10), jo_close_status || null)
        .input("gaurantor", sql.VarChar(100), gaurantor || null)
        .input("driver_code", sql.VarChar(10), driver_code || null)
        .input("father_name", sql.VarChar(100), father_name || null)
        .input("attach_status", sql.VarChar(10), attach_status || null)
        .input("emerg_phone", sql.VarChar(20), emerg_phone || null)
        .input("phone_no", sql.VarChar(20), phone_no || null);

      let query = `
        UPDATE DRIVER_MASTER SET
          VENDOR_ID = @vendor_id,
          TERMINAL_ID = @terminal_id,
          DRIVER_NAME = @driver_name,
          ADDRESS = @address,
          VEHICLE_ID = @vehicle_id,
          VEHICLE_NO = @vehicle_no,
          CONTACT_NO = @contact_no,
          MOBILE_NO = @mobile_no,
          EMAIL_ID = @email_id,
          BLOOD_GROUP = @blood_group,
          JOINING_DATE = @joining_date,
          DL_NO = @dl_no,
          DL_RENEWABLE_DATE = @dl_renewable_date,
          SALARY = @salary,
          ACTIVE_FLAGE = @active_flage,
          BAL_AMT = @bal_amt,
          TRIP_BAL = @trip_bal,
          CLOSE_STATUS = @close_status,
          JO_CLOSE_STATUS = @jo_close_status,
          GAURANTOR = @gaurantor,
          DRIVER_CODE = @driver_code,
          FATHER_NAME = @father_name,
          ATTACH_STATUS = @attach_status,
          EMERG_PHONE = @emerg_phone,
          PHONE_NO = @phone_no
      `;

      const dlFile = files.dl_doc ? (Array.isArray(files.dl_doc) ? files.dl_doc[0] : files.dl_doc) : null;
      const addrFile = files.address_doc ? (Array.isArray(files.address_doc) ? files.address_doc[0] : files.address_doc) : null;
      const imgFile = files.image ? (Array.isArray(files.image) ? files.image[0] : files.image) : null;

      if (dlFile) {
        req.input("dl_doc", sql.VarChar(300), dlFile.originalname)
           .input("dl_doc_data", sql.VarBinary(sql.MAX), dlFile.buffer)
           .input("dl_doc_name", sql.VarChar(255), dlFile.originalname)
           .input("dl_doc_type", sql.VarChar(100), dlFile.mimetype);
        query += `, DL_DOC = @dl_doc, dl_doc_data = @dl_doc_data, dl_doc_name = @dl_doc_name, dl_doc_type = @dl_doc_type`;
      } else if (dl_doc !== undefined) {
        req.input("dl_doc", sql.VarChar(300), dl_doc || null);
        query += `, DL_DOC = @dl_doc`;
      }

      if (addrFile) {
        req.input("address_doc", sql.VarChar(300), addrFile.originalname)
           .input("address_doc_data", sql.VarBinary(sql.MAX), addrFile.buffer)
           .input("address_doc_name", sql.VarChar(255), addrFile.originalname)
           .input("address_doc_type", sql.VarChar(100), addrFile.mimetype);
        query += `, ADDRESS_DOC = @address_doc, address_doc_data = @address_doc_data, address_doc_name = @address_doc_name, address_doc_type = @address_doc_type`;
      } else if (address_doc !== undefined) {
        req.input("address_doc", sql.VarChar(300), address_doc || null);
        query += `, ADDRESS_DOC = @address_doc`;
      }

      if (imgFile) {
        req.input("image", sql.VarChar(200), imgFile.originalname)
           .input("image_data", sql.VarBinary(sql.MAX), imgFile.buffer)
           .input("image_name", sql.VarChar(255), imgFile.originalname)
           .input("image_type", sql.VarChar(100), imgFile.mimetype);
        query += `, IMAGE = @image, image_data = @image_data, image_name = @image_name, image_type = @image_type`;
      } else if (image !== undefined) {
        req.input("image", sql.VarChar(200), image || null);
        query += `, IMAGE = @image`;
      }

      query += ` WHERE DRIVER_ID = @driver_id`;
      await req.query(query);

      return { success: true };
    } catch (error) {
      console.error("Update driver error:", error);
      throw error;
    }
  }

  // Delete driver
  static async delete(driverId) {
    try {
      await pool
        .request()
        .input("driver_id", sql.Numeric(18, 0), driverId)
        .query(`
          DELETE FROM DRIVER_MASTER WHERE DRIVER_ID = @driver_id
        `);

      return { success: true };
    } catch (error) {
      console.error("Delete driver error:", error);
      throw error;
    }
  }

  // Get drivers by vendor ID
  static async getByVendorId(vendorId) {
    try {
      let drivers = [];
      if (vendorId && Number(vendorId) > 0) {
        const result = await pool
          .request()
          .input("vendor_id", sql.Numeric(10, 0), vendorId)
          .query(`
            SELECT 
              d.*,
              v.VENDOR_NAME,
              v.VENDOR_CODE
            FROM DRIVER_MASTER d
            LEFT JOIN VENDOR_MASTER v ON d.VENDOR_ID = v.VENDOR_ID
            WHERE d.VENDOR_ID = @vendor_id
            ORDER BY d.DRIVER_NAME
          `);
        drivers = (result.recordset || []).map(sanitizeDriver);
      }

      if (drivers.length === 0) {
        return await this.getAll();
      }

      return drivers;
    } catch (error) {
      console.error("Get drivers by vendor ID error:", error);
      throw error;
    }
  }

  // Get available vendors for dropdown
  static async getVendors() {
    try {
      const result = await pool.request().query(`
        SELECT VENDOR_ID, VENDOR_NAME, VENDOR_CODE
        FROM VENDOR_MASTER
        WHERE ACTIVE_FLAG = "Y" OR ACTIVE_FLAG IS NULL
        ORDER BY VENDOR_NAME
      `);
      return result.recordset;
    } catch (error) {
      console.error("Get vendors error:", error);
      throw error;
    }
  }
}

module.exports = DriverModel;
