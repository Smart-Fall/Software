"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";

interface NavbarProps {
  user?: {
    firstName?: string;
    lastName?: string;
    accountType?: string;
  } | null;
  onLogout?: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => pathname === path;

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <nav className="bg-white border-b border-[#e5e7eb] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer gap-2"
            onClick={() => handleNavigation("/")}
          >
            <Image
              src="/SmartFall_logo.png"
              alt="SmartFall Logo"
              width={120}
              height={120}
              priority
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Authenticated User Links */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {user.firstName || "User"}
                  </span>
                </div>
                {user.accountType === "caregiver" && (
                  <Button
                    variant={
                      isActive("/caregiver-dashboard") ? "default" : "ghost"
                    }
                    onClick={() => handleNavigation("/caregiver-dashboard")}
                  >
                    Dashboard
                  </Button>
                )}
                {user.accountType === "patient" && (
                  <Button
                    variant={isActive("/user-dashboard") ? "default" : "ghost"}
                    onClick={() => handleNavigation("/user-dashboard")}
                  >
                    Dashboard
                  </Button>
                )}
                {onLogout && (
                  <Button
                    variant="outline"
                    onClick={onLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Guest Links */}
                <Button
                  variant={isActive("/login") ? "default" : "ghost"}
                  onClick={() => handleNavigation("/login")}
                >
                  Login
                </Button>
                <Button
                  variant={isActive("/signup") ? "default" : "outline"}
                  onClick={() => handleNavigation("/signup")}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {user ? (
                <>
                  <div className="px-3 py-2 rounded-md bg-accent/50 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {user.firstName || "User"}
                    </span>
                  </div>
                  {user.accountType === "caregiver" && (
                    <Button
                      variant={
                        isActive("/caregiver-dashboard") ? "default" : "ghost"
                      }
                      onClick={() => handleNavigation("/caregiver-dashboard")}
                      className="w-full justify-start"
                    >
                      Dashboard
                    </Button>
                  )}
                  {user.accountType === "patient" && (
                    <Button
                      variant={
                        isActive("/user-dashboard") ? "default" : "ghost"
                      }
                      onClick={() => handleNavigation("/user-dashboard")}
                      className="w-full justify-start"
                    >
                      Dashboard
                    </Button>
                  )}
                  {onLogout && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        onLogout();
                        setIsOpen(false);
                      }}
                      className="w-full justify-start flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant={isActive("/login") ? "default" : "ghost"}
                    onClick={() => handleNavigation("/login")}
                    className="w-full justify-start"
                  >
                    Login
                  </Button>
                  <Button
                    variant={isActive("/signup") ? "default" : "outline"}
                    onClick={() => handleNavigation("/signup")}
                    className="w-full justify-start"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
