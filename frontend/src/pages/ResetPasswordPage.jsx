import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft, Loader2, KeyRound, Mail } from 'lucide-react';
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
    let tokenParam = params.get('token');
    if (!tokenParam && window.location.hash.includes('token=')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      tokenParam = hashParams.get('token');
    }

    if (!tokenParam) {
      setVerifying(false);
      setVerifyError('No password reset token was found in the URL. Please verify your invitation or reset link.');
      return;
    }

    setToken(tokenParam);
    api
      .post('/auth/verify-reset-token', { token: tokenParam })
      .then((res) => {
        if (!isMounted) return;
        if (res && res.valid) {
          setTokenValid(true);
          setUserInfo(res.user || { email: res.email, name: res.name });
        } else {
          setVerifyError(res?.message || 'This password setup link is invalid or has expired.');
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
        setSubmitError(res?.message || 'Failed to update password.');
      }
    } catch (err) {
      setSubmitError(err.message || 'An error occurred while setting your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0A1931',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Background glow accents */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '384px',
          height: '384px',
          backgroundColor: 'rgba(179, 207, 229, 0.08)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          width: '288px',
          height: '288px',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ maxWidth: '440px', width: '100%', zIndex: 10 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(179, 207, 229, 0.1)',
              border: '1px solid rgba(179, 207, 229, 0.3)',
              marginBottom: '12px'
            }}
          >
            <ShieldCheck style={{ width: '32px', height: '32px', color: '#B3CFE5' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', tracking: '-0.025em', color: '#F6FAFD', margin: 0 }}>
            PeoplePay360
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px', margin: 0 }}>
            HR & Payroll Operations Platform
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#102744',
            border: '1px solid rgba(179, 207, 229, 0.2)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(16px)'
          }}
        >
          {verifying ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <Loader2
                style={{
                  width: '32px',
                  height: '32px',
                  color: '#B3CFE5',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px auto'
                }}
              />
              <p style={{ fontSize: '14px', color: '#CBD5E1', margin: 0 }}>Verifying secure setup link...</p>
            </div>
          ) : !tokenValid ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#F87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <AlertTriangle style={{ width: '24px', height: '24px' }} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#FCA5A5', margin: '0 0 8px 0' }}>
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
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 20px 0', padding: '0 16px', lineHeight: '1.5' }}>
                {verifyError || 'This password setup link is invalid or has expired. Please request a new invitation from your HR Administrator.'}
              </p>
              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#E2E8F0',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                Return to Login
              </a>
            </div>
          ) : success ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <CheckCircle2 style={{ width: '56px', height: '56px', color: '#34D399', margin: '0 auto 16px auto' }} />
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#A7F3D0', margin: '0 0 8px 0' }}>
                Password Updated Successfully!
              </h2>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 24px 0' }}>
                Your new password is active. You can now log into PeoplePay360.
              </p>
              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#B3CFE5',
                  color: '#0A1931',
                  fontSize: '14px',
                  fontWeight: '700',
                  textDecoration: 'none'
                }}
              >
                Proceed to Login
              </a>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <KeyRound style={{ width: '20px', height: '20px', color: '#B3CFE5' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F6FAFD', margin: 0 }}>
                    Set Account Password
                  </h2>
                </div>
                {userInfo && userInfo.email && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(179, 207, 229, 0.1)',
                      border: '1px solid rgba(179, 207, 229, 0.2)',
                      fontSize: '12px',
                      color: '#B3CFE5',
                      fontWeight: '500',
                      marginTop: '6px'
                    }}
                  >
                    <Mail style={{ width: '13px', height: '13px' }} />
                    Resetting for {userInfo.email}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {submitError && (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#FCA5A5',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {submitError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#0A1931',
                        border: '1px solid rgba(179, 207, 229, 0.25)',
                        color: '#F6FAFD',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {showNew ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>
                  <PasswordRequirements password={newPassword} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#0A1931',
                        border: confirmPassword && !passwordsMatch
                          ? '1px solid #EF4444'
                          : confirmPassword && passwordsMatch
                          ? '1px solid #10B981'
                          : '1px solid rgba(179, 207, 229, 0.25)',
                        color: '#F6FAFD',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {showConfirm ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>

                  {confirmPassword ? (
                    passwordsMatch ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10B981', marginTop: '6px', fontWeight: '500' }}>
                        <CheckCircle2 style={{ width: '14px', height: '14px' }} /> Passwords match
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#EF4444', marginTop: '6px', fontWeight: '500' }}>
                        <AlertTriangle style={{ width: '14px', height: '14px' }} /> Passwords do not match
                      </div>
                    )
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#B3CFE5',
                    color: '#0A1931',
                    fontWeight: '700',
                    fontSize: '14px',
                    border: 'none',
                    cursor: !isFormValid || submitting ? 'not-allowed' : 'pointer',
                    opacity: !isFormValid || submitting ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      Saving Password...
                    </>
                  ) : (
                    <>
                      <Lock style={{ width: '16px', height: '16px' }} />
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
