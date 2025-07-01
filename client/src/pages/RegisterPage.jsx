import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api";
import "./RegisterPage.css";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_no: "",
    firstname: "",
    lastname: "",
    password: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", formData);
      const sharedToken = localStorage.getItem("sharedToken");

      if (sharedToken) {
        localStorage.setItem("pendingEmail", formData.email);
        navigate(`/verify-otp?fromShared=true${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`);
      } else {
        navigate("/verify-otp");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        {error && <p className="error-message">{error}</p>}

        {Object.keys(formData).map((field) => (
          <input
            key={field}
            type={field === "password" ? "password" : "text"}
            name={field}
            placeholder={field.replace("_", " ")}
            value={formData[field]}
            onChange={handleChange}
            required
          />
        ))}

        <button type="submit">Register</button>

        <p className="login-link">
          Already have an account?{" "}
          <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}>
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
