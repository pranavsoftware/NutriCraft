import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleButton from '../../components/auth/GoogleButton';
import { auth } from '../../services/firebase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, sendVerificationEmail, checkAuth } = useAuth();

  const successMessageFromRedirect = location.state?.message;

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Email verification required state
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [isCheckingVerified, setIsCheckingVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [cachedLoginResult, setCachedLoginResult] = useState<any>(null);

  // Cooldown countdown
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setResendSuccess('');

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      // Check if user's email is unverified
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        setCachedLoginResult(result);
        setVerificationRequired(true);
        setIsLoading(false);
        return;
      }

      // If user profile is already completed, go to dashboard; otherwise, go to profile setup
      if (result?.user?.isProfileComplete) {
        navigate('/dashboard');
      } else {
        navigate('/dashboard/profile', { state: { profileSetupRequired: true } });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccess('');
    setErrorMessage('');

    try {
      await sendVerificationEmail();
      setResendSuccess('A fresh verification link has been sent to your email!');
      setCooldown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send verification email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerified = async () => {
    setIsCheckingVerified(true);
    setErrorMessage('');

    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setVerificationRequired(false);
          await checkAuth();

          if (cachedLoginResult?.user?.isProfileComplete) {
            navigate('/dashboard');
          } else {
            navigate('/dashboard/profile', { state: { profileSetupRequired: true } });
          }
          return;
        }
      }
      setErrorMessage('Email not yet verified. Please click the verification link in your inbox, then click here.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not check verification status. Please try again.');
    } finally {
      setIsCheckingVerified(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.user?.isProfileComplete) {
        navigate('/dashboard');
      } else {
        navigate('/dashboard/profile', { state: { profileSetupRequired: true } });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (verificationRequired) {
    return (
      <AuthLayout
        badge="Verification Required"
        title="Email verification required"
        subtitle="Please verify your email before continuing to NutriCraft."
      >
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Mail className="w-8 h-8" />
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Email verification required:
            </p>
            <p className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 break-all font-semibold">
              {formData.email}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              Please click the verification link sent to your email to verify your address, then click the button below.
            </p>
          </div>

          {resendSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>{resendSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleCheckVerified}
              disabled={isCheckingVerified}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCheckingVerified ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Checking verification status...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>I've Verified My Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={cooldown > 0 || isResending}
              className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isResending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending verification email...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Resend available in {cooldown}s</span>
              ) : (
                <>
                  <Mail size={14} />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setVerificationRequired(false)}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              Back to regular login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="Welcome Back"
      title="Log in to NutriCraft"
      subtitle="Enter your credentials or use your Google account to access your personalized nutrition insights."
    >
      {successMessageFromRedirect && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{successMessageFromRedirect}</div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Google Sign In Button */}
      <div className="mb-6">
        <GoogleButton
          onClick={handleGoogleLogin}
          isLoading={isGoogleLoading}
          disabled={isLoading}
          text="Sign in with Google"
        />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-xs uppercase tracking-wider font-semibold text-slate-400 absolute">
          or continue with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 z-10">
              <Mail size={18} />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="auth-input pl-12"
              required
              disabled={isLoading || isGoogleLoading}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 z-10">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="auth-input pl-12 pr-12"
              required
              disabled={isLoading || isGoogleLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 flex items-center text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer z-10"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember me option */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>Keep me logged in on this device</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Log In</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
        Don't have a NutriCraft account yet?{' '}
        <Link
          to="/signup"
          className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Create an Account
        </Link>
      </div>
    </AuthLayout>
  );
}
