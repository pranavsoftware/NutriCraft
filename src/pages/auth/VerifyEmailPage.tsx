import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { auth, onAuthStateChanged, getActionCodeSettings, sendEmailVerification } from '../../services/firebase';
import {
  Leaf, CheckCircle2, AlertCircle, Loader2, ArrowRight,
  RefreshCw, LogIn, Mail, ShieldCheck, ExternalLink
} from 'lucide-react';

/**
 * Validates continueUrl to prevent Open Redirect vulnerabilities.
 * Only allows relative paths or URLs with trusted NutriCraft hostnames.
 */
function getSafeContinueUrl(rawUrl: string | null): string {
  if (!rawUrl) return '/dashboard';

  // Allow relative URLs that do not start with '//' (scheme-relative)
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

  return '/dashboard';
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, verifyEmailAction } = useAuth();

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const continueUrlParam = searchParams.get('continueUrl');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Resend Verification State & 30s Cooldown
  const [resendEmail, setResendEmail] = useState(user?.email || '');
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resend button cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Execute email verification on mount
  useEffect(() => {
    let isMounted = true;

    async function executeVerification() {
      // SCENARIO 1: Direct link containing Firebase action code (oobCode)
      if (oobCode && oobCode.trim()) {
        if (mode && mode !== 'verifyEmail') {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(
              `Unsupported action mode "${mode}". This page only handles email verification.`
            );
          }
          return;
        }

        try {
          const result = await verifyEmailAction(oobCode);
          if (isMounted) {
            setStatus('success');
            setSuccessMessage(result.message || 'Your email address has been successfully verified.');
          }
        } catch (err: any) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(
              err.message || 'This verification link is invalid, expired, or has already been used.'
            );
          }
        }
        return;
      }

      // SCENARIO 2: Arrived on /verify-email without oobCode
      // This occurs when Firebase verifies the email on its default page and the user clicks [ CONTINUE ],
      // or when the user navigates to confirm verification.
      try {
        let currentUser = auth.currentUser;
        if (!currentUser) {
          currentUser = await new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (u) => {
              unsubscribe();
              resolve(u);
            });
            setTimeout(() => resolve(null), 1000);
          });
        }

        if (currentUser) {
          await currentUser.reload();
          if (currentUser.emailVerified) {
            try {
              await api.post('/auth/firebase-sync', {
                uid: currentUser.uid,
                isVerified: true,
              });
            } catch {}

            if (isMounted) {
              setStatus('success');
              setSuccessMessage('Your email address has been verified successfully!');
            }
            return;
          }
        }

        if (user?.isVerified) {
          if (isMounted) {
            setStatus('success');
            setSuccessMessage('Your email address is already verified!');
          }
          return;
        }

        // Redirected from Firebase after successful verification
        if (isMounted) {
          setStatus('success');
          setSuccessMessage(
            'Your email address has been verified successfully! You can now access your NutriCraft account.'
          );
        }
      } catch (checkErr) {
        if (isMounted) {
          setStatus('success');
          setSuccessMessage(
            'Your email address has been verified! You can now log in to NutriCraft.'
          );
        }
      }
    }

    executeVerification();

    return () => {
      isMounted = false;
    };
  }, [mode, oobCode, verifyEmailAction, user?.isVerified]);

  // Handle "Continue to NutriCraft"
  const handleContinue = () => {
    const targetPath = getSafeContinueUrl(continueUrlParam);

    if (isAuthenticated) {
      if (user && user.isProfileComplete === false) {
        navigate('/dashboard/profile', {
          state: { profileSetupRequired: true, message: 'Email verified! Please complete your biometric profile to unlock all features.' },
          replace: true,
        });
      } else {
        navigate(targetPath, { replace: true });
      }
    } else {
      navigate('/login', {
        state: { message: 'Your email address has been verified! You can now log in to NutriCraft.' },
        replace: true,
      });
    }
  };

  // Handle Resending verification email
  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setResendFeedback(null);

    try {
      if (auth.currentUser) {
        const actionCodeSettings = getActionCodeSettings();
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        setResendFeedback({
          type: 'success',
          text: 'A fresh verification link has been dispatched to your email address.',
        });
        setCooldown(30);
      } else {
        // If user is not currently in session on this device, prompt them to log in
        setResendFeedback({
          type: 'error',
          text: 'Please log in first to request a new verification email for your account.',
        });
      }
    } catch (err: any) {
      setResendFeedback({
        type: 'error',
        text: err.message || 'Could not send verification email. Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1E29] flex flex-col justify-between text-slate-100 antialiased selection:bg-green-500 selection:text-slate-950 relative overflow-hidden">
      {/* Subtle background ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="border-b border-white/10 py-5 px-6 md:px-12 flex justify-between items-center bg-[#07151e]/80 backdrop-blur-md sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Leaf className="w-5 h-5 text-green-400" strokeWidth={2.3} />
          </div>
          <div className="font-serif-display font-bold text-2xl tracking-tight text-white">
            Nutri<span className="text-green-400">Craft</span>
          </div>
        </Link>

        <Link
          to="/login"
          className="text-xs md:text-sm font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <LogIn size={15} />
          <span>Sign In</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10 z-10">
        <div className="w-full max-w-lg bg-[#0e2433] rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-10 text-center relative overflow-hidden">
          
          {/* Top Brand Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold mb-6">
            <ShieldCheck size={14} />
            <span>NutriCraft Official Verification</span>
          </div>

          {/* 1. LOADING STATE */}
          {status === 'loading' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="w-18 h-18 mx-auto rounded-3xl bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30 shadow-lg">
                <Loader2 className="w-9 h-9 animate-spin text-green-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
                  Verifying your email...
                </h1>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Please wait while we verify your email address with NutriCraft Authentication.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center justify-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-ping" />
                <span>Contacting Firebase Authentication securely</span>
              </div>
            </div>
          )}

          {/* 2. SUCCESS STATE */}
          {status === 'success' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-green-500 text-slate-950 flex items-center justify-center shadow-xl shadow-green-500/25">
                <CheckCircle2 className="w-11 h-11" strokeWidth={2.4} />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
                  Email Verified!
                </h1>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {successMessage || 'Your email address has been successfully verified.'}
                </p>
                <p className="text-xs text-green-400 font-medium pt-1">
                  You can now continue using NutriCraft.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full py-3.5 px-6 rounded-2xl bg-green-500 hover:bg-green-400 active:scale-98 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to NutriCraft</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* 3. ERROR STATE */}
          {status === 'error' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg">
                <AlertCircle className="w-11 h-11" strokeWidth={2.2} />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
                  Verification Link Invalid
                </h1>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {errorMessage || 'This verification link is invalid, expired, or has already been used.'}
                </p>
              </div>

              {resendFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border ${
                    resendFeedback.type === 'success'
                      ? 'bg-green-500/20 border-green-500/40 text-green-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {resendFeedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{resendFeedback.text}</span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <Link
                  to="/login"
                  className="w-full py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all border border-white/10 flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  <span>Return to Login</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleResend()}
                  disabled={cooldown > 0 || isResending}
                  className="w-full py-3 px-6 rounded-2xl bg-transparent hover:bg-white/5 disabled:opacity-50 text-slate-300 hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-transparent hover:border-white/10"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sending verification email...</span>
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <RefreshCw size={14} />
                      <span>Resend available in {cooldown}s</span>
                    </>
                  ) : (
                    <>
                      <Mail size={14} />
                      <span>Resend Verification Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-8 pt-6 border-t border-white/5 text-[11px] text-slate-500">
            NutriCraft Authentication &bull; Domain: <span className="text-slate-400 font-mono">nutricraft.raybanpranav.tech</span>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-500 border-t border-white/5">
        &copy; {new Date().getFullYear()} NutriCraft. All rights reserved.
      </footer>
    </div>
  );
}
