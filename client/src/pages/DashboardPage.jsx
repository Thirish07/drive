// DashboardPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import MyDrive from "./MyDrive";
import "./DashboardPage.css";

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState("mydrive");
  const navigate = useNavigate();

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

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>📁 Drive System</h2>
        </div>

        <div className={`tab-item ${activeTab === "mydrive" ? "active" : ""}`} onClick={() => setActiveTab("mydrive")}>
          🗂️ My Drive
        </div>
        <div className={`tab-item ${activeTab === "favorites" ? "active" : ""}`} onClick={() => setActiveTab("favorites")}>
          ⭐ Favorites
        </div>
        <div className={`tab-item ${activeTab === "recent" ? "active" : ""}`} onClick={() => setActiveTab("recent")}>
          🕒 Recent
        </div>
        <div className={`tab-item ${activeTab === "trash" ? "active" : ""}`} onClick={() => setActiveTab("trash")}>
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
          <MyDrive activeTab={activeTab} />
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
