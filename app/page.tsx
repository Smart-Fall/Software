"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import styles from "./page.module.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
});
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source",
});

export default function Home() {
  const router = useRouter();
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`${styles.landing} ${playfair.variable} ${sourceSans.variable}`}
    >
      <Navbar user={null} />

      {/* Hero */}
      <section className={styles.hero}>
        {/* Decorative blobs */}
        <div className={styles.blobTopRight} />
        <div className={styles.blobBottomLeft} />

        <div className={styles.heroLeft}>
          <span className={styles.tagline}>
            <span className={styles.taglineDot} />
            Trusted by families everywhere
          </span>
          <h1 className={styles.heroTitle}>
            Smart Fall
            <br />
            Detection You
            <br />
            <em className={styles.heroItalic}>Can Trust.</em>
          </h1>
          <p className={styles.heroSub}>
            Combining advanced sensors with health tracking, SmartFall helps you
            live independently while keeping your safety a priority.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.btnWarm} onClick={scrollToFeatures}>
              Discover How It Works
            </button>
            <button
              className={styles.btnGhost}
              onClick={() => router.push("/login")}
            >
              Sign In →
            </button>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.imageGrid}>
            <div className={styles.imageMain}>
              <Image
                src="/CaregiverImageHero.webp"
                alt="Caregiver and patient"
                fill
                className={styles.gridImg}
                priority
              />
            </div>
            <div className={styles.imagePill}>
              <div className={styles.pillContent}>
                <span className={styles.pillIcon}>🛡️</span>
                <div>
                  <p className={styles.pillTitle}>Fall Detected</p>
                  <p className={styles.pillSub}>Alert sent to caregiver</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <div className={styles.featuresIntro}>
          <h2 className={styles.featuresTitle}>
            Everything you need,
            <br />
            <em>all in one place.</em>
          </h2>
          <p className={styles.featuresDesc}>
            SmartFall brings together real-time monitoring, vital tracking, and
            instant caregiver notifications in one seamless platform.
          </p>
        </div>
        <div className={styles.featureCards}>
          {[
            {
              id: "fall",
              color: "terracotta",
              icon: (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
              title: "Real-Time Fall Detection",
              desc: "Instantly detects falls, measuring rate and intensity to ensure fast response.",
              popover:
                "Our sensors detect sudden changes in acceleration and orientation. When a fall is confirmed, an alert fires in under 3 seconds — with impact severity so caregivers know exactly how to respond.",
            },
            {
              id: "vitals",
              color: "sage",
              icon: (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
              title: "Vital Monitoring",
              desc: "Continuously tracks blood pressure and heart rate for proactive health insights.",
              popover:
                "SmartFall continuously logs heart rate and blood pressure in the background. Trends are visualized on the dashboard and unusual readings trigger proactive notifications before a crisis occurs.",
            },
            {
              id: "alerts",
              color: "blue",
              icon: (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              ),
              title: "Caregiver Alerts",
              desc: "Notifies caregivers immediately during emergencies, keeping loved ones connected and safe.",
              popover:
                "Designated caregivers receive instant push and SMS notifications the moment an event is detected. They can acknowledge alerts, view the patient's location, and access recent vitals — all from their phone.",
            },
          ].map((f) => (
            <div
              key={f.id}
              className={`${styles.featureCard} ${styles[`card_${f.color}`]} ${openCards.has(f.id) ? styles.cardExpanded : ""}`}
            >
              <div className={styles.cardIconWrap}>{f.icon}</div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
              <div className={styles.cardFooter}>
                <button
                  className={styles.cardLearn}
                  onClick={() => toggleCard(f.id)}
                  aria-expanded={openCards.has(f.id)}
                >
                  {openCards.has(f.id) ? "Show less ↑" : "Learn more ↓"}
                </button>
              </div>
              <div
                className={styles.cardExtra}
                aria-hidden={!openCards.has(f.id)}
              >
                <p className={styles.cardExtraText}>{f.popover}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaText}>
            <h2 className={styles.ctaTitle}>
              Real-Time Insights.
              <br />
              <em className={styles.ctaItalic}>Smarter Responses.</em>
            </h2>
            <p className={styles.ctaSub}>
              Monitor fall alerts, health vitals, and device status in real time
              with our intuitive dashboard.
            </p>
            <button
              className={styles.ctaBtn}
              onClick={() => router.push("/login")}
            >
              Access Your Dashboard
            </button>
          </div>
          <div className={styles.ctaImageWrap}>
            <Image
              src="/dashboard.jpg"
              alt="Dashboard"
              width={540}
              height={380}
              className={styles.ctaImage}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
