"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginModal.module.css";

interface LoginModalProps {
  onClose: () => void;
}

interface FormData {
  username: string;
  password: string;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Login info:", formData);
    onClose();
    router.push("/user-dashboard");
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Login</button>
        </form>

        <p className={styles.toggleText}>
          Don't have an account?{" "}
          <span
            onClick={() => {
              onClose();
              router.push("/signup");
            }}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
