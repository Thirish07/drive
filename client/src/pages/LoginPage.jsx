import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../api";
import "./LoginPage.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/auth/login", formData);
      const token = response.data.token;
      localStorage.setItem("accessToken", token);

      const sharedToken = localStorage.getItem("sharedToken");

      
      setTimeout(() => {
  if (redirect) {
    navigate(redirect); // e.g., /shared/:token
  } else if (sharedToken) {
    navigate(`/shared/${sharedToken}`);
  } else {
    navigate("/dashboard");
  }
}, 200);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🚀 Welcome Back</h2>
        <p className="subtext">Please login to your account</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>

          <button type="submit">Login</button>
        </form>

        <p className="bottom-text">
          Don’t have an account?{" "}
          <Link to={`/${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
