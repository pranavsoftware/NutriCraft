import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState('');

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setResendSuccess('');

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
      setCooldown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send password reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    setErrorMessage('');
    setResendSuccess('');
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setResendSuccess('A fresh password reset link has been dispatched to your email.');
      setCooldown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Account Recovery"
      title="Reset your password"
      subtitle={
        isSubmitted
          ? "We've sent a secure password reset link to your email address."
          : "Enter the email address associated with your NutriCraft account to receive an official password reset link."
      }
    >
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {isSubmitted ? (
        <div className="text-center py-2 space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={36} />
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Reset link dispatched to:
            </p>
            <p className="text-sm font-mono text-emerald-700 bg-white px-3 py-2 rounded-lg border border-slate-200 select-all break-all">
              {email}
            </p>
            <p className="text-xs text-slate-500 pt-1 leading-relaxed">
              Open the password reset link from Firebase in your email to choose a new password. If you do not see it within a couple of minutes, check your spam or promotions folder.
            </p>
          </div>

          {resendSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>{resendSuccess}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Link
              to="/login"
              className="w-full py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to Log In</span>
              <ArrowRight size={16} />
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className="w-full py-2.5 px-6 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Dispatching link...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Resend available in {cooldown}s</span>
              ) : (
                <>
                  <Mail size={14} />
                  <span>Resend Password Reset Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>You will receive an official password reset link directly from Firebase.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Registered Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="you@example.com"
                className="auth-input pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending reset link...</span>
              </>
            ) : (
              <>
                <span>Send Password Reset Link</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-slate-600 hover:text-emerald-600 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Log In</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
