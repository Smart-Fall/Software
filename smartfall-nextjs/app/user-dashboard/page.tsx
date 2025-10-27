import styles from "./dashboard.module.css";

export default function UserDashboard() {
  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.dashboardTitle}>User Dashboard</h1>
      <p className={styles.dashboardSubtext}>
        Welcome to your personal health monitoring dashboard. More features
        coming soon!
      </p>
    </div>
  );
}
