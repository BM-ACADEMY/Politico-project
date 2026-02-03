// src/Modules/Auth/ForgotPassword.jsx
import { Mail, ArrowLeft, Loader2, Key, Lock, CheckCircle } from "lucide-react";
import { useContext, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ForgotPassword = () => {
  const { forgotPassword, verifyOtp, resetPassword } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword({ email });
      setStep(2);
    } catch (err) {
      // Errors handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyOtp({ email, otp });
      setStep(3);
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword({ email, newPassword });
      // Success, redirect to login
      window.location.href = "/login";
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => setStep(step - 1);

  if (step === 2) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 md:p-10 bg-cover bg-center">
        <form 
          className="max-w-md w-full text-center border border-gray-300/60 rounded-2xl px-8 py-8 bg-white shadow-lg relative"
          onSubmit={handleOtpSubmit}
        >
          <Link 
            to="/login" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 hover:underline text-sm absolute left-4 top-4 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </Link>
          <div className="mt-8 space-y-4">
            <h1 className="text-gray-900 text-3xl font-medium">Enter OTP</h1>
            <p className="text-gray-500 text-sm">
              We've sent a 6-digit OTP to <strong className="text-gray-700">{email}</strong>.
            </p>
            <div className="flex items-center justify-center w-full bg-white border border-gray-300/80 h-14 rounded-full overflow-hidden">
              <Key size={20} className="text-gray-500 ml-4" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="bg-transparent text-gray-700 placeholder-gray-400 outline-none text-lg font-medium w-full h-full text-center tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center px-4 py-2 bg-red-50 rounded-lg">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-12 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium text-sm shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="text-indigo-600 hover:text-indigo-500 hover:underline text-sm transition-colors flex items-center justify-center w-full"
            >
              <ArrowLeft size={14} className="mr-1" />
              Back to email
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 md:p-10 bg-cover bg-center">
        <form 
          className="max-w-md w-full text-center border border-gray-300/60 rounded-2xl px-8 py-8 bg-white shadow-lg relative"
          onSubmit={handlePasswordSubmit}
        >
          <Link 
            to="/login" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 hover:underline text-sm absolute left-4 top-4 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </Link>
          <div className="mt-8 space-y-6">
            <div className="flex flex-col items-center">
              <CheckCircle size={48} className="text-green-500 mb-4" />
              <h1 className="text-gray-900 text-3xl font-medium">Reset Password</h1>
              <p className="text-gray-500 text-sm mt-2">Enter your new password.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center w-full bg-white border border-gray-300/80 h-14 rounded-full overflow-hidden">
                <Lock size={20} className="text-gray-500 ml-4" />
                <input
                  type="password"
                  placeholder="New Password"
                  className="bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm w-full h-full px-4"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center w-full bg-white border border-gray-300/80 h-14 rounded-full overflow-hidden">
                <Lock size={20} className="text-gray-500 ml-4" />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  className="bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm w-full h-full px-4"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center px-4 py-2 bg-red-50 rounded-lg">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium text-sm shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="text-indigo-600 hover:text-indigo-500 hover:underline text-sm transition-colors flex items-center justify-center w-full"
            >
              <ArrowLeft size={14} className="mr-1" />
              Back to OTP
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 md:p-10 bg-cover bg-center">
      <form
        className="max-w-md w-full text-center border border-gray-300/60 rounded-2xl px-8 py-8 bg-white shadow-lg relative"
        onSubmit={handleEmailSubmit}
      >
        <Link 
          to="/login" 
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500 hover:underline text-sm absolute left-4 top-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to login
        </Link>

        <div className="mt-8 space-y-6">
          <h1 className="text-gray-900 text-3xl font-medium">Forgot password?</h1>
          <p className="text-gray-500 text-sm">Enter your email to receive an OTP.</p>

          <div className="flex items-center w-full bg-white border border-gray-300/80 h-14 rounded-full overflow-hidden">
            <Mail size={20} className="text-gray-500 ml-4" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm w-full h-full px-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center px-4 py-2 bg-red-50 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium text-sm shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;