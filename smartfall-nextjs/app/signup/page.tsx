'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import styles from './signup.module.css'

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    // Basic info (Step 1)
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    password: '',
    phone: '',
    
    // Account type (Step 2)
    accountType: '',
    
    // Caregiver specific (Step 3 if caregiver)
    facilityName: '',
    licenseNumber: '',
    specialization: '',
    
    // Patient specific (Step 3 if user)
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalConditions: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const nextStep = () => {
    // Validate step 1
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dob || !formData.email || !formData.password || !formData.phone) {
        setError('Please fill in all fields')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email')
        return
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }
    
    // Validate step 2
    if (step === 2 && !formData.accountType) {
      setError('Please select an account type')
      return
    }
    
    // Validate step 3 based on account type
    if (step === 3) {
      if (formData.accountType === 'caregiver') {
        if (!formData.facilityName || !formData.specialization) {
          setError('Please fill in all caregiver fields')
          return
        }
      } else if (formData.accountType === 'user') {
        if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
          setError('Please fill in emergency contact information')
          return
        }
      }
    }
    
    setError('')
    setStep(step + 1)
  }

  const prevStep = () => {
    setError('')
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success("Account created successfully, please login")
        router.push('/login')
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      console.error('Signup failed:', err)
      toast.error('An error occurred. Please try again.')
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupBox}>
        <h2>Sign Up</h2>
        <div className={styles.stepIndicator}>Step {step} of 4</div>

        {error && (
          <div style={{
            color: 'red',
            marginBottom: '1rem',
            padding: '0.5rem',
            backgroundColor: '#fee',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: Basic Information */}
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
                <DatePicker
                  selected={formData.dob ? new Date(formData.dob) : null}
                  onChange={(date) => {
                    if (date) {
                      setFormData({ ...formData, dob: date.toISOString().split('T')[0] })
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  placeholderText="Select Date of Birth"
                  wrapperClassName={styles.datepickerWrapper}
                  className={styles.datepickerInput}
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
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </>
          )}

          {/* STEP 2: Account Type Selection */}
          {step === 2 && (
            <>
              <label style={{ marginBottom: '0.5rem', display: 'block' }}>
                Select account type:
              </label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                required
              >
                <option value="">--Choose--</option>
                <option value="user">Patient/User</option>
                <option value="caregiver">Caregiver</option>
              </select>
              
              {formData.accountType && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#e8f4f8', 
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}>
                  {formData.accountType === 'caregiver' 
                    ? '📋 As a caregiver, you will be able to monitor and manage multiple patients.'
                    : '👤 As a patient, you will be able to track your health and receive care from caregivers.'}
                </div>
              )}
            </>
          )}

          {/* STEP 3: Account-Specific Information */}
          {step === 3 && formData.accountType === 'caregiver' && (
            <>
              <h3 style={{ marginBottom: '1rem' }}>Caregiver Information</h3>
              <input
                type="text"
                name="facilityName"
                placeholder="Facility/Organization Name"
                value={formData.facilityName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="licenseNumber"
                placeholder="License Number (optional)"
                value={formData.licenseNumber}
                onChange={handleChange}
              />
              <input
                type="text"
                name="specialization"
                placeholder="Specialization (e.g., Elderly Care)"
                value={formData.specialization}
                onChange={handleChange}
                required
              />
            </>
          )}

          {step === 3 && formData.accountType === 'user' && (
            <>
              <h3 style={{ marginBottom: '1rem' }}>Emergency Contact Information</h3>
              <input
                type="text"
                name="emergencyContactName"
                placeholder="Emergency Contact Name"
                value={formData.emergencyContactName}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="emergencyContactPhone"
                placeholder="Emergency Contact Phone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                required
              />
              <textarea
                name="medicalConditions"
                placeholder="Medical Conditions (optional)"
                value={formData.medicalConditions}
                onChange={handleChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </>
          )}

          {/* STEP 4: Confirmation */}
          {step === 4 && (
            <>
              <h3>Confirm your information</h3>
              <div style={{ textAlign: 'left', marginTop: '1rem' }}>
                <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                <p><strong>Date of Birth:</strong> {formData.dob}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                <p><strong>Account Type:</strong> {formData.accountType === 'caregiver' ? 'Caregiver' : 'Patient/User'}</p>
                
                {formData.accountType === 'caregiver' && (
                  <>
                    <p><strong>Facility:</strong> {formData.facilityName}</p>
                    <p><strong>Specialization:</strong> {formData.specialization}</p>
                    {formData.licenseNumber && <p><strong>License:</strong> {formData.licenseNumber}</p>}
                  </>
                )}
                
                {formData.accountType === 'user' && (
                  <>
                    <p><strong>Emergency Contact:</strong> {formData.emergencyContactName}</p>
                    <p><strong>Emergency Phone:</strong> {formData.emergencyContactPhone}</p>
                    {formData.medicalConditions && <p><strong>Medical Conditions:</strong> {formData.medicalConditions}</p>}
                  </>
                )}
              </div>
            </>
          )}

          <div className={styles.buttonRow}>
            {step > 1 && (
              <button type="button" onClick={prevStep} disabled={loading}>
                Back
              </button>
            )}
            {step < 4 && (
              <button type="button" onClick={nextStep}>
                Next
              </button>
            )}
            {step === 4 && (
               
              <button type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              
            )}
          </div>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#111a96',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  )
}