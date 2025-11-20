"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import BlurIn from "@/components/magic-ui/blur-in";
import AnimatedImage from "@/components/AnimatedImage";
import Link from "next/link";
import Image from "next/image";
import AnimatedGradientText from "@/components/magic-ui/animated-gradient-text";
import { cn } from "@/lib/utils";
import NumberTicker from "@/components/magic-ui/number-ticker";
import { Button } from "@/components/ui/button";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusLabel, setFocusLabel] = useState<"DSA" | "System Design">("DSA");
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const handler = () => setIsDesktop(mq.matches);
    handler();
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  useEffect(() => {
    setFocusLabel(Math.random() < 0.5 ? "DSA" : "System Design");
  }, []);

  return (
    <div>
      <main>
        <div
          ref={containerRef}
          className="relative w-full z-0 bg-gradient-to-b from-background to-primary/10 pb-6 md:pb-40 md:min-h-screen overflow-hidden"
        >
          {/* Background Grid */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <FlickeringGrid
              className="absolute inset-0 h-full w-full mix-blend-screen [mask-image:radial-gradient(50vw_circle_at_center,white,transparent)]"
              squareSize={4}
              gridGap={6}
              color={focusLabel === "DSA" ? "#0A3F48" : "#4B1D8F"}
              maxOpacity={1}
              flickerChance={0.5}
            />
          </div>

          {/* Main Content */}
          <motion.div
            // ✅ FIX: Changed space-y-8 back to space-y-4 to tighten the gap
            className="relative z-10 flex flex-col items-center justify-start min-h-screen space-y-4 px-4 pt-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 1. Top Banner */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <AnimatedGradientText><span className="text-base font-semibold leading-none text-foreground whitespace-nowrap">
                  Backed by 
                </span> <Image
                  src="/supabase-icon.svg"
                  alt="Supabase"
                  width={60}
                  height={60}
                  className="h-4 w-auto  ml-3 translate-y-[1px]"
                /></AnimatedGradientText>
              <span aria-hidden className="h-6 w-[2px] bg-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold leading-none text-foreground whitespace-nowrap">
                  Protected by
                </span>
                <Image
                  src="/clerk-icon.svg"
                  alt="Clerk"
                  width={60}
                  height={60}
                  className="h-5 w-auto translate-y-[1px]"
                />
              </div>
            </motion.div>

            {/* 2. Main Title */}
            <motion.div variants={itemVariants}>
              <BlurIn
                word={
                  <>
                    <span className="md:whitespace-nowrap">
                      {" "}
                      {focusLabel} karo dhyaan se,{" "}
                    </span>
                    <br className="hidden md:block" />
                    <span>Placement milegi shaan se.</span>
                  </>
                }
                className="text-center text-5xl md:text-7xl font-bold break-words w-full max-w-[92vw] md:max-w-[1200px] px-2 mx-auto -z-10 leading-tight"
                duration={1}
              />
            </motion.div>

            {/* 3. Subtitle */}
            <motion.h2
              // ✅ Added mt-4 to ensure the subtitle doesn't sit too close to the title now that space-y is smaller
              className="text-xl text-opacity-60 tracking-normal text-center max-w-2xl mx-auto z-10 mt-4"
              variants={itemVariants}
            >
              Lockin' now with <NumberTicker value={2000} />+ company-wise DSA
              questions.
              <br /> No jugaad. No luck. Just Grind.
            </motion.h2>

            {/* 4. Buttons */}
            <motion.div variants={itemVariants} className="z-20 flex gap-3">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="shadow-2xl h-12 px-8 text-lg leading-none transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/system-design">
                <Button
                  size="lg"
                  variant="outline"
                  className="shadow-2xl h-12 px-8 text-lg leading-none transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  System Design
                </Button>
              </Link>
            </motion.div>

            {/* 5. Hero Image with Negative Margin */}
            <motion.div
              variants={itemVariants}
              style={{ scale: isDesktop ? (scale as any) : 1 }}
              className="-mt-16"
            >
              <AnimatedImage
                src={focusLabel === "DSA" ? "/image1.png" : "/image2.png"}
                alt="Hero Image"
                width={2000}
                height={1500}
                className="w-full h-auto max-w-[90vw] mx-auto rounded-2xl shadow-lg px-0 sm:px-4"
              />
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}