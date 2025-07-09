import React, { useEffect, useState } from "react";
import API from "../api";
import InvisibleDropzone from "../components/InvisibleDropzone";
import DraggableCard from "../components/DraggableCard";
import DroppableFolderCard from "../components/DroppableFolderCard";

import debounce from "lodash.debounce";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
 // Folder,
  //FileText,
  //UploadCloud,
  ArrowLeft,
  //Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  RotateCcw,
  XCircle,
  Move,
  Share2,Search
} from "lucide-react";
import "./MyDrive.css";

//const MyDrive = ({ activeTab }) => {
const MyDrive = ({ activeTab, showNewFolderModal, setShowNewFolderModal }) => {

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
 
  //const [showNewFolderModal, setShowNewFolderModal] = useState(false);
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
  const [isDragging, setIsDragging] = useState(false);
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
  const [currentFolderPath, setCurrentFolderPath] = useState([]);

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

    // Deduplicate by ID
    const seenFileIds = new Set();
    const uniqueFiles = [];
    for (const file of res.data.favoriteFiles || []) {
      if (!seenFileIds.has(file.id)) {
        uniqueFiles.push(file);
        seenFileIds.add(file.id);
      }
    }

    const seenFolderIds = new Set();
    const uniqueFolders = [];
    for (const folder of res.data.favoriteFolders || []) {
      if (!seenFolderIds.has(folder.id)) {
        uniqueFolders.push(folder);
        seenFolderIds.add(folder.id);
      }
    }

    setFavorites({
      folders: uniqueFolders.filter(f => f.is_favorite),
      files: uniqueFiles.filter(f => f.is_favorite && f.folder_id === null),
      allFolders: uniqueFolders,
      allFiles: uniqueFiles,
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

  // Expose function globally for upload trigger
  if (activeTab === "mydrive") {
    window.refreshDriveContents = fetchDriveContents;
  }

  return () => {
    // Clean up
    if (window.refreshDriveContents) {
      delete window.refreshDriveContents;
    }
  };
}, [activeTab, currentFolderId]);

 
  const enterFolder = async (folderId) => {
  setFolderHistory((prev) => [...prev, currentFolderId]);
  setCurrentFolderId(folderId);

  try {
    const res = await API.get(`/folders/path/${folderId}`); // assumes backend returns path array
    setCurrentFolderPath(res.data.path); // path = [ { id, name }, ... ]
  } catch (err) {
    console.error("Failed to fetch folder path:", err);
  }
};
const goBack = () => {
  const newHistory = [...folderHistory];
  const prevId = newHistory.pop();
  setCurrentFolderId(prevId || null);
  setFolderHistory(newHistory);
  if (!prevId) setCurrentFolderPath([]); // reset path at root
};

  
  const handleCreateFolder = async () => {
  try {
    const res = await API.post("/folders/create", {
      name: newFolderName,
      parent_id: currentFolderId,
    });

    const createdFolder = res.data.folder;
    const wasRenamed = res.data.renamed;

    if (wasRenamed) {
      toast.info(`Folder created as "${createdFolder.name}" (renamed)`);
    } else {
      toast.success("Folder created successfully!");
    }

    setNewFolderName("");
    setShowNewFolderModal(false);
    fetchDriveContents();
  } catch (err) {
    console.error("Folder creation failed:", err);
    toast.error("Failed to create folder.");
  }
};

  const handleFileUpload = async (files) => {
  const uploads = Array.from(files).map(async (file) => {
    const metadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      folder_id: currentFolderId,
    };

    try {
      const res = await API.post("/files/upload", metadata);
      const uploadedFile = res.data.file;
      const wasRenamed = res.data.renamed;

      if (wasRenamed) {
        toast.info(`File uploaded as "${uploadedFile.name}" (renamed)`);
      }
    } catch (err) {
      console.error(`Failed to upload ${file.name}:`, err);
      toast.error(`Upload failed: ${file.name}`);
    }
  });

  await Promise.all(uploads);
  fetchDriveContents();
};
// const handleFileChange = async (e) => {
//   const files = e.target.files;
//   if (!files || files.length === 0) return;
//   await handleFileUpload(files); 
// };
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
    const targetId = moveTargetFolderId === "" ? null : moveTargetFolderId;

    if (moveSourceFolderId) {
      await API.put(`/folders/update/${moveSourceFolderId}`, {
        parent_id: targetId,
      });
    } else if (moveSourceFileId) {
      await API.put(`/files/update/${moveSourceFileId}`, {
        folder_id: targetId,
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
        folder_id: shareFolderId,   
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
    console.log("Shareable URL:", shareUrl);
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");

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
  const options = [];

  if (level === 0 && currentFolderId !== null) {
    options.push(
      <option key="root" value="">
        📁 My Drive (Root)
      </option>
    );
  }

  tree.forEach((folder) => {
    const isInvalidMoveTarget =
      moveSourceFolderId &&
      (folder.id === moveSourceFolderId || isDescendant(folder, moveSourceFolderId));

    if (!isInvalidMoveTarget) {
      options.push(
        <option key={folder.id} value={folder.id}>
          {"‣".repeat(level)} {folder.name}
        </option>
      );

      if (folder.children && folder.children.length > 0) {
        options.push(...renderFolderOptions(folder.children, level + 1));
      }
    }
  });

  return options;
};
const handleFileClick = (file) => {
  window.open(`${import.meta.env.VITE_API_BASE_URL}/files/${file.id}/download`, "_blank");
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

const renderSingleCard = (item, type = "file") => {
  const isTrash = activeTab === "trash";
  const showModified = activeTab === "recent";
  const trashType = type === "folder" ? "folders" : "files";

  return (
    <div
      className={`card ${type} cursor-pointer`}
      onClick={() => {
        if (type === "folder") {
          enterFolder(item.id);
          setSearchQuery("");
          setSearchResults({ folders: [], files: [] });
        } else {
          handleFileClick(item);
        }
      }}
    >
      <div className="card-header">
        <div
          className="card-left"
          onClick={(e) => {
            e.stopPropagation();
            if (type === "folder") enterFolder(item.id);
          }}
        >
          <span className={type === "folder" ? "icon-folder" : "icon-file"}>
            {type === "folder" ? "📁" : "📄"}
          </span>
          <span className="item-name">
            {searchQuery ? highlightMatch(item.name, searchQuery) : item.name}
          </span>
        </div>

        <div className="actions">
          {isTrash ? (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  restoreItem(item.id, trashType);
                }}
                title="Restore"
              >
                <RotateCcw size={16} color="#34a853" />
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  permanentDelete(item.id, trashType);
                }}
                title="Delete permanently"
              >
                <XCircle size={16} color="#ea4335" />
              </span>
            </>
          ) : (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.id, item.is_favorite, type);
                }}
                title={item.is_favorite ? "Unmark Favorite" : "Mark as Favorite"}
              >
                {item.is_favorite ? (
                  <StarOff size={16} color="#fbbc05" />
                ) : (
                  <Star size={16} color="#fbbc05" />
                )}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openRenameModal(item.id, type === "folder" ? "folders" : "files", item.name);
                }}
                title="Rename"
              >
                <Pencil size={16} />
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openMoveModal(item.id, type);
                }}
                title="Move"
              >
                <Move size={16} color="#5c6bc0" />
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openShareModal(item.id, type);
                }}
                title="Share"
              >
                <Share2 size={16} color="#4caf50" />
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  softDelete(item.id, trashType);
                }}
                title="Delete"
              >
                <Trash2 size={16} color="#ea4335" />
              </span>
            </>
          )}
        </div>
      </div>

      {showModified && item.updated_at && (
        <small className="timestamp">
          Last Modified: {new Date(item.updated_at).toLocaleString()}
        </small>
      )}
    </div>
  );
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
  const handleDropToRoot = async (draggedItem) => {
  try {
    if (draggedItem.itemType === 'folder') {
      await API.put(`/folders/update/${draggedItem.id}`, {
        parent_id: null,
      });
    } else if (draggedItem.itemType === 'file') {
      await API.put(`/files/update/${draggedItem.id}`, {
        folder_id: null,
      });
    }
    toast.success("Moved to My Drive!");
    fetchDriveContents();
  } catch (err) {
    toast.error("Failed to move to My Drive.");
    console.error("Drop to root error:", err);
  }
};

  const handleDragDropMove = async (draggedItem, targetFolderId) => {
  try {
    if (draggedItem.itemType === 'folder') {
      await API.put(`/folders/update/${draggedItem.id}`, {
        parent_id: targetFolderId,
      });
    } else if (draggedItem.itemType === 'file') {
      await API.put(`/files/update/${draggedItem.id}`, {
        folder_id: targetFolderId,
      });
    }
    toast.success("Item moved successfully!");
    fetchDriveContents();
  } catch (err) {
    toast.error("Move failed!");
    console.error("Drag move error:", err);
  }
};

  const displayContent = () => {
    
if (searchQuery.trim()) {
  return (
    <>
      {searchResults.folders.map((folder) => (
        <DroppableFolderCard
          key={`search-folder-${folder.id}`}
          folder={folder}
          onDropItem={handleDragDropMove}
        >
          <DraggableCard item={folder} type="folder">
            {renderSingleCard(folder, "folder")}
          </DraggableCard>
        </DroppableFolderCard>
      ))}
      {searchResults.files.map((file) => (
        <DraggableCard key={`search-file-${file.id}`} item={file} type="file">
          {renderSingleCard(file, "file")}
        </DraggableCard>
      ))}
    </>
  );
}
if (activeTab === "favorites") {
  const { allFolders, allFiles } = favorites;
  const favoritedFolderIds = new Set(allFolders.map(f => f.id));

  // Step 1: Build parent-to-children map
  const folderChildrenMap = {};
  allFolders.forEach(f => {
    if (!folderChildrenMap[f.parent_id]) folderChildrenMap[f.parent_id] = [];
    folderChildrenMap[f.parent_id].push(f);
  });

  // Step 2: Build set of all descendant folder IDs of top-level favorited folders
  const getDescendants = (id, map, set) => {
    if (!map[id]) return;
    for (let child of map[id]) {
      set.add(child.id);
      getDescendants(child.id, map, set);
    }
  };

  // Only include folders whose parent is not favorited
  const topLevelFavorites = allFolders.filter(f => f.is_favorite && (!f.parent_id || !favoritedFolderIds.has(f.parent_id)));

  const descendantIds = new Set();
  topLevelFavorites.forEach(folder => getDescendants(folder.id, folderChildrenMap, descendantIds));

  if (currentFolderId === null) {
    // Show only top-level favorite folders and favorite files not inside those folders
    const visibleFolders = topLevelFavorites;
    const visibleFiles = allFiles.filter(f =>
      f.is_favorite && (!f.folder_id || !favoritedFolderIds.has(f.folder_id))
    );

    
    return (
  <>
    {visibleFolders.map((folder) => (
      <DroppableFolderCard key={folder.id} folder={folder} onDropItem={handleDragDropMove}>
        <DraggableCard item={folder} type="folder">
          {renderSingleCard(folder, "folder")}
        </DraggableCard>
      </DroppableFolderCard>
    ))}
    {visibleFiles.map((file) => (
      <DraggableCard key={file.id} item={file} type="file">
        {renderSingleCard(file, "file")}
      </DraggableCard>
    ))}
  </>
);

  } else {
    // Inside a favorite folder — show direct children but exclude duplicates already shown at top
    const visibleFolders = (folderChildrenMap[currentFolderId] || []).filter(
      f => !topLevelFavorites.find(top => top.id === f.id)
    );

    const visibleFiles = allFiles.filter(f => f.folder_id === currentFolderId);
    return (
  <>
    <div className="back-button-container">
      <button className="back-button" onClick={goBack}>
        <ArrowLeft className="icon" size={16} />
        <span>Back</span>
      </button>
    </div>
    {visibleFolders.map((folder) => (
      <DroppableFolderCard key={folder.id} folder={folder} onDropItem={handleDragDropMove}>
        <DraggableCard item={folder} type="folder">
          {renderSingleCard(folder, "folder")}
        </DraggableCard>
      </DroppableFolderCard>
    ))}
    {visibleFiles.map((file) => (
      <DraggableCard key={file.id} item={file} type="file">
        {renderSingleCard(file, "file")}
      </DraggableCard>
    ))}
  </>
);


    
  }
}

    
    if (activeTab === "recent") {
  const files = recent.filter((item) => item.type === "file");
  return (
    <>
      {files.map((file) => (
        <DraggableCard key={file.id} item={file} type="file">
          {renderSingleCard(file, "file")}
        </DraggableCard>
      ))}
    </>
  );
}

    if (activeTab === "trash") {
      return (
  <>
    {trashed.folders.map((folder) => (
      <DroppableFolderCard key={folder.id} folder={folder} onDropItem={handleDragDropMove}>
        <DraggableCard item={folder} type="folder">
          {renderSingleCard(folder, "folder")}
        </DraggableCard>
      </DroppableFolderCard>
    ))}
    {trashed.files.map((file) => (
      <DraggableCard key={file.id} item={file} type="file">
        {renderSingleCard(file, "file")}
      </DraggableCard>
    ))}
  </>
);
    }
    return (
      <>
        
        {folders.map((folder) => (
  <DroppableFolderCard
    key={folder.id}
    folder={folder}
    onDropItem={handleDragDropMove}
  >
    <DraggableCard item={folder} type="folder">
      {renderSingleCard(folder, "folder")}
    </DraggableCard>
  </DroppableFolderCard>
))}

{files.map((file) => (
  <DraggableCard key={file.id} item={file} type="file">
    {renderSingleCard(file, "file")}
  </DraggableCard>
))}

      </>
    );
  };

  return (
    <div className={`mydrive-main ${isDragging ? "dragging" : ""}`}>
    
    <InvisibleDropzone 
  onDropFiles={handleFileUpload} 
  setIsDragging={setIsDragging} 
  onDropItemToRoot={handleDropToRoot}
/>

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

       <div className="search-wrapper">
          <div className="search-bar modern-search">
            <Search size={16} className="search-icon" />
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
          {searchQuery && (searchResults.folders.length > 0 || searchResults.files.length > 0) && (
            <div className="search-suggestions">
              {searchResults.folders.map((folder) => (
             <div
               key={`sug-folder-${folder.id}`}
               className="suggestion-item"
               onClick={() => {
               enterFolder(folder.id);
               setSearchQuery("");
               setSearchResults({ folders: [], files: [] });
              }}
              >
              {folder.name}
              </div>
            ))}
           {searchResults.files.map((file) => (
        <div
          key={`sug-file-${file.id}`}
          className="suggestion-item"
          onClick={() => {
            handleFileClick(file);
            setSearchQuery("");
            setSearchResults({ folders: [], files: [] });
          }}
        >
          {file.name}
        </div>
      ))}
    </div>
  )}
</div>


          
       

        {activeTab === "trash" && (
          <button className="empty-trash-btn" onClick={openEmptyTrashModal}>
            <Trash2 size={16} className="icon" /> Empty Trash
          </button>
        )}
 
  </div>
   {(currentFolderPath.length > 0 || currentFolderId !== null) && (
  <div className="breadcrumb">
    <span className="breadcrumb-item" onClick={() => {
      setCurrentFolderId(null);
      setCurrentFolderPath([]);
      setFolderHistory([]);
    }}>My Drive</span>
    {currentFolderPath.map((folder, index) => (
      <span key={folder.id}>
        {" / "}
        <span
          className="breadcrumb-item"
          onClick={() => enterFolder(folder.id)}
        >
          {folder.name}
        </span>
      </span>
    ))}
  </div>
)} 
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
              <button onClick={confirmMoveFolder} disabled={moveTargetFolderId === null || moveTargetFolderId === undefined}>Move</button>
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

