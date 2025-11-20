// "use client";

// import { Button } from "@/components/ui/button";
// import { UserButton, SignedIn } from "@clerk/nextjs";
// import Link from "next/link";
// import { Github } from "lucide-react";

// const Navbar = () => {
//   const handleStarProject = () => {
//     window.open("https://github.com/MrAsacker", "_blank");
//   };

//   return (
//     <div className="border-b sticky top-0 z-50 bg-background">
//       <div className="flex h-16 items-center px-4 container mx-auto">
//         <div className="font-bold text-2xl flex-1">
//           <Link href="/" className="flex items-center">
//             <span ><img src="white-icon.svg" alt="0algo"  className="w-10 h-10 object-contain ml-12"/></span>
//           </Link>
//         </div>

//         <div className="flex items-center space-x-4 mr-5">
         
//           <SignedIn>
//             <UserButton />
//           </SignedIn>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Navbar;

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
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="font-bold text-2xl flex-1">
          <Link href="/" className="flex items-center">
            <Image
              src="/white-icon.svg"
              alt="0algo"
              // Reduced logo size to 36px to fit the new navbar height
              width={36}
              height={36}
              // Removed the "ml-12" class
              className="object-contain  ml-6"
              priority
            />
          </Link>
        </div>

        <div className="flex items-center space-x-4 mr-5">
          {/* You can add this back if you want a GitHub link:
            <Button variant="ghost" size="icon" onClick={handleStarProject}>
              <Github className="h-5 w-5" />
            </Button>
          */}
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </div>
  );
};

export default Navbar;