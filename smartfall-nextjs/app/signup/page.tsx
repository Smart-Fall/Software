"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

interface SignUpFormData {
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  password: string;
  accountType: string;
}

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: "",
    lastName: "",
    dob: "",
    email: "",
    password: "",
    accountType: "",
  });
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Account created:", formData);

    if (formData.accountType === "user") {
      router.push("/user-dashboard");
    } else if (formData.accountType === "caregiver") {
      router.push("/caregiver-dashboard");
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupBox}>
        <h2>Sign Up</h2>
        <div className={styles.stepIndicator}>Step {step} of 3</div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <input
                type="date"
                name="dob"
                placeholder="Date of Birth"
                value={formData.dob}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
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
            </>
          )}

          {step === 2 && (
            <>
              <label>Select account type:</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                required
              >
                <option value="">--Choose--</option>
                <option value="caregiver">Caregiver</option>
                <option value="user">User</option>
              </select>
            </>
          )}

          {step === 3 && (
            <>
              <h3>Confirm your info</h3>
              <p>
                <strong>Name:</strong> {formData.firstName} {formData.lastName}
              </p>
              <p>
                <strong>DOB:</strong> {formData.dob}
              </p>
              <p>
                <strong>Email:</strong> {formData.email}
              </p>
              <p>
                <strong>Account Type:</strong> {formData.accountType}
              </p>
            </>
          )}

          <div className={styles.buttonRow}>
            {step > 1 && (
              <button type="button" onClick={prevStep}>
                Back
              </button>
            )}
            {step < 3 && (
              <button type="button" onClick={nextStep}>
                Next
              </button>
            )}
            {step === 3 && <button type="submit">Create Account</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
