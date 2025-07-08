const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { sendEmail } = require("../utils/mailer");

// Upload (metadata only)
// exports.uploadFile = async (req, res) => {
//   const { name, type, size, folder_id } = req.body;
//   const user_id = req.user.userId;

//   try {
//     const result = await pool.query(
//       `INSERT INTO files (name, type, size, folder_id, user_id, url)
//        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
//       [name, type, size, folder_id || null, user_id, `/dummy/path/${name}`]
//     );

//     res.status(201).json({ file: result.rows[0] });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
exports.uploadFile = async (req, res) => {
  const { name, type, size, folder_id } = req.body;
  const user_id = req.user.userId;

  const baseName = path.parse(name).name;
  const extension = path.extname(name);
  let finalName = name;
  let counter = 1;

  try {
    // Check for existing files with same name
    while (true) {
      const existing = await pool.query(
        `SELECT 1 FROM files 
         WHERE name = $1 AND folder_id IS NOT DISTINCT FROM $2 AND user_id = $3 AND deleted = FALSE`,
        [finalName, folder_id || null, user_id]
      );
      if (existing.rowCount === 0) break;
      finalName = `${baseName} (${counter++})${extension}`;
    }

    const result = await pool.query(
      `INSERT INTO files (name, type, size, folder_id, user_id, url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [finalName, type, size, folder_id || null, user_id, `/dummy/path/${finalName}`]
    );

    res.status(201).json({ file: result.rows[0], renamed: finalName !== name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get files in a folder
exports.getFilesByFolder = async (req, res) => {
  const folderId = req.query.folder_id;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM files WHERE user_id = $1 AND folder_id IS NOT DISTINCT FROM $2 AND deleted = FALSE`,
      [userId, folderId || null]
    );

    res.json({ files: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all files uploaded by the user (flat view)
exports.getAllFiles = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM files WHERE user_id = $1 AND deleted = FALSE ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ files: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get files that are not inside any folder
exports.getUnorganizedFiles = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM files WHERE user_id = $1 AND folder_id IS NULL AND deleted = FALSE ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ files: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.softDeleteFile = async (req, res) => {
  const fileId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  if (isNaN(fileId)) {
    return res.status(400).json({ error: "Invalid file ID" });
  }

  try {
    const result = await pool.query(
      `UPDATE files SET deleted = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found or unauthorized" });
    }

    res.json({ message: "File moved to trash." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getTrashedFiles = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM files WHERE user_id = $1 AND deleted = TRUE ORDER BY updated_at DESC`,
      [userId]
    );

    res.json({ files: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.restoreFile = async (req, res) => {
  const fileId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  if (isNaN(fileId)) {
    return res.status(400).json({ error: "Invalid file ID" });
  }

  try {
    const result = await pool.query(
      `UPDATE files
       SET deleted = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found or unauthorized" });
    }

    res.json({ message: "File restored from trash." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Permanently delete a file (must be already soft-deleted)
exports.permanentlyDeleteFile = async (req, res) => {
  const fileId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  if (isNaN(fileId)) {
    return res.status(400).json({ error: "Invalid file ID" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM files WHERE id = $1 AND user_id = $2 AND deleted = TRUE RETURNING *`,
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found or not in trash" });
    }

    res.json({ message: "File permanently deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//favourites

exports.markFileFavorite = async (req, res) => {
  const fileId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `UPDATE files SET is_favorite = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [fileId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "File not found" });

    res.json({ message: "File marked as favorite" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//unmark favourites
exports.unmarkFileFavorite = async (req, res) => {
  const fileId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `UPDATE files SET is_favorite = FALSE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [fileId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "File not found" });

    res.json({ message: "File unmarked from favorite" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Rename File and move
exports.updateFile = async (req, res) => {
  const fileId = parseInt(req.params.id, 10);
  const userId = req.user.userId;
  const { name, folder_id } = req.body;

  if (isNaN(fileId)) {
    return res.status(400).json({ error: "Invalid file ID" });
  }

  const fields = [];
  const values = [];
  let index = 1;

  if (name) {
    fields.push(`name = $${index++}`);
    values.push(name);
  }

  if (folder_id !== undefined) {
    fields.push(`folder_id = $${index++}`);
    values.push(folder_id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(fileId); // where id
  values.push(userId); // where user_id

  const query = `
    UPDATE files
    SET ${fields.join(", ")}
    WHERE id = $${index++} AND user_id = $${index}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "File not found or unauthorized" });

    res.json({ file: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.shareFile = async (req, res) => {
  const { file_id, email, role } = req.body;
  const shared_by_user_id = req.user.userId;

  try {
    const fileRes = await pool.query(
      `SELECT * FROM files WHERE id = $1 AND user_id = $2`,
      [file_id, shared_by_user_id]
    );

    if (fileRes.rows.length === 0) {
      return res.status(403).json({ error: "File not found or unauthorized" });
    }

    const token = uuidv4();

    await pool.query(
      `INSERT INTO shared_file_tokens (file_id, shared_by_user_id, email, role, token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (file_id, email) DO UPDATE SET role = EXCLUDED.role, token = EXCLUDED.token`,
      [file_id, shared_by_user_id, email, role || 'viewer', token]
    );
    
    const shareUrl = `http://localhost:3000/shared/file/${token}`;

    //const shareUrl = `${process.env.CLIENT_URL}/shared/file/${token}`;
    await sendEmail(
      email,
      `You've been shared a file`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>📁 File Shared With You</h2>
        <p>Hello,</p>
        <p>A file has been shared with you on the Drive Printing System.</p>
        <p>
          <a href="${shareUrl}" style="color: #007bff; font-weight: bold;">👉 Click here to open the shared file</a>
        </p>
        <p>If you're not registered, you'll be asked to sign up or log in.</p>
        <hr />
        <p style="font-size: 12px; color: #888;">This link is private and only accessible to the email it was shared with.</p>
      </div>
      `
    );
    res.json({ message: "File shared successfully and email sent", shareUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getSharedFileByToken = async (req, res) => {
  const { token } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
         f.id AS file_id,
         f.name,
         f.created_at,
         f.updated_at,
         s.role,
         u.firstname || ' ' || u.lastname AS owner_name,
         u.email AS owner_email
       FROM shared_file_tokens s
       JOIN files f ON s.file_id = f.id
       JOIN users u ON f.user_id = u.id
       WHERE s.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invalid or expired token" });
    }

    const file = result.rows[0];

    res.json({
      item: {
        file_id: file.file_id,
        name: file.name,
        created_at: file.created_at,
        updated_at: file.updated_at,
        owner_name: file.owner_name,
        owner_email: file.owner_email
      },
      role: file.role,
      type: 'file'
    });
  } catch (err) {
    console.error("getSharedFileByToken error:", err);
    res.status(500).json({ error: err.message });
  }
};



exports.downloadFile = async (req, res) => {
  const fileId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query(`SELECT * FROM files WHERE id = $1`, [fileId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = result.rows[0];

    // Only allow download if:
    // - user owns the file, or
    // - shared access verified by middleware
    const isOwner = file.user_id === req.user?.userId;
    const isShared = req.isSharedAccess;

    if (!isOwner && !isShared) {
      return res.status(403).json({ error: "Access denied" });
    }

    // 🔒 File stored on local disk — adjust for S3 if needed
    const filePath = path.join(__dirname, '../uploads', file.stored_filename || file.name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(filePath, file.name); // download with original name
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ error: "Failed to download file" });
  }
};
