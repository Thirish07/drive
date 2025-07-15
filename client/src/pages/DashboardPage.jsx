// DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import MyDrive from "./MyDrive";
import { toast } from 'react-toastify';
import "./DashboardPage.css";

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState("mydrive");
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);


  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const navigate = useNavigate();

const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const metadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      folder_id: currentFolderId,  // <-- 👈 use current folder context
    };

    const res = await API.post("/files/upload", metadata);
    const uploadedFile = res.data.file;
    const wasRenamed = res.data.renamed;

    if (wasRenamed) {
      toast.info(`File uploaded as "${uploadedFile.name}" (renamed)`);
    } else {
      toast.success("File uploaded successfully");
    }

    // Trigger refresh after upload
    if (activeTab === "mydrive" && window.refreshDriveContents) {
      window.refreshDriveContents();
    }

  } catch (error) {
    console.error("File upload failed:", error);
    toast.error("File upload failed");
  }
};



  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get("/auth/me");
        setUser(response.data.user);
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);
  
  const handleLogout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("sharedToken");
  localStorage.removeItem("pendingEmail");
  navigate("/login");
};

  const handleDeleteAccount = async () => {
    try {
      await API.delete("/auth/delete");
      localStorage.removeItem("accessToken");
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProfile = () => {
    setShowEditForm(true);
    setShowMenu(false);
  };

  if (!user) return null;
console.log("Dropdown visible?", showNewDropdown);
  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>📁 Drive System</h2>
        </div>

        <div className={`tab-item ${activeTab === "mydrive" ? "active" : ""}`} onClick={() =>{ setActiveTab("mydrive"); setShowNewDropdown(false);}}>
          🗂️ My Drive
        </div>
        {activeTab === "mydrive" && (
  <div className="sidebar-new-dropdown">
  <button
    className="dropdown-toggle"
    onClick={() => {
      setShowNewDropdown((prev) => !prev);
      console.log("Toggled:", !showNewDropdown); // 👈 debugging
    }}
  >
    <span style={{ marginRight: "4px" }}>➕</span> New ▾
  </button>

  {showNewDropdown && (
    <div className="dropdown-menu" style={{ background: "white", color: "black", zIndex: 9999 }}>
      <div
  className="dropdown-item"
  onClick={() => {
    setShowNewFolderModal(true);
    setShowNewDropdown(false); // also hide the dropdown
  }}
>
        📁 New Folder
      </div>
      <div className="dropdown-item">
        <label>
          📄 Upload File
          <input type="file" onChange={handleFileChange} hidden />
        </label>
      </div>
    </div>
  )}
</div>

)}

        <div className={`tab-item ${activeTab === "favorites" ? "active" : ""}`} onClick={() => {
    setActiveTab("favorites");
    setShowNewDropdown(false); // <-- add this
  }} >
          ⭐ Favorites
        </div>
        <div className={`tab-item ${activeTab === "recent" ? "active" : ""}`} onClick={() => {setActiveTab("recent"); setShowNewDropdown(false);}}>
          🕒 Recent
        </div>
        <div className={`tab-item ${activeTab === "trash" ? "active" : ""}`} onClick={() => {setActiveTab("trash"); setShowNewDropdown(false);}}>
          🗑️ Trash
        </div>

        <div className="profile-section" onClick={() => setShowMenu(!showMenu)}>
          <div className="small-avatar">{user.firstname?.charAt(0)}</div>
          <div className="profile-text">
             Hi, {user.firstname ? user.firstname : user.username} ▾
          </div>
        </div>

        {showMenu && (
          <ul className="submenu">
            <li onClick={handleEditProfile}>✏️ Edit Details</li>
            <li onClick={handleDeleteAccount}>❌ Delete Account</li>
            <li onClick={handleLogout}>🚪 Logout</li>
          </ul>
        )}
      </div>

      <div className="content">
  {showEditForm ? (
    <EditUserForm user={user} setUser={setUser} setShowEditForm={setShowEditForm} />
  ) : (
    <MyDrive
      activeTab={activeTab}
      showNewFolderModal={showNewFolderModal}
      setShowNewFolderModal={setShowNewFolderModal}
      currentFolderId={currentFolderId}
      setCurrentFolderId={setCurrentFolderId}
    />
  )}
</div>
    </div>
  );
};

const EditUserForm = ({ user, setUser, setShowEditForm }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    phone_no: user.phone_no,
    firstname: user.firstname,
    lastname: user.lastname,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put("/auth/edit", formData);
      setUser((prev) => ({ ...prev, ...formData }));
      alert("User details updated successfully!");
      setShowEditForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" />
      <input name="firstname" value={formData.firstname} onChange={handleChange} placeholder="First Name" />
      <input name="lastname" value={formData.lastname} onChange={handleChange} placeholder="Last Name" />
      <input name="phone_no" value={formData.phone_no} onChange={handleChange} placeholder="Phone No" />
      <div className="modal-actions">
        <button type="submit">Update</button>
        <button type="button" onClick={() => setShowEditForm(false)}>Cancel</button>
      </div>
    </form>
  );
};

export default DashboardPage;