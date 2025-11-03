"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLogo}>SmartFall</div>

      {/* Hamburger button */}
      <div className={styles.hamburger} onClick={toggleMenu}>
        ☰
      </div>

      {/* Nav Links */}
      <ul className={`${styles.navbarLinks} ${isOpen ? styles.open : ""}`}>
        <li>
          <a onClick={() => router.push("/login")}>Login</a>
        </li>
        <li>
          <a href="#contact">Contact</a>
        </li>
      </ul>
    </nav>
  );
}


// "use client";

// import { useState } from "react";
// import LoginModal from "../login/page";
// import styles from "./Navbar.module.css";

// interface NavbarProps {
//   onLoginClick?: () => void;
// }

// export default function Navbar({ onLoginClick }: NavbarProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [showLogin, setShowLogin] = useState(false);

//   const toggleMenu = () => {
//     setIsOpen(!isOpen);
//   };

//   const handleLoginClick = () => {
//     setShowLogin(true);
//     onLoginClick?.();
//   };

//   return (
//     <>
//       <nav className={styles.navbar}>
//         <div className={styles.navbarLogo}>SmartFall</div>

//         {/* Hamburger button */}
//         <div className={styles.hamburger} onClick={toggleMenu}>
//           ☰
//         </div>

//         {/* Nav Links */}
//         <ul className={`${styles.navbarLinks} ${isOpen ? styles.open : ""}`}>
//           <li>
//             <a href="#!" onClick={() => handleLoginClick()}>
//               Login
//             </a>
//           </li>
//           <li>
//             <a href="#contact">Contact</a>
//           </li>
//         </ul>
//       </nav>

//       {/* Login Modal */}
//       {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
//     </>
//   );
// }
