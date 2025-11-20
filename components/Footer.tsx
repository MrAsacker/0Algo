// import { BsTwitterX, BsSuitHeartFill } from "react-icons/bs";

// const Footer = () => {
//   return (
//     <footer className="py-4">
//       <div className="container mx-auto flex flex-row items-center justify-between px-4">
//         <div className="flex items-center space-x-2">
//           <span className="flex items-center">
//             Built with <BsSuitHeartFill className="ml-1 mr-1 animate-pulse" />
//             by Asacker
//           </span>
//         </div>
//         <div className="flex items-center space-x-4">
//           <a href="https://twitter.com/mrasacker" target="_blank" rel="noopener noreferrer">
//             <BsTwitterX size={24} />
//           </a>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

import { BsTwitterX, BsSuitHeartFill , BsGithub } from "react-icons/bs";

const Footer = () => {
  return (
    <footer className="py-4">
      <div className="container mx-auto flex flex-row items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <span className="flex items-center text-muted-foreground">
            Built with 
            {/* 👇 Use the custom class here */}
            <BsSuitHeartFill className="mx-1 animate-pulse-color" />
            by Asacker
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="https://twitter.com/mrasacker" target="_blank" rel="noopener noreferrer">
            <BsTwitterX size={24} />
          </a>
          <a 
            href="https://github.com/MrAsacker" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            <BsGithub size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
