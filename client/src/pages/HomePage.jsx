// pages/HomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      <div className="hero">
        <div className="hero-left">
          <div className="brand">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3262/3262185.png"
              alt="ArcDrive Logo"
              className="logo"
            />
            <h1>ArcDrive</h1>
          </div>
          <p className="tagline">
            Manage. Share. Print. <br />All in One..
          </p>
          <div className="hero-buttons">
            <button onClick={() => navigate("/login")}>🔐 Login</button>
            <button onClick={() => navigate("/register")}>📝 Register</button>
          </div>
        </div>

        <div className="hero-right">
          <img
            src="https://cdn-icons-png.flaticon.com/512/337/337940.png"
            alt="Hero Illustration"
            className="illustration"
          />
        </div>
      </div>

      {/* <footer className="footer">
        <p>© 2025 ArcDrive. Built with ❤️ for smart file storage.</p>
      </footer> */}
    </div>
  );
};

export default HomePage;
