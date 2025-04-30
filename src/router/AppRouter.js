import React from "react";
import {BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Dashboard from "../pages/dashboard";


const AppRouter = () => {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    );
  };
  
  export default AppRouter;