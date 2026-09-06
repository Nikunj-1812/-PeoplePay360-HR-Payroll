import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import PasswordRequirements from '../components/auth/PasswordRequirements';
import { validatePassword } from '../utils/passwordPolicy';
import api from '../api/client';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (!tokenParam) {
      setVerifying(false);
      setVerifyError('No reset token provided in URL.');
      return;
    }

    setToken(tokenParam);
    api
      .post('/auth/verify-reset-token', { token: tokenParam })
      .then((res) => {
        if (!isMounted) return;
        if (res && res.valid) {
          setTokenValid(true);
          setUserInfo({ email: res.email || res.user?.email || '' });
        } else {
          setVerifyError(res?.message || 'This password reset link is invalid or has expired.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        const errMsg = err.message || '';
        const status = err.status || err.response?.status;
        if (errMsg.toLowerCase().includes('network') || err.code === 'ERR_NETWORK') {
          setVerifyError('Unable to connect to PeoplePay360 backend service. Please check backend server deployment status.');
        } else if (status === 404 || status === 405) {
          setVerifyError(`Unable to reach password reset service (HTTP ${status}). Please try again or request a new reset link.`);
        } else if (status >= 500) {
          setVerifyError('The password reset service is temporarily unavailable. Please try again later.');
        } else {
          setVerifyError(errMsg || 'This password setup link is invalid or has expired.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setVerifying(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const passwordVal = validatePassword(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isFormValid = passwordVal.valid && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || !token) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword
      });

      if (res && res.success) {
        setSuccess(true);
      } else {
        setSubmitError(res?.message || 'Failed to set password.');
      }
    } catch (err) {
      setSubmitError(err.message || 'An error occurred while setting your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1931] flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#B3CFE5]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#B3CFE5]/10 border border-[#B3CFE5]/30 mb-3">
            <ShieldCheck className="w-8 h-8 text-[#B3CFE5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">PeoplePay360</h1>
          <p className="text-xs text-slate-400 mt-1">HR & Payroll Operations Platform</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          {verifying ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#B3CFE5] animate-spin mx-auto" />
              <p className="text-sm text-slate-300">Verifying secure setup link...</p>
            </div>
          ) : !tokenValid ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-rose-300">
                  {verifyError?.toLowerCase().includes('connect') || verifyError?.toLowerCase().includes('network')
                    ? 'Network Connection Error'
                    : verifyError?.toLowerCase().includes('unable to reach') || verifyError?.toLowerCase().includes('unavailable')
                    ? 'Service Unavailable'
                    : verifyError?.toLowerCase().includes('expired')
                    ? 'Link Expired'
                    : verifyError?.toLowerCase().includes('used')
                    ? 'Link Already Used'
                    : 'Link Invalid'}
                </h2>
                <p className="text-xs text-slate-400 mt-1 px-4">
                  {verifyError || 'This password setup link is invalid or has expired. Please request a new invitation from your HR Administrator.'}
                </p>
              </div>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors mt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Login
              </a>
            </div>
          ) : success ? (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-emerald-300">Password Set Successfully!</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Your new password is active. You can now log into PeoplePay360.
                </p>
              </div>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#B3CFE5] text-[#0A1931] text-sm font-semibold hover:bg-sky-200 transition-colors mt-4"
              >
                Proceed to Login
              </a>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-100">Set Account Password</h2>
                {userInfo && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Setting password for <span className="text-[#B3CFE5] font-medium">{userInfo.email}</span>
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-[#B3CFE5]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordRequirements password={newPassword} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={`w-full px-3 py-2 pr-10 rounded-lg bg-slate-950 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none ${
                        confirmPassword && !passwordsMatch
                          ? 'border-rose-500'
                          : 'border-slate-800 focus:border-[#B3CFE5]'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="mt-1 text-[11px] text-rose-400">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#B3CFE5] text-[#0A1931] font-semibold text-sm hover:bg-sky-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Set Password & Activate Account
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
