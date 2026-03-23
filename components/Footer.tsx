"use client";

import Link from "next/link";
import { Heart, AlertCircle, Users, BarChart3, Settings } from "lucide-react";

interface FooterProps {
  userType?: "visitor" | "patient" | "caregiver" | "admin" | null;
}

export default function Footer({ userType }: FooterProps) {
  const currentYear = new Date().getFullYear();

  // Emergency contact section (always visible)
  const EmergencySection = () => (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
            Emergency Support
          </h3>
          <p className="text-sm text-red-800 dark:text-red-200 mb-2">
            In case of a medical emergency, call 911 or your local emergency
            number immediately.
          </p>
          <p className="text-sm font-medium text-red-900 dark:text-red-100">
            SmartFall Support: <span className="font-bold">1-800-FALL-911</span>
          </p>
        </div>
      </div>
    </div>
  );

  // Visitor footer (unauthenticated users)
  const VisitorFooter = () => (
    <div className="space-y-8">
      <EmergencySection />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* About */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">
            About SmartFall
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Advanced fall detection and health monitoring system designed to
            help you live independently while keeping your safety a priority.
          </p>
          <Link
            href="/signup"
            className="inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Get Started →
          </Link>
        </div>

        {/* For Patients */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">For Patients</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/signup"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Create Account
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </Link>
            </li>
            <li>
              <Link
                href="/docs/iot-device"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Device Setup
              </Link>
            </li>
            <li>
              <Link
                href="/docs/user-guide/faq"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* For Caregivers */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">For Caregivers</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/signup"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Register as Caregiver
              </Link>
            </li>
            <li>
              <Link
                href="/docs/frontend/caregiver-dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Patient dashboard footer
  const PatientFooter = () => (
    <div className="space-y-8">
      <EmergencySection />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Quick Links
          </h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/user-dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Profile
              </Link>
            </li>
            <li>
              <Link
                href="/devices"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Devices
              </Link>
            </li>
          </ul>
        </div>

        {/* Health Info */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">
            Health Resources
          </h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/docs/user-guide/health-tips"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Health Tips
              </Link>
            </li>
            <li>
              <Link
                href="/docs/iot-device"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Device Manual
              </Link>
            </li>
            <li>
              <Link
                href="/docs/user-guide/faq"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">Support</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="mailto:support@smartfall.app"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Email Support
              </a>
            </li>
            <li>
              <Link
                href="/docs/user-guide/troubleshooting"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Troubleshooting
              </Link>
            </li>
            <li>
              <a
                href="mailto:support@smartfall.app"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">Legal</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/docs/legal/privacy-policy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/docs/legal/terms-of-service"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/docs/legal/accessibility"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Accessibility
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Caregiver dashboard footer
  const CaregiverFooter = () => (
    <div className="space-y-8">
      <EmergencySection />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Dashboard */}
        <div>
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Dashboard
          </h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/caregiver-dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Patients Overview
              </Link>
            </li>
            <li>
              <Link
                href="/caregiver-dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Fall Alerts
              </Link>
            </li>
            <li>
              <Link
                href="/caregiver-dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Health Analytics
              </Link>
            </li>
          </ul>
        </div>

        {/* Patient Management */}
        <div>
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Management
          </h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/caregiver-dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Add Patient
              </Link>
            </li>
            <li>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Profile
              </Link>
            </li>
            <li>
              <Link
                href="/docs/admin-guide"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Resources
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">Support</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="mailto:support@smartfall.app"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Email Support
              </a>
            </li>
            <li>
              <Link
                href="/docs/admin-guide"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Training
              </Link>
            </li>
            <li>
              <Link
                href="/docs/user-guide/faq"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="/docs/api-reference"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">Legal</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/docs/legal/privacy-policy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/docs/legal/terms-of-service"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/docs/legal/accessibility"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Accessibility
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Admin footer
  const AdminFooter = () => (
    <div className="space-y-8">
      <EmergencySection />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Admin Panel */}
        <div>
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Administration
          </h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Users
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                System Status
              </Link>
            </li>
          </ul>
        </div>

        {/* Analytics */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">Analytics</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Reports
              </Link>
            </li>
            <li>
              <Link
                href="/docs/admin-guide/user-management"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                User Activity
              </Link>
            </li>
            <li>
              <Link
                href="/docs/admin-guide/system-logs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                System Logs
              </Link>
            </li>
          </ul>
        </div>

        {/* Tools */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">Tools</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Maintenance
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </Link>
            </li>
            <li>
              <Link
                href="/docs/api-reference"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">Legal</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/docs/legal/privacy-policy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/docs/legal/terms-of-service"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/docs/legal/accessibility"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Accessibility
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <footer className="border-t border-border bg-card text-card-foreground mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dynamic content based on user type */}
        {!userType || userType === "visitor" ? (
          <VisitorFooter />
        ) : userType === "patient" ? (
          <PatientFooter />
        ) : userType === "caregiver" ? (
          <CaregiverFooter />
        ) : userType === "admin" ? (
          <AdminFooter />
        ) : (
          <VisitorFooter />
        )}

        {/* Bottom divider and copyright */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} SmartFall. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Designed to keep you safe, independent, and connected.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
