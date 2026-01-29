import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbDir = join(__dirname, '../../database');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || join(dbDir, 'app.db');

// Initialize SQL.js
let SQL;
let db;

const initDatabase = async () => {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize schema
  initSchema();

  return db;
};

// Save database to file
const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
};

// Initialize database schema
const initSchema = () => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      tier TEXT NOT NULL CHECK(tier IN ('free', 'premium')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Content table
  db.run(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('video', 'pdf', 'image')),
      tier TEXT NOT NULL CHECK(tier IN ('free', 'premium')),
      s3_key TEXT NOT NULL,
      thumbnail TEXT,
      duration INTEGER,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Access logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content_id INTEGER NOT NULL,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (content_id) REFERENCES content(id)
    )
  `);

  saveDatabase();
  console.log('✅ Database schema initialized');
};

// Wrapper object to match better-sqlite3 API
const dbWrapper = {
  prepare: (sql) => {
    return {
      run: (...params) => {
        try {
          console.log('🔍 SQL:', sql);
          console.log('🔍 Params:', params);

          // sql.js prepared statement approach
          const stmt = db.prepare(sql);
          stmt.bind(params);

          // For INSERT/UPDATE/DELETE, we call step() once to execute
          // It returns false because there are no result rows (this is normal)
          stmt.step();
          stmt.free();

          // Now check if the INSERT actually worked by querying the table
          const checkStmt = db.prepare("SELECT COUNT(*) as count FROM users");
          checkStmt.step();
          const countRow = checkStmt.getAsObject();
          checkStmt.free();

          // Get last insert rowid BEFORE saving (important!)
          let lastId = 0;

          // Try multiple methods to get the ID
          const idStmt1 = db.prepare("SELECT last_insert_rowid() as id");
          idStmt1.step();
          const row1 = idStmt1.getAsObject();
          idStmt1.free();

          // Method 2: Query the max ID from users table
          const idStmt2 = db.prepare("SELECT MAX(id) as id FROM users");
          idStmt2.step();
          const row2 = idStmt2.getAsObject();
          lastId = row2.id !== undefined && row2.id !== null ? Number(row2.id) : 0;
          idStmt2.free();

          saveDatabase();

          return {
            lastInsertRowid: lastId,
            changes: 1
          };
        } catch (error) {
          console.error('SQL Error:', error);
          throw error;
        }
      },
      get: (...params) => {
        try {
          // Use prepared statement for parameterized queries
          const stmt = db.prepare(sql);
          stmt.bind(params);

          const hasRow = stmt.step();
          if (!hasRow) {
            stmt.free();
            return undefined;
          }

          const row = stmt.getAsObject();
          stmt.free();

          return row;
        } catch (error) {
          console.error('SQL Error:', error);
          throw error;
        }
      },
      all: (...params) => {
        try {
          // Use prepared statement for parameterized queries
          const stmt = db.prepare(sql);
          stmt.bind(params);

          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();

          return rows;
        } catch (error) {
          console.error('SQL Error:', error);
          throw error;
        }
      }
    };
  },
  exec: (sql) => {
    try {
      db.exec(sql);
      saveDatabase();
    } catch (error) {
      console.error('SQL Error:', error);
      throw error;
    }
  },
  pragma: (pragma) => {
    // sql.js doesn't support pragmas the same way, just ignore
    console.log(`Pragma ${pragma} - skipped (sql.js)`);
  }
};

// Initialize and export
await initDatabase();

export default dbWrapper;