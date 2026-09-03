import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import {
  Lock, Eye, EyeOff, Check, ArrowRight, AlertCircle,
  Loader2, CheckCircle2, KeyRound, ShieldCheck, HelpCircle
} from 'lucide-react';

/**
 * Validates continueUrl to prevent Open Redirect vulnerabilities.
 */
function getSafeContinueUrl(rawUrl: string | null): string {
  if (!rawUrl) return '/login';

  if (rawUrl.startsWith('/') && !rawUrl.startsWith('//')) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    const trustedHosts = [
      'nutricraft.raybanpranav.tech',
      'localhost',
      '127.0.0.1',
    ];

    if (
      trustedHosts.includes(parsed.hostname) &&
      (parsed.protocol === 'https:' || parsed.protocol === 'http:')
    ) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    // Malformed URL, fall back to safe default
  }

  return '/login';
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPasswordResetCodeAction, resetPassword } = useAuth();

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const continueUrlParam = searchParams.get('continueUrl');

  // Legacy OTP parameters support
  const emailFromQuery = searchParams.get('email') || '';
  const otpFromQuery = searchParams.get('otp') || '';

  const [status, setStatus] = useState<'verifying' | 'form' | 'success' | 'error'>('verifying');
  const [verifiedEmail, setVerifiedEmail] = useState<string>(emailFromQuery);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Initial link and oobCode verification
  useEffect(() => {
    let isMounted = true;

    async function checkCode() {
      // Scenario A: Firebase oobCode link
      if (oobCode) {
        // Enforce mode === 'resetPassword' if mode param is provided
        if (mode && mode !== 'resetPassword') {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(`Invalid action mode "${mode}". Expected password reset mode.`);
          }
          return;
        }

        try {
          // Verify code via Firebase Client SDK
          const res = await verifyPasswordResetCodeAction(oobCode);
          if (isMounted) {
            setVerifiedEmail(res.email);
            setStatus('form');
          }
        } catch (err: any) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(err.message || 'This password reset link is invalid, expired, or has already been used.');
          }
        }
        return;
      }

      // Scenario B: Legacy email & OTP flow
      if (emailFromQuery && otpFromQuery) {
        if (isMounted) {
          setVerifiedEmail(emailFromQuery);
          setStatus('form');
        }
        return;
      }

      // Scenario C: No credentials provided
      if (isMounted) {
        setStatus('error');
        setErrorMessage('No password reset code was found in this link. Please request a new link.');
      }
    }

    checkCode();

    return () => {
      isMounted = false;
    };
  }, [mode, oobCode, emailFromQuery, otpFromQuery, verifyPasswordResetCodeAction]);

  const passwordCriteria = [
    { label: 'At least 6 characters', valid: newPassword.length >= 6 },
    { label: 'Passwords match', valid: confirmPassword.length > 0 && newPassword === confirmPassword },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword({
        email: verifiedEmail,
        oobCode: oobCode || undefined,
        otp: otpFromQuery || undefined,
        newPassword,
        confirmPassword,
      });

      setStatus('success');
      setSuccessMessage(res.message || 'Your password has been reset successfully. You can now log in.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToLogin = () => {
    const targetUrl = getSafeContinueUrl(continueUrlParam);
    navigate(targetUrl, {
      state: {
        message: 'Password reset successfully! You can now log in with your new password.',
        email: verifiedEmail,
      },
      replace: true,
    });
  };

  // VERIFYING STATE
  if (status === 'verifying') {
    return (
      <AuthLayout
        badge="Account Recovery"
        title="Validating Reset Link"
        subtitle="Please wait while we verify your password reset authorization."
      >
        <div className="text-center py-10 space-y-6">
          <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-3xl flex items-center justify-center mx-auto border border-green-500/20">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800 font-serif-display">
              Verifying Security Token...
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              NutriCraft is securely confirming your reset credentials with Firebase Authentication.
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // SUCCESS STATE
  if (status === 'success') {
    return (
      <AuthLayout
        badge="Password Updated"
        title="Password Reset Successful"
        subtitle="Your new credentials have been updated and are ready to use."
      >
        <div className="text-center py-4 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={36} />
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Account updated:
            </p>
            {verifiedEmail && (
              <p className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 break-all font-semibold">
                {verifiedEmail}
              </p>
            )}
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              Your password has been changed securely. You can now sign in to access your nutrition plans, meal logs, and diet insights.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleContinueToLogin}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Log In</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ERROR STATE
  if (status === 'error') {
    return (
      <AuthLayout
        badge="Reset Link Invalid"
        title="Password Reset Link Expired"
        subtitle="We could not validate your password reset request."
      >
        <div className="text-center py-4 space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
            <AlertCircle size={36} />
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-left space-y-2">
            <p className="text-sm font-semibold text-rose-900">
              Invalid or Expired Link
            </p>
            <p className="text-xs text-rose-700 leading-relaxed">
              {errorMessage || 'This password reset link is invalid, expired, or has already been used to change your password.'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/forgot-password"
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound size={16} />
              <span>Request New Password Reset Link</span>
            </Link>

            <Link
              to="/login"
              className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Return to Login</span>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // FORM STATE
  return (
    <AuthLayout
      badge="Set New Password"
      title="Create New Password"
      subtitle={
        verifiedEmail
          ? `Choose a strong, memorable password for ${verifiedEmail}.`
          : 'Choose a strong, memorable password for your NutriCraft account.'
      }
    >
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {verifiedEmail && (
        <div className="mb-6 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">
            Resetting password for: <strong className="font-mono">{verifiedEmail}</strong>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="••••••••"
              className="auth-input pl-10 pr-10"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="••••••••"
              className="auth-input pl-10 pr-10"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Password Strength Checklist */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs text-slate-600">
          <p className="font-semibold text-slate-700 mb-1">Password Requirements:</p>
          {passwordCriteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  c.valid ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
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

        <button
          type="submit"
          disabled={isSubmitting || newPassword.length < 6 || newPassword !== confirmPassword}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving New Password...</span>
            </>
          ) : (
            <>
              <span>Save & Update Password</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
