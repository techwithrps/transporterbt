const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const pgPool = new Pool({
  host: process.env.PGHOST || "db.lufumteuhgpnzzwlesox.supabase.co",
  port: parseInt(process.env.PGPORT || "5432", 10),
  database: process.env.PGDATABASE || "postgres",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "Transporter#2026!Secure",
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pgPool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

// Query Transformer for MSSQL -> PostgreSQL syntax compatibility
function transformQuery(sqlText, inputs = {}) {
  let query = sqlText;

  // 1. Handle TOP N: SELECT TOP (\d+) ... -> SELECT ... LIMIT N
  if (/SELECT\s+TOP\s+(\d+)/i.test(sqlText)) {
    const match = sqlText.match(/SELECT\s+TOP\s+(\d+)/i);
    const n = match[1];
    query = query.replace(/SELECT\s+TOP\s+\d+\s+/gi, "SELECT ");
    if (!/LIMIT\s+\d+/i.test(query)) {
      query = query.trim().replace(/;?$/, "") + " LIMIT " + n;
    }
  }

  // 2. Handle OUTPUT INSERTED.* -> RETURNING *
  const outputMatch = query.match(
    /OUTPUT\s+INSERTED\.([\w\*,\s\.INSERTED]+?)(?=\s+VALUES|\s+SELECT|\s*$)/i
  );
  if (outputMatch) {
    const cols = outputMatch[1].replace(/INSERTED\./gi, "").trim();
    query = query.replace(outputMatch[0], "");
    query = query.trim().replace(/;?$/, "") + " RETURNING " + cols;
  }

  const outputDeletedMatch = query.match(
    /OUTPUT\s+DELETED\.([\w\*,\s\.DELETED]+?)(?=\s+WHERE|\s*$)/i
  );
  if (outputDeletedMatch) {
    const cols = outputDeletedMatch[1].replace(/DELETED\./gi, "").trim();
    query = query.replace(outputDeletedMatch[0], "");
    query = query.trim().replace(/;?$/, "") + " RETURNING " + cols;
  }

  // 3. Handle CONVERT functions
  query = query
    .replace(
      /CONVERT\s*\(\s*varchar\s*,\s*([^,)]+)\s*,\s*120\s*\)/gi,
      "to_char($1, 'YYYY-MM-DD HH24:MI:SS')"
    )
    .replace(
      /CONVERT\s*\(\s*varchar\s*,\s*([^,)]+)\s*,\s*23\s*\)/gi,
      "to_char($1, 'YYYY-MM-DD')"
    )
    .replace(
      /CONVERT\s*\(\s*varchar\s*,\s*([^,)]+)\s*,\s*108\s*\)/gi,
      "to_char($1, 'HH24:MI:SS')"
    )
    .replace(/CONVERT\s*\(\s*date\s*,\s*([^)]+)\s*\)/gi, "($1)::date")
    .replace(/CONVERT\s*\(\s*DATE\s*,\s*([^)]+)\s*\)/gi, "($1)::date");

  // 4. Map @params in order of appearance
  let paramCount = 0;
  const paramMap = {};
  const values = [];

  query = query.replace(/@([a-zA-Z0-9_]+)\b/g, (match, paramName) => {
    const matchedKey = Object.keys(inputs).find(
      (k) => k.toLowerCase() === paramName.toLowerCase()
    );
    if (matchedKey !== undefined) {
      if (!paramMap[matchedKey]) {
        paramCount++;
        paramMap[matchedKey] = paramCount;
        values.push(inputs[matchedKey]);
      }
      return "$" + paramMap[matchedKey];
    }
    return match;
  });

  return { query, values };
}

// Request class emulating mssql Request
class MssqlRequestShim {
  constructor() {
    this.inputs = {};
  }

  input(name, type, value) {
    if (value === undefined) {
      value = type;
    }
    this.inputs[name] = value;
    return this;
  }

  async query(sqlText) {
    const { query, values } = transformQuery(sqlText, this.inputs);
    try {
      const res = await pgPool.query(query, values);
      return {
        recordset: res.rows,
        recordsets: [res.rows],
        rowsAffected: [res.rowCount || 0],
      };
    } catch (err) {
      console.error("Database query error:", err.message);
      console.error("Failed query:", query);
      console.error("Values:", values);
      throw err;
    }
  }
}

// Pool wrapper
const pool = {
  request() {
    return new MssqlRequestShim();
  },
  async connect() {
    return this;
  },
  on(event, handler) {
    pgPool.on(event, handler);
    return this;
  },
};

// SQL Data Type Shims
const createType = () => ({});
const sql = {
  VarChar: createType,
  NVarChar: createType,
  Text: createType,
  Int: createType,
  BigInt: createType,
  SmallInt: createType,
  TinyInt: createType,
  Bit: createType,
  Decimal: createType,
  Float: createType,
  Real: createType,
  Date: createType,
  Time: createType,
  DateTime: createType,
  DateTime2: createType,
  MAX: -1,
  ConnectionPool: class {
    constructor() {
      return pool;
    }
  },
};

const connectDB = async () => {
  try {
    const client = await pgPool.connect();
    console.log("✅ Connected to Supabase PostgreSQL Database");
    const testRes = await client.query("SELECT 1 as connected");
    client.release();
    if (testRes.rows && testRes.rows.length > 0) {
      console.log("Database connection & query test successful");
    }
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  sql,
  pgPool,
  connectDB,
  poolConnect: Promise.resolve(),
};
