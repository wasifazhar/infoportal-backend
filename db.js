import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
export async function initDb() {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isAdmin BOOLEAN DEFAULT 0
    )
  `);

  // Create submissions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      fullName TEXT,
      dateOfBirth TEXT,
      gender TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zipCode TEXT,
      country TEXT,
      highestDegree TEXT,
      institution TEXT,
      fieldOfStudy TEXT,
      graduationYear TEXT,
      currentEmployer TEXT,
      jobTitle TEXT,
      yearsOfExperience TEXT,
      skills TEXT,
      bio TEXT,
      linkedIn TEXT,
      website TEXT,
      FOREIGN KEY(username) REFERENCES users(username)
    )
  `);

  // Insert default admin if it doesn't exist
  try {
    await db.run(
      'INSERT OR IGNORE INTO users (name, email, username, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
      ['Administrator', 'admin@infoportal.com', 'admin@20', 'admin123', 1]
    );
  } catch (e) {
    console.error('Error creating admin user:', e);
  }

  return db;
}
