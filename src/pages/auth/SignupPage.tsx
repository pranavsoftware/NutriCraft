import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleButton from '../../components/auth/GoogleButton';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  MailCheck,
  RefreshCw,
} from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, sendVerificationEmail } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Post-registration verification screen state
  const [verificationSent, setVerificationSent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Password validation criteria
  const passwordCriteria = [
    { label: 'At least 6 characters', valid: formData.password.length >= 6 },
    { label: 'Contains a number or symbol', valid: /[0-9!@#$%^&*]/.test(formData.password) },
    {
      label: 'Passwords match',
      valid: formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword,
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      // Show the verification link notification screen
      setVerificationSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      setErrorMessage(err.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResendLink = async () => {
    setIsResending(true);
    setResendSuccess('');
    try {
      const res = await sendVerificationEmail();
      setResendSuccess(res.message || 'A fresh verification link has been sent to your email!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not resend verification email. Please try again in a minute.');
    } finally {
      setIsResending(false);
    }
  };

  // 1. Verification Link Sent Confirmation View
  if (verificationSent) {
    return (
      <AuthLayout
        badge="Verification Dispatched"
        title="Check your inbox"
        subtitle="A verification link has been sent to your email address."
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <MailCheck className="w-8 h-8" />
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Verification sent to:
            </p>
            <p className="text-sm font-mono text-emerald-700 bg-white px-3 py-2 rounded-lg border border-slate-200 select-all break-all">
              {formData.email}
            </p>
            <p className="text-xs text-slate-500 pt-1 leading-relaxed">
              Click the verification link sent by Firebase to confirm ownership of your email address. You can also explore your dashboard right away!
            </p>
          </div>

          {resendSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl animate-in fade-in">
              {resendSuccess}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl animate-in fade-in">
              {errorMessage}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={handleResendLink}
              disabled={isResending}
              className="w-full py-2.5 px-4 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Resending link...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  <span>Resend Verification Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // 2. Main Registration Form View
  return (
    <AuthLayout
      badge="Join NutriCraft"
      title="Create your account"
      subtitle="Start your personalized nutrition journey and access expert-crafted meal planning."
    >
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Google Sign Up Button */}
      <div className="mb-6">
        <GoogleButton
          onClick={handleGoogleSignup}
          isLoading={isGoogleLoading}
          disabled={isLoading}
          text="Sign up with Google"
        />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-xs uppercase tracking-wider font-semibold text-slate-400 absolute">
          or register with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Full Name
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 z-10">
              <User size={18} />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sarah Jenkins"
              className="auth-input pl-12"
              required
              disabled={isLoading || isGoogleLoading}
            />
          </div>
        </div>

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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Password
          </label>
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

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 z-10">
              <Lock size={18} />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="auth-input pl-12 pr-12"
              required
              disabled={isLoading || isGoogleLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 flex items-center text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer z-10"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Password Strength Checklist */}
        {formData.password.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
            {passwordCriteria.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    c.valid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check size={10} strokeWidth={3} />
                </div>
                <span className={c.valid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Terms agreement notice */}
        <p className="text-xs text-slate-500 pt-1">
          By signing up, you will receive an official verification link from Firebase to activate your account.
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending verification link...</span>
            </>
          ) : (
            <>
              <span>Create Free Account</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
        Already have a NutriCraft account?{' '}
        <Link
          to="/login"
          className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Log In
        </Link>
      </div>
    </AuthLayout>
  );
}
