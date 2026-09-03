import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { auth, applyActionCode } from '../../services/firebase';
import AuthLayout from '../../components/auth/AuthLayout';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, LogIn } from 'lucide-react';

/**
 * Universal Firebase Authentication Action Dispatcher.
 * Matches the official Google Firebase custom action URL specification:
 * https://<custom-domain>/__/auth/action?mode=<action>&oobCode=<code>
 * 
 * Supports:
 * - mode=verifyEmail       -> delegates to /verify-email
 * - mode=resetPassword     -> delegates to /reset-password
 * - mode=recoverEmail      -> processes email rollback
 * - fallback/unknown mode  -> friendly error with recovery actions
 */
export default function FirebaseAuthActionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [recoverStatus, setRecoverStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [recoverMessage, setRecoverMessage] = useState('');

  useEffect(() => {
    if (!mode) {
      setRecoverStatus('error');
      setRecoverMessage('Missing action mode parameter in authentication URL.');
      return;
    }

    // 1. Email Verification delegation
    if (mode === 'verifyEmail') {
      navigate(`/verify-email?${searchParams.toString()}`, { replace: true });
      return;
    }

    // 2. Password Reset delegation
    if (mode === 'resetPassword') {
      navigate(`/reset-password?${searchParams.toString()}`, { replace: true });
      return;
    }

    // 3. Email Recovery (reverting an unsolicited email change)
    if (mode === 'recoverEmail') {
      if (!oobCode) {
        setRecoverStatus('error');
        setRecoverMessage('Missing security code for email recovery.');
        return;
      }

      async function handleRecoverEmail() {
        try {
          await applyActionCode(auth, oobCode!);
          setRecoverStatus('success');
          setRecoverMessage('Your email address change has been reverted successfully.');
        } catch (err: any) {
          setRecoverStatus('error');
          setRecoverMessage(
            err.code === 'auth/invalid-action-code'
              ? 'This email recovery link is invalid or has already been used.'
              : err.code === 'auth/expired-action-code'
              ? 'This email recovery link has expired.'
              : 'Failed to recover email address. Please contact NutriCraft support.'
          );
        }
      }

      handleRecoverEmail();
      return;
    }

    // 4. Unknown/unsupported mode
    setRecoverStatus('error');
    setRecoverMessage(`The action mode "${mode}" is not recognized or supported.`);
  }, [mode, oobCode, searchParams, navigate]);

  if (mode === 'recoverEmail') {
    if (recoverStatus === 'processing') {
      return (
        <AuthLayout
          badge="Security Alert"
          title="Reverting Email Change"
          subtitle="Please wait while we restore your original account email address."
        >
          <div className="text-center py-10 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" />
            <p className="text-xs text-slate-500">Restoring account credentials with Firebase...</p>
          </div>
        </AuthLayout>
      );
    }

    if (recoverStatus === 'success') {
      return (
        <AuthLayout
          badge="Account Secured"
          title="Email Change Reverted"
          subtitle="Your original email address has been restored successfully."
        >
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-2">
              <p className="text-sm font-semibold text-slate-800">Your account is safe</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                We have restored your original email address. If you did not request the change, please reset your password immediately to protect your account.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <Link
                to="/forgot-password"
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Reset Account Password</span>
                <ArrowRight size={16} />
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

    return (
      <AuthLayout
        badge="Recovery Error"
        title="Could Not Revert Email"
        subtitle="The recovery link could not be processed."
      >
        <div className="text-center py-4 space-y-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={36} />
          </div>
          <p className="text-sm text-slate-600">{recoverMessage}</p>
          <Link
            to="/login"
            className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center justify-center gap-2"
          >
            <span>Return to Login</span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (recoverStatus === 'error') {
    return (
      <AuthLayout
        badge="Invalid Request"
        title="Authentication Action Error"
        subtitle="The provided authentication link is invalid or incomplete."
      >
        <div className="text-center py-4 space-y-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={36} />
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left">
            <p className="text-xs text-rose-700">{recoverMessage}</p>
          </div>
          <Link
            to="/login"
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors inline-flex items-center justify-center gap-2"
          >
            <LogIn size={15} />
            <span>Return to NutriCraft Login</span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="Routing"
      title="Processing Action"
      subtitle="Routing to the appropriate NutriCraft account management page..."
    >
      <div className="text-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" />
      </div>
    </AuthLayout>
  );
}
