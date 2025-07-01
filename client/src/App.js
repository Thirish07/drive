import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotResetPasswordPage from "./pages/ForgotResetPasswordPage";
import SharedView from "./pages/SharedView";



const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotResetPasswordPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/shared/:token" element={<SharedView />} />  
        <Route path="/shared/file/:token" element={<SharedView />} />
        
      </Routes>
    </Router>
  );
};

export default App;
