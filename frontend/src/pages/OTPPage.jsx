// src/pages/OTPPage.jsx - Email OTP verification
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OTPPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // userId passed from signup/login page via router state
  const userId = location.state?.userId;

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Invalid page. Please sign up first.</p>
      </div>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { userId, otp });
      login(res.data.token, res.data.user);
      navigate('/profile/edit'); // Go to profile setup after verification
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await api.post('/auth/resend-otp', { userId });
      setSuccess('New OTP sent to your email!');
    } catch (err) {
      setError('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-ocean-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="card p-8 animate-fade-in text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-slate-800">Check your email</h1>
          <p className="text-slate-500 text-sm mt-2 mb-8">
            We've sent a 6-digit verification code to your email. Enter it below.
          </p>

          {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">{success}</div>}

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              className="input-field text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
            />
            <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <button onClick={handleResend} className="mt-4 text-sm text-ocean-600 hover:underline">
            Didn't receive it? Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
}
