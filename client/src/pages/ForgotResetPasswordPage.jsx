import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./ForgetResetPasswordPage.css";  

const ForgetResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/forgot-password", { email });
      setMessage("✅ OTP sent to your email.");
      setError("");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Error occurred.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/reset-password", { email, otp, newPassword });
      setMessage("✅ Password reset successfully. Redirecting...");
      setError("");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Error occurred.");
    }
  };

  return (
    <div className="fr-wrapper">
      <div className="fr-card">
        <h2>🔐 Reset Your Password</h2>
        <p className="fr-subtext">Get back access to your account</p>

        {message && <div className="fr-success">{message}</div>}
        {error && <div className="fr-error">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="fr-form">
            <input
              type="email"
              name="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="fr-btn">Send OTP</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="fr-form">
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <input
              type="password"
              name="newPassword"
              placeholder="Enter New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="submit" className="fr-btn">Reset Password</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgetResetPasswordPage;
