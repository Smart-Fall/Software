"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { faker } from "@faker-js/faker";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Heart,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Basic info (Step 1)
    firstName: "",
    lastName: "",
    dob: "",
    email: "",
    password: "",
    phone: "",

    // Account type (Step 2)
    accountType: "",

    // Caregiver specific (Step 3 if caregiver)
    facilityName: "",
    licenseNumber: "",
    specialization: "",

    // Patient specific (Step 3 if user)
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalConditions: "",
    initialHealthScore: "",
  });

  const STATIC_PASSWORD = "password123";

  const generateRandomUserData = () => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    dob: faker.date
      .birthdate({ min: 50, max: 85, mode: "age" })
      .toISOString()
      .split("T")[0],
    email: faker.internet.email(),
    password: STATIC_PASSWORD,
    phone: faker.phone.number("(###) ###-####"),
    accountType: "user",
    emergencyContactName: faker.person.fullName(),
    emergencyContactPhone: faker.phone.number("(###) ###-####"),
    medicalConditions: faker.lorem.sentence(3),
    initialHealthScore: String(faker.number.int({ min: 60, max: 90 })),
    facilityName: "",
    licenseNumber: "",
    specialization: "",
  });

  const generateRandomCaregiverData = () => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    dob: faker.date
      .birthdate({ min: 25, max: 65, mode: "age" })
      .toISOString()
      .split("T")[0],
    email: faker.internet.email(),
    password: STATIC_PASSWORD,
    phone: faker.phone.number("(###) ###-####"),
    accountType: "caregiver",
    facilityName: faker.company.name() + " Care Center",
    licenseNumber: faker.string.alphanumeric(8).toUpperCase(),
    specialization: faker.helpers.arrayElement([
      "Elderly Care",
      "Hospice Care",
      "Rehabilitation",
      "Physical Therapy",
      "Palliative Care",
      "Home Health",
    ]),
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalConditions: "",
    initialHealthScore: "",
  });

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV !== "production");
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFillAsUser = () => {
    setFormData(generateRandomUserData());
    setStep(4);
    setError("");
  };

  const handleFillAsCaregiver = () => {
    setFormData(generateRandomCaregiverData());
    setStep(4);
    setError("");
  };

  const nextStep = () => {
    // Validate step 1
    if (step === 1) {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.dob ||
        !formData.email ||
        !formData.password ||
        !formData.phone
      ) {
        setError("Please fill in all fields");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    // Validate step 2
    if (step === 2 && !formData.accountType) {
      setError("Please select an account type");
      return;
    }

    // Validate step 3 based on account type
    if (step === 3) {
      if (formData.accountType === "caregiver") {
        if (!formData.facilityName || !formData.specialization) {
          setError("Please fill in all caregiver fields");
          return;
        }
      } else if (formData.accountType === "user") {
        if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
          setError("Please fill in emergency contact information");
          return;
        }
      }
    }

    setError("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Account created successfully, please login");
        router.push("/login");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup failed:", err);
      toast.error("An error occurred. Please try again.");
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar user={null} />

      <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-center">
              Step {step} of 4
            </CardDescription>
            <div className="flex gap-2 justify-center mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-12 rounded-full transition-colors ${
                    i <= step ? "bg-[hsl(var(--primary))]" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            {isDevelopment && (
              <div className="flex gap-2 justify-center mt-3 pt-3 border-t border-dashed border-muted-foreground/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillAsUser}
                  className="gap-2 text-xs"
                >
                  <Heart className="h-3 w-3" />
                  Fill as User
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillAsCaregiver}
                  className="gap-2 text-xs"
                >
                  <UserPlus className="h-3 w-3" />
                  Fill as Caregiver
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STEP 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="firstName"
                        className="text-sm font-medium"
                      >
                        First Name
                      </label>
                      <Input
                        id="firstName"
                        type="text"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="dob" className="text-sm font-medium">
                      Date of Birth
                    </label>
                    <Input
                      id="dob"
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="john.doe@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      name="phone"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Account Type Selection */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="accountType"
                      className="text-sm font-medium"
                    >
                      Select Account Type
                    </label>
                    <select
                      id="accountType"
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleChange}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">-- Choose Account Type --</option>
                      <option value="user">Patient/User</option>
                      <option value="caregiver">Caregiver</option>
                    </select>
                  </div>

                  {formData.accountType && (
                    <Card className="bg-accent/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          {formData.accountType === "caregiver" ? (
                            <>
                              <UserPlus className="h-5 w-5 text-[hsl(var(--primary))] mt-0.5" />
                              <div>
                                <p className="font-medium">Caregiver Account</p>
                                <p className="text-sm text-muted-foreground">
                                  As a caregiver, you will be able to monitor
                                  and manage multiple patients.
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <Heart className="h-5 w-5 text-[hsl(var(--primary))] mt-0.5" />
                              <div>
                                <p className="font-medium">Patient Account</p>
                                <p className="text-sm text-muted-foreground">
                                  As a patient, you will be able to track your
                                  health and receive care from caregivers.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* STEP 3: Account-Specific Information */}
              {step === 3 && formData.accountType === "caregiver" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Caregiver Information
                  </h3>
                  <div className="space-y-2">
                    <label
                      htmlFor="facilityName"
                      className="text-sm font-medium"
                    >
                      Facility/Organization Name
                    </label>
                    <Input
                      id="facilityName"
                      type="text"
                      name="facilityName"
                      placeholder="Healthcare Center"
                      value={formData.facilityName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="licenseNumber"
                      className="text-sm font-medium"
                    >
                      License Number (Optional)
                    </label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      name="licenseNumber"
                      placeholder="License Number"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="specialization"
                      className="text-sm font-medium"
                    >
                      Specialization
                    </label>
                    <Input
                      id="specialization"
                      type="text"
                      name="specialization"
                      placeholder="e.g., Elderly Care"
                      value={formData.specialization}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              {step === 3 && formData.accountType === "user" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Patient Information</h3>
                  <div className="space-y-2">
                    <label
                      htmlFor="emergencyContactName"
                      className="text-sm font-medium"
                    >
                      Emergency Contact Name
                    </label>
                    <Input
                      id="emergencyContactName"
                      type="text"
                      name="emergencyContactName"
                      placeholder="Contact Name"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="emergencyContactPhone"
                      className="text-sm font-medium"
                    >
                      Emergency Contact Phone
                    </label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      name="emergencyContactPhone"
                      placeholder="(555) 123-4567"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="medicalConditions"
                      className="text-sm font-medium"
                    >
                      Medical Conditions (Optional)
                    </label>
                    <textarea
                      id="medicalConditions"
                      name="medicalConditions"
                      placeholder="Any medical conditions we should be aware of..."
                      value={formData.medicalConditions}
                      onChange={handleChange}
                      rows={2}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-vertical"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="initialHealthScore"
                      className="text-sm font-medium"
                    >
                      Initial Health Score (Optional, 0-100)
                    </label>
                    <Input
                      id="initialHealthScore"
                      type="number"
                      name="initialHealthScore"
                      placeholder="75"
                      min="0"
                      max="100"
                      value={formData.initialHealthScore}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use default score of 75
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: Confirmation */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Confirm Your Information
                  </h3>
                  <div className="space-y-3 bg-accent/30 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="font-medium">Name:</span>
                      <span>
                        {formData.firstName} {formData.lastName}
                      </span>

                      <span className="font-medium">Date of Birth:</span>
                      <span>{formData.dob}</span>

                      <span className="font-medium">Email:</span>
                      <span>{formData.email}</span>

                      <span className="font-medium">Phone:</span>
                      <span>{formData.phone}</span>

                      <span className="font-medium">Account Type:</span>
                      <span>
                        <Badge
                          variant={
                            formData.accountType === "caregiver"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {formData.accountType === "caregiver"
                            ? "Caregiver"
                            : "Patient/User"}
                        </Badge>
                      </span>
                    </div>

                    {formData.accountType === "caregiver" && (
                      <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t">
                        <span className="font-medium">Facility:</span>
                        <span>{formData.facilityName}</span>

                        <span className="font-medium">Specialization:</span>
                        <span>{formData.specialization}</span>

                        {formData.licenseNumber && (
                          <>
                            <span className="font-medium">License:</span>
                            <span>{formData.licenseNumber}</span>
                          </>
                        )}
                      </div>
                    )}

                    {formData.accountType === "user" && (
                      <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t">
                        <span className="font-medium">Emergency Contact:</span>
                        <span>{formData.emergencyContactName}</span>

                        <span className="font-medium">Emergency Phone:</span>
                        <span>{formData.emergencyContactPhone}</span>

                        {formData.medicalConditions && (
                          <>
                            <span className="font-medium">
                              Medical Conditions:
                            </span>
                            <span className="text-xs">
                              {formData.medicalConditions}
                            </span>
                          </>
                        )}

                        <span className="font-medium">
                          Initial Health Score:
                        </span>
                        <span>
                          {formData.initialHealthScore || "75 (default)"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                {step < 4 && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 flex items-center gap-2 justify-center"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                {step === 4 && (
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Button
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={() => router.push("/login")}
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
