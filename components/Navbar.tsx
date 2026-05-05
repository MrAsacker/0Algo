"use client";

import { Button } from "@/components/ui/button";
import { UserButton, SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";

const Navbar = () => {
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
        <div className="flex items-center justify-end space-x-4 mr-5 min-w-[150px]">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
