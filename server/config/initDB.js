const pool = require('./db');

const createUsersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone_no VARCHAR(15),
        firstname VARCHAR(50),
        lastname VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Users table is created.");
  } catch (error) {
    console.error("❌ Error creating users table:", error);
  }
};


const createFoldersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
        deleted BOOLEAN DEFAULT FALSE,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Folders table is created.");
  } catch (error) {
    console.error("❌ Error creating folders table:", error);
  }
};


const createFilesTable = async() =>{
  try{
    await pool.query(`
  CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    size INTEGER,
    url TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

  )
`);
console.log("✅ Files table is created.");
  }catch(error){
    console.error("❌ Error creating files table:", error);
  }
};


const createsharedFolders = async()=>{
  try {
    await pool.query(`
  CREATE TABLE IF NOT EXISTS shared_folder_tokens (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    shared_by_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer',
    token UUID NOT NULL UNIQUE,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(folder_id, email)
  );
`);
console.log("shared folder table  created.");
  } catch (error) {
    console.error("Error creating shared folders table",error);
  }

};

const createSharedFilesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared_files (
        id SERIAL PRIMARY KEY,
        file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
        shared_with_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        shared_by_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(10) DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
        token TEXT UNIQUE,
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_file_user_share'
        ) THEN
          ALTER TABLE shared_files
          ADD CONSTRAINT unique_file_user_share UNIQUE (file_id, shared_with_user_id);
        END IF;
      END$$;
    `);

    console.log("✅ shared_files table created.");
  } catch (error) {
    console.error("❌ Error creating shared_files table:", error.message);
  }
};

const createsharedFiles = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared_file_tokens (
        id SERIAL PRIMARY KEY,
        file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
        shared_by_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'viewer',
        token UUID NOT NULL UNIQUE,
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(file_id, email)
      );
    `);
    console.log("✅ shared_file_tokens table created.");
  } catch (error) {
    console.error("❌ Error creating shared_file_tokens table:", error.message);
  }
};


module.exports = {
  createUsersTable,
  createFoldersTable,
  createFilesTable, createSharedFilesTable,createsharedFolders,createsharedFiles
};

