import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage/LandingPage";
import UserDashboard from "./Dashboard/UserDashboard";
import CaregiverDashboard from "./Dashboard/CaretakerDashboard";
import Signup from "./UserCreation/SignUp";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/caregiver-dashboard" element={<CaregiverDashboard />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;