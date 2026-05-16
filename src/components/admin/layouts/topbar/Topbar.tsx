"use client";

// External imports
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// Icons
import { IoMdSettings } from "react-icons/io";

// Internal imports
import "@/components/admin/layouts/topbar/topbar.css";
import { LogoutButton } from "@/components/admin/LogoutButton";

/**
 * TopBar component - Displays the application's top navigation bar
 * Includes profile dropdown
 */
export default function AdminTopBar() {
  // State management
  const [isOpen, setIsOpen] = useState(false);

  // Refs and hooks
  const modalRef = useRef<HTMLDivElement>(null);

  /**
   * Click outside handler for profile dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="topbar">
      <div className="container">
        {/* Desktop Layout */}
        <div className="desktop_topbar">
          {/* Logo */}
          <div className="topbar_logo">
            <Image
              src={"/belpower_full.png"}
              alt="Logo"
              width={500}
              height={500}
              priority
            />
          </div>

          {/* Right section: Profile */}
          <div className="topbar_right">
            {/* Profile Button */}
            <button onClick={() => setIsOpen(!isOpen)} className="topbar_profile" title="Open profile menu">
              <Image
                src={"/Profile.png"}
                alt="Profile"
                width={400}
                height={400}
                priority
              />
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="mobile_topbar">
          {/* Profile Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="topbar_profile" title="Open profile menu">
            <Image
              src={"/Profile.png"}
              alt="Profile"
              width={400}
              height={400}
              priority
            />
          </button>
        </div>

        {/* Profile Dropdown */}
        {isOpen && (
          <div ref={modalRef} className="profile_card profile_mobile">
            {/* Account Link */}
            <Link
              href={"/command-center/settings"}
              onClick={() => setIsOpen(false)}
            >
              <IoMdSettings />
              Settings
            </Link>

            {/* Logout Button */}
            <div className="px-4 py-2">
              <LogoutButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
