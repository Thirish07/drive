const pool = require('../config/db');

// Permanently delete ALL trashed files and folders
exports.emptyTrash = async (req, res) => {
  const userId = req.user.userId;

  try {
    const deleteFiles = await pool.query(
      `DELETE FROM files WHERE user_id = $1 AND deleted = TRUE`,
      [userId]
    );

    const deleteFolders = await pool.query(
      `DELETE FROM folders WHERE user_id = $1 AND deleted = TRUE`,
      [userId]
    );

    res.json({
      message: "Trash emptied successfully.",
      filesDeleted: deleteFiles.rowCount,
      foldersDeleted: deleteFolders.rowCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//favourites folder
exports.getFavorites = async (req, res) => {
  const userId = req.user.userId;

  try {
    const filesRes = await pool.query(
      `SELECT * FROM files WHERE user_id = $1 AND is_favorite = TRUE AND deleted = FALSE`,
      [userId]
    );

    const foldersRes = await pool.query(
      `SELECT * FROM folders WHERE user_id = $1 AND is_favorite = TRUE AND deleted = FALSE`,
      [userId]
    );

    res.json({
      favoriteFiles: filesRes.rows,
      favoriteFolders: foldersRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// 🔍 Search files and folders by name (case-insensitive, partial match)
exports.searchFilesAndFolders = async (req, res) => {
  const userId = req.user.userId;
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Search query 'q' is required" });
  }

  try {
    const filesResult = await pool.query(
      `SELECT * FROM files 
       WHERE user_id = $1 AND deleted = FALSE AND LOWER(name) LIKE LOWER($2)`,
      [userId, `%${query}%`]
    );

    const foldersResult = await pool.query(
      `SELECT * FROM folders 
       WHERE user_id = $1 AND deleted = FALSE AND LOWER(name) LIKE LOWER($2)`,
      [userId, `%${query}%`]
    );

    res.json({
      files: filesResult.rows,
      folders: foldersResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get recent files and folders for user (last 10 updated)
exports.getRecentItems = async (req, res) => {
  const userId = req.user.userId;

  try {
    const recentFiles = await pool.query(
      `SELECT id, name, 'file' as type, updated_at, is_favorite FROM files
       WHERE user_id = $1 AND deleted = FALSE
       ORDER BY updated_at DESC
       LIMIT 10`,
      [userId]
    );

    const recentFolders = await pool.query(
      `SELECT id, name, 'folder' as type, updated_at ,is_favorite FROM folders
       WHERE user_id = $1 AND deleted = FALSE
       ORDER BY updated_at DESC
       LIMIT 10`,
      [userId]
    );

    const all = [...recentFiles.rows, ...recentFolders.rows];

    // Sort by updated_at across both types
    all.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json({ recent: all.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

