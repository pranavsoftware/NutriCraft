import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import { ShieldCheck, Mail, ArrowRight, RotateCw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function OtpVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const emailFromQuery = queryParams.get('email') || '';
  const typeFromQuery = (queryParams.get('type') || 'signup') as 'signup' | 'forgot-password';

  const [email, setEmail] = useState(emailFromQuery);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(location.state?.message || '');
  const [successMessage, setSuccessMessage] = useState('');
  
  // 60-second cooldown timer for resending OTP
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [cooldown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/[^0-9]/g, '');

    if (!cleanValue) {
      const newOtp = [...otpValues];
      newOtp[index] = '';
      setOtpValues(newOtp);
      return;
    }

    // Single digit input
    const newOtp = [...otpValues];
    newOtp[index] = cleanValue.slice(-1);
    setOtpValues(newOtp);

    // Auto advance to next box
    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      // Move to previous box on backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otpValues];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtpValues(newOtp);

      const nextFocus = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const fullOtp = otpValues.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      if (typeFromQuery === 'forgot-password') {
        // Navigate to reset password page with email and OTP
        navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(fullOtp)}`);
      } else {
        // Signup verification -> activate account & auto login
        await verifyOtp(email, fullOtp);
        navigate('/dashboard', {
          state: { welcomeMessage: 'Account activated successfully! Welcome to NutriCraft.' },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await resendOtp(email, typeFromQuery);
      setSuccessMessage(res.message || 'A new verification code has been dispatched to your email.');
      setCooldown(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Security Verification"
      title="Enter Verification Code"
      subtitle={`We have sent a 6-digit code to your email. Enter it below to confirm your identity.`}
    >
      {/* Email Indicator Card */}
      <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600 truncate mr-2">
          <Mail size={16} className="text-green-600 shrink-0" />
          <span className="truncate">Sent to: <strong className="text-slate-900">{email}</strong></span>
        </div>
        <Link to="/login" className="text-green-600 hover:underline font-semibold shrink-0">
          Change
        </Link>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 6-Digit Auto-Advancing Input Boxes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3 text-center">
            6-Digit Security Code
          </label>
          
          <div className="flex justify-between items-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otpValues.map((val, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={val}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="otp-box flex-1 max-w-[52px]"
                disabled={isLoading}
                autoComplete="one-time-code"
              />
            ))}
          </div>
        </div>

        {/* Submit Verification Button */}
        <button
          type="submit"
          disabled={isLoading || fullOtp.length !== 6}
          className="w-full py-3 px-6 rounded-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium text-sm transition-all shadow-md shadow-green-600/20 hover:shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying code...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>Verify & Continue</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Resend OTP Section with Cooldown Timer */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 mb-2">Didn't receive the email? Check your spam folder or resend.</p>
        {canResend ? (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isLoading}
            className="text-sm font-semibold text-green-600 hover:text-green-700 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Resend Verification Code</span>
          </button>
        ) : (
          <div className="text-xs font-medium text-slate-400 inline-flex items-center gap-1.5">
            <RotateCw size={14} />
            <span>Resend code in <strong>{cooldown}s</strong></span>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
