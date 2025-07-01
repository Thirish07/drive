import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import "./VerifyOtpPage.css";

const VerifyOtpPage = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const location = useLocation();
  const fromShared = new URLSearchParams(location.search).get("fromShared") === "true";
  const redirect = new URLSearchParams(location.search).get("redirect");
  const navigate = useNavigate();

  useEffect(() => {
    const pendingEmail = localStorage.getItem("pendingEmail");
    if (fromShared && pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [fromShared]);

  
  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await API.post("/auth/verify-otp", { email, otp });
    const token = res.data.token;

    // ✅ Store token
    localStorage.setItem("accessToken", token);
    console.log("✅ Access token stored:", localStorage.getItem("accessToken"));

    const sharedToken = localStorage.getItem("sharedToken");

    if (fromShared && sharedToken) {
      localStorage.removeItem("pendingEmail");

      // ✅ Delay to ensure token is saved
      setTimeout(() => {
        navigate(redirect || `/shared/${sharedToken}`);
        // clear sharedToken AFTER page loads
        setTimeout(() => localStorage.removeItem("sharedToken"), 1000);
      }, 300);  // 🔥 small delay helps let axios interceptor pick up token
    } else {
      navigate("/dashboard");
    }
  } catch (err) {
    setError(err.response?.data?.error || "Invalid OTP or Email");
    setMessage("");
  }
};


  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email to resend OTP");
      return;
    }

    try {
      await API.post("/auth/resend-otp", { email });
      setMessage("OTP resent successfully!");
      setError("");
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 30000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP");
      setMessage("");
    }
  };

  return (
    <div className="verify-container">
      <form className="verify-form" onSubmit={handleSubmit}>
        <h2>Email Verification</h2>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
            setMessage("");
          }}
          required
        />
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value);
            setError("");
            setMessage("");
          }}
          required
        />
        <button type="submit">Verify</button>

        <p className="resend-text">
          Didn't get the code?{" "}
          <span
            className={`resend-link ${resendDisabled ? "disabled" : ""}`}
            onClick={!resendDisabled ? handleResend : undefined}
          >
            Resend OTP
          </span>
        </p>
      </form>
    </div>
  );
};

export default VerifyOtpPage;
