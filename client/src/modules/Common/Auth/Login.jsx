// src/Modules/Auth/Login.jsx
import { Mail, Lock, Loader2 } from "lucide-react";
import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
// import loginImage from "@/assets/img/politicobg.png";
// import logo from "@/assets/img/Bmlogo.png";

const Login = () => {
  const { login } = useContext(AuthContext);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEmail = emailOrPhone.includes("@");
      const credentials = {
        [isEmail ? "email" : "phone"]: emailOrPhone,
        password,
      };
      await login(credentials);
    } catch (err) {
      // Errors are already toasted in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6 md:p-10 bg-cover bg-center"
     
    >
      <form
        className="max-w-96 w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white shadow-lg"
        onSubmit={handleSubmit}
      >
        {/* <img src={logo} alt="Logo" className="h-12 mx-auto mt-6" /> */}

        <h1 className="text-gray-900 text-3xl mt-6 font-medium">Welcome back</h1>
        <p className="text-gray-500 text-sm mt-2">Login to Politico account</p>

        {/* Email / Phone */}
        <div className="flex items-center w-full mt-10 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <Mail size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Email or Phone"
            className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-full"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        {/* Password */}
        <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <Lock size={16} className="text-gray-500" />
          <input
            type="password"
            placeholder="Password"
            className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {/* <div className="mt-5 text-left">
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
            Forgot password?
          </Link>
        </div> */}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 mb-5 w-full h-11 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>

        <div className="text-[#3b3b3b] text-center text-xs mt-4 mb-6">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-indigo-600">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-indigo-600">
            Privacy Policy
          </a>
          .
        </div>
      </form>
    </div>
  );
};

export default Login;