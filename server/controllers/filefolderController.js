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


// Recursive helper to get all descendants
const getAllDescendants = async (parentId, userId) => {
  let folders = [];
  let files = [];

  const childFolders = await pool.query(
    `SELECT * FROM folders WHERE parent_id = $1 AND user_id = $2 AND deleted = FALSE`,
    [parentId, userId]
  );
  const childFiles = await pool.query(
    `SELECT * FROM files WHERE folder_id = $1 AND user_id = $2 AND deleted = FALSE`,
    [parentId, userId]
  );

  folders.push(...childFolders.rows);
  files.push(...childFiles.rows);

  for (const folder of childFolders.rows) {
    const { folders: subfolders, files: subfiles } = await getAllDescendants(folder.id, userId);
    folders.push(...subfolders);
    files.push(...subfiles);
  }

  return { folders, files };
};

exports.getFavorites = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Step 1: Get directly favorited folders and files
    const favoriteFoldersRes = await pool.query(
      `SELECT * FROM folders WHERE user_id = $1 AND is_favorite = TRUE AND deleted = FALSE`,
      [userId]
    );
    const favoriteFilesRes = await pool.query(
      `SELECT * FROM files WHERE user_id = $1 AND is_favorite = TRUE AND deleted = FALSE`,
      [userId]
    );

    const allFolders = [...favoriteFoldersRes.rows];
    const allFiles = [...favoriteFilesRes.rows];

    // Step 2: For each favorite folder, get all nested folders and files
    for (const folder of favoriteFoldersRes.rows) {
      const { folders: nestedFolders, files: nestedFiles } = await getAllDescendants(folder.id, userId);
      allFolders.push(...nestedFolders);
      allFiles.push(...nestedFiles);
    }

    res.json({
      favoriteFolders: allFolders,
      favoriteFiles: allFiles,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



//favourites folder
//exports.getFavorites = async (req, res) => {
//   const userId = req.user.userId;

//   try {
//     const filesRes = await pool.query(
//       `SELECT * FROM files WHERE user_id = $1 AND is_favorite = TRUE AND deleted = FALSE`,
//       [userId]
//     );

//     const foldersRes = await pool.query(
//       `SELECT * FROM folders WHERE user_id = $1 AND is_favorite = TRUE AND deleted = FALSE`,
//       [userId]
//     );

//     res.json({
//       favoriteFiles: filesRes.rows,
//       favoriteFolders: foldersRes.rows,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



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

