"use client";

import { useEffect, useState } from "react";
import Footer from "./Footer";

export default function FooterWithUserDetection() {
  const [userType, setUserType] = useState<
    "visitor" | "patient" | "caregiver" | "admin" | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const accountType = data.accountType?.toLowerCase() || null;

          if (
            accountType === "patient" ||
            accountType === "caregiver" ||
            accountType === "admin"
          ) {
            setUserType(accountType as "patient" | "caregiver" | "admin");
          }
        }
      } catch {
        console.log("User not authenticated or error fetching user info");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // Return regular Footer while loading to avoid layout shift
  return <Footer userType={!isLoading ? userType : null} />;
}
