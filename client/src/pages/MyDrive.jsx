
import React, { useEffect, useState } from "react";
import API from "../api";
import debounce from "lodash.debounce";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Folder,
  FileText,
  UploadCloud,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  RotateCcw,
  XCircle,
  Move,
  Share2
} from "lucide-react";
import "./MyDrive.css";

const MyDrive = ({ activeTab }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  //const [fileToUpload, setFileToUpload] = useState(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [favorites, setFavorites] = useState({ folders: [], files: [], allFolders: [], allFiles: [] });
  const [recent, setRecent] = useState([]);
  const [trashed, setTrashed] = useState({ folders: [], files: [] });
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState("");
  const [renameId, setRenameId] = useState(null);
  const [newRenameValue, setNewRenameValue] = useState("");
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ folders: [], files: [] });

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [folderTree, setFolderTree] = useState([]);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState(null);
  const [moveSourceFolderId, setMoveSourceFolderId] = useState(null);
 const [moveSourceFileId, setMoveSourceFileId] = useState(null);
  const [shareFileId, setShareFileId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFolderId, setShareFolderId] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("viewer");
  const [sharedWithList, setSharedWithList] = useState([]);

  const fetchDriveContents = async () => {
    try {
      const folderRes = await API.get("/folders/list", {
        params: { parent_id: currentFolderId },
      });
      const fileRes = await API.get("/files/list", {
        params: { folder_id: currentFolderId },
      });
      setFolders(folderRes.data.folders);
      setFiles(fileRes.data.files);
    } catch (err) {
      console.error("Failed to fetch drive contents:", err);
    }
  };

 const fetchFavorites = async () => {
  try {
    const res = await API.get("/both/favorites");
    const allFolders = res.data.favoriteFolders || [];
    const allFiles = res.data.favoriteFiles || [];

    const topLevelFolders = allFolders.filter(folder => folder.is_favorite);
    const topLevelFiles = allFiles.filter(file => file.is_favorite && file.folder_id === null); // or adjust if needed

    setFavorites({
      folders: topLevelFolders,
      files: topLevelFiles,
      allFolders,
      allFiles
    });
  } catch (err) {
    console.error("Failed to fetch favorites:", err);
  }
};



  const fetchRecent = async () => {
    try {
      const res = await API.get("/both/recent");
      setRecent(res.data.recent || []);
    } catch (err) {
      console.error("Failed to fetch recent:", err);
    }
  };

  const fetchTrash = async () => {
    try {
      const folderRes = await API.get("/folders/trash");
      const fileRes = await API.get("/files/trash");
      setTrashed({
        folders: folderRes.data.folders || [],
        files: fileRes.data.files || [],
      });
    } catch (err) {
      console.error("Failed to fetch trash:", err);
    }
  };

  const debouncedSearch = debounce(async (query) => {
    if (!query.trim()) {
      setSearchResults({ folders: [], files: [] });
      return;
    }
    try {
      const res = await API.get("/both/search", { params: { q: query } });
      setSearchResults({
        folders: res.data.folders || [],
        files: res.data.files || [],
      });
    } catch (err) {
      console.error("Search failed:", err);
    }
  }, 300);

  const handleSearch = (query) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };
  useEffect(() => {
    if (activeTab === "favorites") fetchFavorites();
    else if (activeTab === "recent") fetchRecent();
    else if (activeTab === "trash") fetchTrash();
    else fetchDriveContents();
  }, [activeTab, currentFolderId]);

  const enterFolder = (folderId) => {
    setFolderHistory((prev) => [...prev, currentFolderId]);
    setCurrentFolderId(folderId);
  };

  const goBack = () => {
    const newHistory = [...folderHistory];
    const prevId = newHistory.pop();
    setCurrentFolderId(prevId || null);
    setFolderHistory(newHistory);
  };

  const handleCreateFolder = async () => {
    try {
      await API.post("/folders/create", {
        name: newFolderName,
        parent_id: currentFolderId,
      });
      setNewFolderName("");
      setShowNewFolderModal(false);
      fetchDriveContents();
    } catch (err) {
      console.error("Folder creation failed:", err);
    }
  };

  const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const metadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      folder_id: currentFolderId,
    };

    await API.post("/files/upload", metadata);
    toast.success("File uploaded successfully!");
    fetchDriveContents();
  } catch (err) {
    console.error("Upload failed:", err);
    toast.error("Upload failed.");
  }
};


  const toggleFavorite = async (id, isFav, type) => {
    try {
      if (type === "folder") {
        isFav
          ? await API.delete(`/folders/unfavorite/${id}`)
          : await API.post(`/folders/favorite/${id}`);
      } else {
        isFav
          ? await API.delete(`/files/unfavorite/${id}`)
          : await API.post(`/files/favorite/${id}`);
      }

      if (activeTab === "favorites") fetchFavorites();
      else if (activeTab === "recent") fetchRecent();
      else fetchDriveContents();
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  const openRenameModal = (id, type, currentName) => {
    setRenameId(id);
    setRenameType(type);
    setNewRenameValue(currentName);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async () => {
    try {
      await API.put(`/${renameType}/update/${renameId}`, { name: newRenameValue });
      setShowRenameModal(false);
      setRenameId(null);
      setNewRenameValue("");
      if (activeTab === "favorites") fetchFavorites();
      else if (activeTab === "recent") fetchRecent();
      else if (activeTab === "trash") fetchTrash();
      else fetchDriveContents();
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const openEmptyTrashModal = () => {
    setShowEmptyTrashModal(true);
  };

  const confirmEmptyTrash = async () => {
    try {
      await API.delete("/both/empty-trash");
      fetchTrash();
    } catch (err) {
      console.error("Failed to empty trash:", err);
    } finally {
      setShowEmptyTrashModal(false);
    }
  };

  const softDelete = async (id, type) => {
    try {
      await API.put(`/${type}/soft-delete/${id}`);
      if (activeTab === "favorites") fetchFavorites();
      else if (activeTab === "recent") fetchRecent();
      else fetchDriveContents();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const restoreItem = async (id, type) => {
    try {
      await API.put(`/${type}/restore/${id}`);
      fetchTrash();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const permanentDelete = async (id, type) => {
    try {
      await API.delete(`/${type}/permanent/${id}`);
      fetchTrash();
    } catch (err) {
      console.error("Permanent delete failed:", err);
    }
  };
   const fetchFolderTree = async () => {
    try {
      const res = await API.get("/folders/tree");
      setFolderTree(res.data.tree || []);
    } catch (err) {
      console.error("Failed to fetch folder tree:", err);
    }
  };

   const openMoveModal = (id, type) => {
    if (type === "folder") setMoveSourceFolderId(id);
    else setMoveSourceFileId(id);
    fetchFolderTree();
    setShowMoveModal(true);
  };

    const confirmMoveFolder = async () => {
    try {
      if (moveSourceFolderId) {
        await API.put(`/folders/update/${moveSourceFolderId}`, {
          parent_id: moveTargetFolderId,
        });
      } else if (moveSourceFileId) {
        await API.put(`/files/update/${moveSourceFileId}`, {
          folder_id: moveTargetFolderId,
        });
      }
      setShowMoveModal(false);
      setMoveSourceFolderId(null);
      setMoveSourceFileId(null);
      setMoveTargetFolderId(null);
      fetchDriveContents();
    } catch (err) {
      console.error("Move failed:", err);
    }
  };


   const openShareModal = (id, type) => {
    setShareFolderId(null);
    setShareFileId(null);
    setShareEmail("");
    setShareRole("viewer");
    setSharedWithList([]);
    setShowShareModal(true);

    if (type === "folder") {
      setShareFolderId(id);
    } else {
      setShareFileId(id);
    }
  };
  const handleShareFolder = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    const response = await API.post(
      "/folders/share",
      {
        folder_id: shareFolderId,   // ✅ use the folder ID you stored earlier
        email: shareEmail,
        role: shareRole
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const shareUrl = response.data.shareUrl;

    toast.success("Folder shared successfully!");

    // ✅ Show/share/copy URL
    console.log("Shareable URL:", shareUrl);
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
    // ✅ Reset state
    setShareEmail('');
    setShareRole('viewer');
    setShowShareModal(false);
  } catch (error) {
    toast.error("Sharing failed.");
    console.error("Share failed:", error);
  }
};
 const handleShareFile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await API.post(
        "/files/share",
        { file_id: shareFileId, email: shareEmail, role: shareRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const shareUrl = response.data.shareUrl;
      toast.success("File shared successfully!");
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
      setShareEmail('');
      setShareRole('viewer');
      setShowShareModal(false);
    } catch (error) {
      toast.error("Sharing failed.");
      console.error("Share file failed:", error);
    }
  };
    const handleShareSubmit = () => {
    if (shareFolderId) handleShareFolder();
    else handleShareFile();
  };


 
  const renderFolderOptions = (tree, level = 0) => {
  return tree.flatMap((folder) => {
    const isInvalidMoveTarget =
      moveSourceFolderId &&
      (folder.id === moveSourceFolderId || isDescendant(folder, moveSourceFolderId));

    if (isInvalidMoveTarget) return [];

    return [
      <option key={folder.id} value={folder.id}>
        {"‣".repeat(level)} {folder.name}
      </option>,
      ...(folder.children ? renderFolderOptions(folder.children, level + 1) : []),
    ];
  });
};
const isDescendant = (folder, sourceId) => {
  if (!folder.children) return false;
  for (const child of folder.children) {
    if (child.id === sourceId || isDescendant(child, sourceId)) {
      return true;
    }
  }
  return false;
};

  const renderGrid = (items, type = "file", showModified = false, trashMode = false) => {
    return items.map((item) => (
      <div key={item.id} className={`card ${type}`}>
        <div className="card-header">
          {type === "folder" ? (
            <Folder size={36} color="#f4b400" onClick={() => enterFolder(item.id)} />
          ) : (
            <FileText size={34} color="#4285f4" />
          )}
          <div className="actions">
            {trashMode ? (
              <>
                <span onClick={() => restoreItem(item.id, type === "folder" ? "folders" : "files")} title="Restore">
                  <RotateCcw size={16} color="#34a853" />
                </span>
                <span onClick={() => permanentDelete(item.id, type === "folder" ? "folders" : "files")} title="Permanently Delete">
                  <XCircle size={16} color="#ea4335" />
                </span>
              </>
            ) : (
              <>
                <span onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id, item.is_favorite, type); }} title={item.is_favorite ? "Unmark Favorite" : "Mark as Favorite"}>
                  {item.is_favorite ? <StarOff size={16} color="#fbbc05" /> : <Star size={16} color="#fbbc05" />}
                </span>
                <span onClick={(e) => { e.stopPropagation(); openRenameModal(item.id, type === "folder" ? "folders" : "files", item.name); }}>
                  <Pencil size={16} title="Rename" />
                </span>
                
                    <span onClick={(e) => { e.stopPropagation(); openMoveModal(item.id, type); }}>
  <Move size={16} color="#5c6bc0" title={`Move ${type}`} />
</span>
<span onClick={(e) => { e.stopPropagation(); openShareModal(item.id, type); }}>
  <Share2 size={16} color="#4caf50" title={`Share ${type}`} />
</span>          
                <span onClick={(e) => { e.stopPropagation(); softDelete(item.id, type === "folder" ? "folders" : "files"); }}>
                  <Trash2 size={16} color="#ea4335" title="Delete" />
                </span>
              </>
            )}
          </div>
        </div>
         <p>{searchQuery ? highlightMatch(item.name, searchQuery) : item.name}</p>
        {/*<p>{item.name}</p>*/}
        {showModified && item.updated_at && (
          <small className="timestamp">Last Modified: {new Date(item.updated_at).toLocaleString()}</small>
        )}
      </div>
    ));
  };
  const highlightMatch = (text, query) => {
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <strong key={index} style={{ backgroundColor: "#ffff00" }}>{part}</strong>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const displayContent = () => {
    if (searchQuery.trim()) {
      return (
        <>
          {renderGrid(searchResults.folders, "folder")}
          {renderGrid(searchResults.files, "file")}
        </>
      );
    }
    

   if (activeTab === "favorites") {
  const { allFolders, allFiles } = favorites;

  const visibleFolders = allFolders.filter(
    (f) => f.parent_id === currentFolderId
  );
  const visibleFiles = allFiles.filter(
    (f) => f.folder_id === currentFolderId
  );

  return (
    <>
      {currentFolderId && (
  <div className="back-button-container">
    <button className="back-button" onClick={goBack}>
      <ArrowLeft className="icon" size={16} />
      <span>Back</span>
    </button>
  </div>
)}

      {renderGrid(visibleFolders, "folder")}
      {renderGrid(visibleFiles, "file")}
    </>
  );
}

    if (activeTab === "recent") {
      const files = recent.filter((item) => item.type === "file");
      return (
        <>
          {renderGrid(files, "file", true)}
        </>
      );
    }
    if (activeTab === "trash") {
      return (
        <>
          {renderGrid(trashed.folders, "folder", false, true)}
          {renderGrid(trashed.files, "file", false, true)}
        </>
      );
    }
    return (
      <>
        {renderGrid(folders, "folder")}
        {renderGrid(files, "file")}
      </>
    );
  };

  return (
    <div className="mydrive-main">
      <div className="header">
        
        <h2>
          {activeTab === "favorites"
            ? "Favorites"
            : activeTab === "recent"
            ? "Recent"
            : activeTab === "trash"
            ? "Trash"
            : "My Drive"}
        </h2>

        {activeTab !== "trash" && (
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => handleSearch("")}>✕</button>
            )}
          </div>
        )}

        {activeTab === "trash" && (
          <button className="empty-trash-btn" onClick={openEmptyTrashModal}>
            <Trash2 size={16} className="icon" /> Empty Trash
          </button>
        )}
        {activeTab === "mydrive" && (
  <div className="toolbar new-dropdown-wrapper left-align">
    <div className="dropdown">
      <button className="dropdown-toggle">
        <Plus className="icon" /> New
      </button>
      <div className="dropdown-menu">
        <div className="dropdown-item" onClick={() => setShowNewFolderModal(true)}>
          <Folder className="icon" size={16} /> New Folder
        </div>
        <div className="dropdown-item">
          <label>
            <UploadCloud className="icon" size={16} /> Upload File
            <input type="file" onChange={handleFileChange} hidden />
          </label>
        </div>
      </div>
    </div>

  

    {currentFolderId && (
      <button onClick={goBack}>
        <ArrowLeft className="icon" /> Back
      </button>
    )}
  </div>
)} 

        
      </div>

      <div className="grid-view">{displayContent()}</div>

      {showNewFolderModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Folder</h3>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
            />
            <div className="modal-actions">
              <button onClick={handleCreateFolder}>Create</button>
              <button onClick={() => setShowNewFolderModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEmptyTrashModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Permanently Delete All Items</h3>
            <p>This action cannot be undone. Are you sure you want to empty the trash?</p>
            <div className="modal-actions">
              <button className="danger" onClick={confirmEmptyTrash}>Delete Permanently</button>
              <button onClick={() => setShowEmptyTrashModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
       {/* Move Modal */}
       {showMoveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Move Item</h3>
            <select
              value={moveTargetFolderId || ""}
              onChange={(e) => setMoveTargetFolderId(e.target.value)}
            >
              <option value="">-- Select Destination --</option>
              {renderFolderOptions(folderTree)}
            </select>
            <div className="modal-actions">
              <button onClick={confirmMoveFolder} disabled={!moveTargetFolderId}>Move</button>
              <button onClick={() => setShowMoveModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Share {shareFolderId ? "Folder" : "File"}</h3>
            <input
              type="email"
              placeholder="Enter email to share"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
            />
            <select value={shareRole} onChange={(e) => setShareRole(e.target.value)}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <div className="modal-actions">
              <button onClick={handleShareSubmit} disabled={!shareEmail}>Share</button>
              <button onClick={() => setShowShareModal(false)}>Close</button>
            </div>
            {shareFolderId && (
  <>
    <h4>Shared With</h4>
    <ul>
      {sharedWithList.map((entry, i) => (
        <li key={i}>{entry.email} ({entry.role})</li>
      ))}
    </ul>
  </>
)}

          </div>
        </div>
      )}
      {showRenameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Rename Item</h3>
            <input
              value={newRenameValue}
              onChange={(e) => setNewRenameValue(e.target.value)}
              placeholder="New name"
            />
            <div className="modal-actions">
              <button onClick={handleRenameSubmit}>Rename</button>
              <button onClick={() => setShowRenameModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDrive;