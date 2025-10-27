"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import styles from "./page.module.css";

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className={styles.landing}>
      <Navbar onLoginClick={() => setIsLoginOpen(true)} />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>
            Smart Fall
            <br /> Detection You
            <br /> Can Trust.
          </h1>
          <p className={styles.heroSubtext}>
            Combining advanced sensors with health
            <br />
            tracking, Smart Fall helps you live
            <br />
            independently while keeping your
            <br /> safety a priority.
          </p>
          <button className={styles.heroButton}>Learn More</button>
        </div>
        <div className={styles.heroRight}>
          <Image
            src="/CaregiverImageHero.webp"
            alt="SmartFall device"
            fill
            className={styles.heroImage}
            priority
          />
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.feature}>
          <Image
            src="/falldetectionlogo.png"
            alt="Real-Time Fall Detection Logo"
            width={130}
            height={130}
            className={styles.featureLogo}
          />
          <hr className={styles.featureSeparator} />
          <div className={styles.featureText}>
            <h3>Real-Time Fall Detection</h3>
            <p className={styles.featureSubtext}>
              Instantly detects falls, measuring rate and intensity to ensure
              fast response.
            </p>
          </div>
        </div>

        <div className={styles.feature}>
          <Image
            src="/vitalslogo.png"
            alt="Vital Monitoring Logo"
            width={130}
            height={130}
            className={styles.featureLogo}
          />
          <hr className={styles.featureSeparator} />
          <div className={styles.featureText}>
            <h3>Vital Monitoring</h3>
            <p className={styles.featureSubtext}>
              Continuously tracks blood pressure and heart rate for proactive
              health insights.
            </p>
          </div>
        </div>

        <div className={styles.feature}>
          <Image
            src="/caregiverlogo.png"
            alt="Caregiver Alerts Logo"
            width={130}
            height={130}
            className={styles.featureLogo}
          />
          <hr className={styles.featureSeparator} />
          <div className={styles.featureText}>
            <h3>Caregiver Alerts</h3>
            <p className={styles.featureSubtext}>
              Notifies caregivers immediately during emergencies, keeping loved
              ones connected and safe.
            </p>
          </div>
        </div>
      </section>

      {/* Second Hero Section */}
      <section className={`${styles.hero} ${styles.heroWhite}`}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>
            Real-Time Insights.
            <br /> Smarter Responses.
          </h1>
          <p className={styles.heroSubtext}>
            Monitor fall alerts, health vitals,
            <br />
            and device status in real time
            <br /> with our intuitive dashboard.
          </p>
          <button
            className={styles.heroButton}
            onClick={() => setIsLoginOpen(true)}
          >
            Login
          </button>
        </div>
        <div className={styles.heroRight}>
          <Image
            src="/dashboard.jpg"
            alt="SmartFall Dashboard"
            width={500}
            height={400}
            className={styles.dashboardImage}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 SmartFall.</p>
      </footer>

      {/* Login Modal */}
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
}
