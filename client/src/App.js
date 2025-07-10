import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotResetPasswordPage from "./pages/ForgotResetPasswordPage";
import SharedView from "./pages/SharedView";
import HomePage from "./pages/HomePage"; // ← Add this




const App = () => {
  return (
     <DndProvider backend={HTML5Backend}>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* <Route path="/" element={<RegisterPage />} /> */}
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotResetPasswordPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/shared/:token" element={<SharedView />} />  
        <Route path="/shared/file/:token" element={<SharedView />} />
        
      </Routes>
    </Router>
    </DndProvider>
  );
};

export default App;
