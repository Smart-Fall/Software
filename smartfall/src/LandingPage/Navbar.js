import React, { useState } from "react";
import "./Navbar.css";
import LoginModal from "../UserCreation/LoginModal"; 


function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false); 

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">SmartFall</div>

        {/* Hamburger button */}
        <div className="hamburger" onClick={toggleMenu}>
          ☰
        </div>

        {/* Nav Links */}
        <ul className={`navbar-links ${isOpen ? "open" : ""}`}>
          <li>
            <a href="#!" onClick={() => setShowLogin(true)}>Login</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>
      </nav>

      {/* 👇 Only show popup when showLogin is true */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

export default Navbar;
