import React, { useState } from "react";
import "./LandingPage.css";
import Navbar from "./Navbar";
import heroImage from "./CaregiverImageHero.webp";
import cargiverlogo from "./caregiverlogo.png";
import falldetectionlogo from "./falldetectionlogo.png";
import vitalLogo from "./vitalslogo.png";
import dashboardImage from "./dashboard.jpg";
import LoginModal from "../UserCreation/LoginModal"; 

function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  return (
    <div className="landing">
      <Navbar onLoginClick={() => setIsLoginOpen(true)}/> 

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <h1 className="hero-title">Smart Fall<br/> Detection You<br/> Can Trust.</h1>
          <p className="hero-subtext">
              Combining advanced sensors with health<br/>tracking, Smart Fall helps you live<br/>independently while keeping your<br/> safety a priority.          </p>
          <button className="hero-button">Learn More</button>
        </div>
        <div className="hero-right">
          <img src={heroImage} alt="SmartFall device" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature">
          <img src={falldetectionlogo} alt="Real-Time Fall Detection Logo" className="feature-logo" />
          <hr className="feature-separator" />
          <div className="feature-text">
            <h3>Real-Time Fall Detection</h3>
            <p className="feature-subtext">
              Instantly detects falls, measuring rate and intensity to ensure fast response.
            </p>
          </div>
        </div>

        <div className="feature">
          <img src={vitalLogo} alt="Vital Monitoring Logo" className="feature-logo" />
          <hr className="feature-separator" />
          <div className="feature-text">
            <h3>Vital Monitoring</h3>
            <p className="feature-subtext">
              Continuously tracks blood pressure and heart rate for proactive health insights.
            </p>
          </div>
        </div>

        <div className="feature">
          <img src={cargiverlogo} alt="Caregiver Alerts Logo" className="feature-logo" />
          <hr className="feature-separator" />
          <div className="feature-text">
            <h3>Caregiver Alerts</h3>
            <p className="feature-subtext">
              Notifies caregivers immediately during emergencies, keeping loved ones connected and safe.
            </p>
          </div>
        </div>
      </section>

      {/* Second Hero Section */}
      <section className="hero hero-white">
        <div className="hero-left">
          <h1 className="hero-title">Real-Time Insights.<br/> Smarter Responses.</h1>
          <p className="hero-subtext">
            Monitor fall alerts, health vitals,<br/>and device status in real time<br/> with our intuitive dashboard.
          </p>
          <button className="hero-button" onClick={() => setIsLoginOpen(true)}>Login</button>
        </div>
        <div className="hero-right">
          <img src={dashboardImage} alt="SmartFall Dashboard" />
        </div>
      </section>


      {/* Footer */}
      <footer>
        <p>&copy; 2025 SmartFall.</p>
      </footer>

       {/* Login Modal */}
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />} 
    </div>
  );
}

export default LandingPage;

