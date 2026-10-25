const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../running-backendelogisol-main/.env") });

async function run() {
  const config = {
    host: process.env.PGHOST || "db.lufumteuhgpnzzwlesox.supabase.co",
    port: parseInt(process.env.PGPORT || "5432", 10),
    database: process.env.PGDATABASE || "postgres",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "Transporter#2026!Secure",
    ssl: { rejectUnauthorized: false }
  };

  console.log(`Connecting to Supabase PostgreSQL at ${config.host}:${config.port}...`);
  const client = new Client(config);

  try {
    await client.connect();
    console.log("✅ Successfully connected to Supabase PostgreSQL database!");

    const sqlPath = path.join(__dirname, "schema.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");
    console.log(`Executing schema.sql (${sqlContent.length} bytes)...`);

    await client.query(sqlContent);
    console.log("✅ All tables, functions, and initial seeds created successfully!");

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`\nVerified ${res.rows.length} public tables created:`);
    console.log(res.rows.map(r => r.table_name).join(", "));

    // Verify seeded users
    const usersRes = await client.query("SELECT id, name, email, role FROM users;");
    console.log("\nVerified seeded users in users table:");
    console.table(usersRes.rows);

    const users2Res = await client.query("SELECT id, username, role FROM users2;");
    console.log("\nVerified seeded users in users2 table:");
    console.table(users2Res.rows);

  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
