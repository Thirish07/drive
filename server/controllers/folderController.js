const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { sendEmail } = require("../utils/mailer");


// ✅ Recursively get all child IDs to prevent circular move
const getAllDescendantIds = async (folderId, userId) => {
  const result = await pool.query(
    `SELECT id FROM folders WHERE parent_id = $1 AND user_id = $2`,
    [folderId, userId]
  );

  let descendants = result.rows.map(row => row.id);

  for (const childId of descendants) {
    const childDescendants = await getAllDescendantIds(childId, userId);
    descendants = descendants.concat(childDescendants);
  }

  return descendants;
};

// ✅ Create folder
exports.createFolder = async (req, res) => {
  const { name, parent_id } = req.body;
  const user_id = req.user.userId;

  const finalParentId = typeof parent_id !== 'undefined' ? parent_id : null;

  try {
    const result = await pool.query(
      `INSERT INTO folders (name, parent_id, user_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, finalParentId, user_id]
    );

    res.status(201).json({ folder: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Rename or Move Folder
exports.updateFolder = async (req, res) => {
  const { name, parent_id } = req.body;
  const folderId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  if (isNaN(folderId)) {
    return res.status(400).json({ error: "Invalid folder ID" });
  }

  // ❌ Prevent self-parent
  if (parent_id !== undefined && folderId === parent_id) {
    return res.status(400).json({ error: "A folder cannot be its own parent." });
  }

  // ❌ Prevent circular move
  if (parent_id !== undefined) {
    const descendants = await getAllDescendantIds(folderId, userId);
    if (descendants.includes(parent_id)) {
      return res.status(400).json({ error: "Cannot move a folder into one of its own subfolders." });
    }
  }

  // ✅ Build dynamic update
  let fields = [];
  let values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }

  if (parent_id !== undefined) {
    fields.push(`parent_id = $${paramIndex++}`);
    values.push(parent_id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(folderId); // WHERE id = $?
  values.push(userId);   // WHERE user_id = $?

  const query = `
    UPDATE folders
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Folder not found or unauthorized" });
    }

    res.json({ folder: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get folders by parent_id

exports.getFoldersByParent = async (req, res) => {
  let parent_id = req.query.parent_id;
  const user_id = req.user.userId;

  if (parent_id === 'null' || parent_id === undefined) {
    parent_id = null;
  } else {
    parent_id = parseInt(parent_id, 10);
    if (isNaN(parent_id)) {
      return res.status(400).json({ error: "Invalid parent_id" });
    }
  }

  try {
    const result = await pool.query(
      `SELECT * FROM folders
       WHERE user_id = $1 AND parent_id IS NOT DISTINCT FROM $2 AND deleted = false
       ORDER BY name`,
      [user_id, parent_id]
    );

    res.json({ folders: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Permanently delete folder
exports.permanentlyDeleteFolder = async (req, res) => {
  const folderId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  if (isNaN(folderId)) {
    return res.status(400).json({ error: "Invalid folder ID" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM folders WHERE id = $1 AND user_id = $2 AND deleted = TRUE RETURNING *`,
      [folderId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Folder not found or not in trash" });
    }

    res.json({ message: "Folder permanently deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get full folder tree
exports.getFolderTree = async (req, res) => {
  const userId = req.user.userId;

  const fetchChildren = async (parentId = null) => {
    const result = await pool.query(
      `SELECT id, name FROM folders
       WHERE user_id = $1 AND parent_id IS NOT DISTINCT FROM $2 AND deleted = false
       ORDER BY name`,
      [userId, parentId]
    );

    const folders = await Promise.all(
      result.rows.map(async (folder) => ({
        ...folder,
        children: await fetchChildren(folder.id)
      }))
    );

    return folders;
  };

  try {
    const tree = await fetchChildren(null);
    res.json({ tree });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /folders/share
exports.shareFolder = async (req, res) => {
  const { folder_id, email, role } = req.body;
  const shared_by_user_id = req.user.userId;

  try {
    const folderRes = await pool.query(
      `SELECT * FROM folders WHERE id = $1 AND user_id = $2`,
      [folder_id, shared_by_user_id]
    );

    if (folderRes.rows.length === 0) {
      return res.status(403).json({ error: "Folder not found or unauthorized" });
    }

    const token = uuidv4();
console.log("✅ Generated token:", token);
    await pool.query(
      `INSERT INTO shared_folder_tokens (folder_id, shared_by_user_id, email, role, token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (folder_id, email) DO UPDATE SET role = EXCLUDED.role, token = EXCLUDED.token`,
      [folder_id, shared_by_user_id, email, role || 'viewer', token]
    );

    const shareUrl = `http://localhost:3000/shared/${token}`;
    //const shareUrl = `${process.env.CLIENT_URL}/shared/${token}`;

    await sendEmail(
      email,
      `You've been shared a folder`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>📁 Folder Shared With You</h2>
        <p>Hello,</p>
        <p>A folder has been shared with you on the Drive Printing System.</p>
        <p>
          <a href="${shareUrl}" style="color: #007bff; font-weight: bold;">👉 Click here to open the shared folder</a>
        </p>
        <p>If you're not registered, you'll be asked to sign up or log in.</p>
        <hr />
        <p style="font-size: 12px; color: #888;">This link is private and only accessible to the email it was shared with.</p>
      </div>
      `
    );
    res.json({ message: "Folder shared successfully and email sent", shareUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSharedFolderByToken = async (req, res) => {
  const { token } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
         f.id,
         f.name,
         f.created_at,
         f.updated_at,
         s.role,
         u.firstname || ' ' || u.lastname AS owner_name,
         u.email AS owner_email
       FROM shared_folder_tokens s
       JOIN folders f ON s.folder_id = f.id
       JOIN users u ON f.user_id = u.id
       WHERE s.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invalid or expired token" });
    }

    const folder = result.rows[0];

    res.json({
      item: {
        id: folder.id,
        name: folder.name,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
        owner_name: folder.owner_name,
        owner_email: folder.owner_email
      },
      role: folder.role,
      type: 'folder'
    });

  } catch (err) {
    console.error("🔥 getSharedFolderByToken ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// controllers/folderController.js

exports.getFolderChildren = async (req, res) => {
  const folderId = parseInt(req.params.id, 10);
  const sharedToken = req.headers["x-shared-token"];
  const userId = req.user?.userId || null;

  try {
    // ✅ Token check if user is not logged in
    if (!userId && sharedToken) {
      const tokenResult = await pool.query(
        `SELECT * FROM shared_folder_tokens WHERE token = $1`,
        [sharedToken]
      );
      if (tokenResult.rows.length === 0) {
        return res.status(403).json({ error: "Invalid or expired shared token" });
      }
    }

    const foldersResult = await pool.query(
      `SELECT id, name, 'folder' AS type FROM folders
       WHERE parent_id = $1 AND deleted = false`,
      [folderId]
    );

    const filesResult = await pool.query(
      `SELECT id, name, 'file' AS type FROM files
       WHERE folder_id = $1 AND deleted = false`,
      [folderId]
    );

    const combined = [...foldersResult.rows, ...filesResult.rows];
    console.log("📦 Children fetched:", combined);

    res.json(combined);
  } catch (err) {
    console.error("getFolderChildren error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Soft delete a folder
exports.softDeleteFolder = async (req, res) => {
  const folderId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  if (isNaN(folderId)) {
    return res.status(400).json({ error: "Invalid folder ID" });
  }

  try {
    const result = await pool.query(
      `UPDATE folders SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [folderId, userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Folder not found or unauthorized" });

    res.json({ message: "Folder moved to trash." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTrashedFolders = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM folders WHERE user_id = $1 AND deleted = TRUE ORDER BY updated_at DESC`,
      [userId]
    );

    res.json({ folders: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.restoreFolder = async (req, res) => {
  const folderId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `UPDATE folders SET deleted = FALSE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [folderId, userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Folder not found or unauthorized" });

    res.json({ message: "Folder restored from trash." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//favourites
exports.markFolderFavorite = async (req, res) => {
  const folderId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `UPDATE folders SET is_favorite = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [folderId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Folder not found" });

    res.json({ message: "Folder marked as favorite" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unmarkFolderFavorite = async (req, res) => {
  const folderId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `UPDATE folders SET is_favorite = FALSE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [folderId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Folder not found" });

    res.json({ message: "Folder unmarked from favorite" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};