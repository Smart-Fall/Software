import React, { useState } from "react";
import "./Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">SmartFall</div>

      {/* Hamburger button */}
      <div className="hamburger" onClick={toggleMenu}>
        ☰
      </div>

      {/* Nav Links */}
      <ul className={`navbar-links ${isOpen ? "open" : ""}`}>
        <li><a href="#login">Login</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  );
}

export default Navbar;

