const { pool, sql } = require("../config/dbconfig");

class CustomerMasterController {
  static async getAllCustomers(req, res) {
    try {
      const result = await pool
        .request()
        .query("SELECT * FROM Customer_Master ORDER BY CustomerName ASC");
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res
        .status(500)
        .json({ message: "Error fetching customers", error: error.message });
    }
  }

  static async createCustomer(req, res) {
    try {
      const {
        customername,
        customertype,
        contactperson,
        email,
        phone,
        addressline1,
        city,
        state,
        postalcode,
        country,
        isconsigner,
        isconsignee,
      } = req.body;

      if (!customername || customername.trim().length === 0) {
        return res.status(400).json({ success: false, message: "customername is required" });
      }

      const maxRes = await pool.request().query("SELECT COALESCE(MAX(customerid), 0) + 1 AS next_id FROM customer_master");
      const nextId = maxRes.recordset[0].next_id;

      const result = await pool.request()
        .input("customerid", sql.Int, nextId)
        .input("customername", sql.VarChar(100), customername.trim())
        .input("customertype", sql.VarChar(50), customertype || null)
        .input("contactperson", sql.VarChar(100), contactperson || null)
        .input("email", sql.VarChar(100), email || null)
        .input("phone", sql.VarChar(20), phone || null)
        .input("addressline1", sql.VarChar(200), addressline1 || null)
        .input("city", sql.VarChar(50), city || null)
        .input("state", sql.VarChar(50), state || null)
        .input("postalcode", sql.VarChar(20), postalcode || null)
        .input("country", sql.VarChar(50), country || "India")
        .input("isconsigner", sql.Bit, isconsigner !== undefined ? isconsigner : true)
        .input("isconsignee", sql.Bit, isconsignee !== undefined ? isconsignee : true)
        .query(`
          INSERT INTO customer_master (
            customerid, customername, customertype, contactperson, email, phone,
            addressline1, city, state, postalcode, country, isconsigner, isconsignee, createddate
          )
          OUTPUT INSERTED.*
          VALUES (
            @customerid, @customername, @customertype, @contactperson, @email, @phone,
            @addressline1, @city, @state, @postalcode, @country, @isconsigner, @isconsignee, CURRENT_TIMESTAMP
          )
        `);

      res.status(201).json({ success: true, customer: result.recordset[0] });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ success: false, message: "Error creating customer", error: error.message });
    }
  }
}

module.exports = CustomerMasterController;
