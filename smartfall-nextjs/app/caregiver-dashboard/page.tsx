import styles from "./dashboard.module.css";

export default function CaregiverDashboard() {
  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.dashboardTitle}>Caregiver Dashboard</h1>
      <p className={styles.dashboardSubtext}>
        Monitor your loved ones and respond to emergencies. More features coming
        soon!
      </p>
    </div>
  );
}
