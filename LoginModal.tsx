"use client";

import styles from "./LoginModal.module.css";
import { login, signup } from "@/app/login/actions";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <h2>Login</h2>

        <form className={styles.form}>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            required
          />
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <div className={styles.buttonGroup}>
            <button formAction={login}>Login</button>
            <button formAction={signup}>Sign Up</button>
          </div>
        </form>
      </div>
    </div>
  );
}





// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import styles from "./LoginModal.module.css";

// interface LoginModalProps {
//   onClose: () => void;
// }

// interface FormData {
//   email: string;
//   password: string;
// }

// export default function LoginModal({ onClose }: LoginModalProps) {
//   const [formData, setFormData] = useState<FormData>({
//     email: "",
//     password: "",
//   });
//   const router = useRouter();

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     console.log("Login info:", formData);
//     onClose();
//     router.push("/user-dashboard");
//   };

//   return (
//     <div className={styles.modalOverlay}>
//       <div className={styles.modalContent}>
//         <button className={styles.closeBtn} onClick={onClose}>
//           ×
//         </button>

//         <h2>Login</h2>

//         <form onSubmit={handleLogin}>
//           <input
//             type="email"
//             name="email"
//             placeholder="email"
//             value={formData.email}
//             onChange={handleChange}
//             required
//           />
//           <input
//             type="password"
//             name="password"
//             placeholder="Password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//           />
//           <button type="submit">Login</button>
//         </form>

//         <p className={styles.toggleText}>
//           Don't have an account?{" "}
//           <span
//             onClick={() => {
//               onClose();
//               router.push("/signup");
//             }}
//           >
//             Sign Up
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// }
