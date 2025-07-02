const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const {createUsersTable,createFoldersTable, createFilesTable, createSharedFilesTable,createsharedFolders,createsharedFiles} = require('./config/initDB');
const protect = require("./middleware/protect");
require('dotenv').config();
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');
const filefolderRoutes =require('./routes/filefolderRoutes');

const app = express();
app.use(cors());
app.use(express.json());

//Routes
app.use('/api/both',filefolderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
// app.get("/api/auth/me", protect, async (req, res) => {
//   const user = req.user; 
//   res.json({ user });
// });


createUsersTable();
createFoldersTable();
createFilesTable();
createsharedFolders();
createsharedFiles();

createSharedFilesTable();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
