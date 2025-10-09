import React, { useState } from "react";
import "./SignUp.css"; // We'll style it below
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    email: "",
    password: "",
    accountType: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Account created:", formData);

  if (formData.accountType === "user") {
    navigate("/user-dashboard");
  } else if (formData.accountType === "caregiver") {
    navigate("/caregiver-dashboard");
  }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Sign Up</h2>
        <div className="step-indicator">
          Step {step} of 3
        </div>

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
              <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
              <p><strong>DOB:</strong> {formData.dob}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Account Type:</strong> {formData.accountType}</p>
            </>
          )}

          <div className="button-row">
            {step > 1 && <button type="button" onClick={prevStep}>Back</button>}
            {step < 3 && <button type="button" onClick={nextStep}>Next</button>}
            {step === 3 && <button type="submit">Create Account</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
