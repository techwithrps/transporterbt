const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Smart configuration resolver ensuring 100% cloud / Render / Supabase compatibility
function resolveDbConfig() {
  let host = process.env.PGHOST || "aws-0-ap-southeast-1.pooler.supabase.com";
  let port = parseInt(process.env.PGPORT || "6543", 10);
  let user = process.env.PGUSER || "postgres.lufumteuhgpnzzwlesox";
  let password = process.env.PGPASSWORD || "Transporter#2026!Secure";
  let database = process.env.PGDATABASE || "postgres";

  // Auto-rectify IPv6 host for platforms without IPv6 support (like Render)
  if (!process.env.PGHOST || host.includes("db.lufumteuhgpnzzwlesox.supabase.co")) {
    host = "aws-0-ap-southeast-1.pooler.supabase.com";
    port = 6543;
  }

  // Auto-rectify user on Supabase pooler (requires tenant suffix)
  if (host.includes("pooler.supabase.com") && (!user || user === "postgres")) {
    user = "postgres.lufumteuhgpnzzwlesox";
  }

  // Handle password truncation if # was treated as comment in env parsers
  if (!password || password === "Transporter") {
    password = "Transporter#2026!Secure";
  }

  return { host, port, user, password, database };
}

const dbConfig = resolveDbConfig();
const pgPool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
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

  // 3. Handle ISNULL -> COALESCE
  query = query.replace(/ISNULL\s*\(/gi, "COALESCE(");

  // 4. Handle GETDATE() -> CURRENT_TIMESTAMP
  query = query.replace(/GETDATE\s*\(\s*\)/gi, "CURRENT_TIMESTAMP");

  // 5. Handle CONVERT functions
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

  // 6. Map @params in order of appearance
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
  constructor(executor = pgPool) {
    this.executor = executor;
    this.inputs = {};
  }

  input(name, type, value) {
    if (arguments.length === 2) {
      value = type;
    } else if (value === undefined) {
      value = null;
    }
    this.inputs[name] = value;
    return this;
  }

  async query(sqlText) {
    const { query, values } = transformQuery(sqlText, this.inputs);
    try {
      const res = await this.executor.query(query, values);
      const mappedRows = (res.rows || []).map((row) => {
        if (!row || typeof row !== "object") return row;
        const dual = { ...row };
        for (const [key, val] of Object.entries(row)) {
          dual[key.toUpperCase()] = val;
          dual[key.toLowerCase()] = val;
        }
        return dual;
      });
      return {
        recordset: mappedRows,
        recordsets: [mappedRows],
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

// Transaction class emulating mssql Transaction
class MssqlTransactionShim {
  constructor(pool) {
    this.pool = pool;
    this.client = null;
  }

  async begin() {
    this.client = await pgPool.connect();
    await this.client.query("BEGIN");
    return this;
  }

  request() {
    return new MssqlRequestShim(this.client || pgPool);
  }

  async commit() {
    if (this.client) {
      await this.client.query("COMMIT");
      this.client.release();
      this.client = null;
    }
  }

  async rollback() {
    if (this.client) {
      try {
        await this.client.query("ROLLBACK");
      } catch (e) {}
      this.client.release();
      this.client = null;
    }
  }
}

// Pool wrapper
const pool = {
  request() {
    return new MssqlRequestShim(pgPool);
  },
  transaction() {
    return new MssqlTransactionShim(this);
  },
  async connect() {
    return this;
  },
  on(event, handler) {
    pgPool.on(event, handler);
    return this;
  },
};

// SQL Data Type Shims - dynamic Proxy so ANY type or call works
const createType = (...args) => createType;
createType.toString = () => "type";
const sql = new Proxy(
  {
    MAX: -1,
    ConnectionPool: class {
      constructor() {
        return pool;
      }
    },
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      return createType;
    },
  }
);

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
