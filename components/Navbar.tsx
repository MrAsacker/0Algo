"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserButton, SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Github, Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // FIX: This function must be defined INSIDE the component
  const handleStarProject = () => {
    window.open("https://github.com/MrAsacker", "_blank");
  };

  return (
    <div className="border-b sticky top-0 z-50 bg-background">
      <div className="flex h-[60px] items-center justify-between px-4 container mx-auto">
        {/* Left Side: Logo */}
        <div className="font-bold text-2xl flex items-center min-w-[150px]">
          <Link href="/" className="flex items-center">
            <Image
              src="/white-icon.svg"
              alt="0algo"
              width={32}
              height={32}
              className="object-contain ml-6"
              priority
            />
          </Link>
        </div>

        {/* Middle: Navigation Links */}
        <div className="hidden md:flex items-center space-x-16">
          <Link
            href="/dashboard"
            className="font-mono text-[15px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
          >
            DSA
          </Link>
          <Link
            href="/system-design"
            className="font-mono text-[15px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
          >
            System Design
          </Link>
          <Link
            href="/roadmaps"
            className="font-mono text-[15px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
          >
            Roadmaps
          </Link>
          <Link
            href="/cp-ladder"
            className="font-mono text-[15px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
          >
            CP Ladder
          </Link>
        </div>

        {/* Right Side: Auth / Actions */}
        <div className="flex items-center justify-end space-x-4 sm:mr-5 sm:min-w-[150px]">
          <SignedIn>
            <UserButton />
          </SignedIn>
          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-zinc-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4">
          <div className="flex flex-col space-y-4">
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-mono text-[15px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
            >
              DSA
            </Link>
            <Link
              href="/system-design"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-mono text-[15px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
            >
              System Design
            </Link>
            <Link
              href="/roadmaps"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-mono text-[15px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
            >
              Roadmaps
            </Link>
            <Link
              href="/cp-ladder"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-mono text-[15px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
            >
              CP Ladder
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
