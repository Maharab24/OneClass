import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyOtp, resendOtp } from '../api/authApi';
import { useAuth } from '../../../common/context/AuthContext';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const passedEmail = location.state?.email || '';
  const role = location.state?.role || 'STUDENT';

  const [email, setEmail] = useState(passedEmail);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Auto-focus OTP input on mount
  useEffect(() => {
    const otpInput = document.querySelector('input[name="otpCode"]');
    if (otpInput) otpInput.focus();
  }, []);

  // Timer for resend button
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp({ email, otpCode });
      login(data);
      navigate(data.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      const data = await resendOtp({ email });
      setInfo(data.message || 'New verification code sent successfully!');
      setTimer(30);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtpCode(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate(role === 'TEACHER' ? '/teacher/register' : '/student/register')}
          className="mb-6 text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Verification Card */}
        <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl hover:shadow-${role === 'TEACHER' ? 'blue' : 'purple'}-500/5 transition-shadow duration-300`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-${role === 'TEACHER' ? 'blue' : 'purple'}-500/20 to-${role === 'TEACHER' ? 'blue' : 'purple'}-600/10 flex items-center justify-center border border-${role === 'TEACHER' ? 'blue' : 'purple'}-500/20`}>
              <svg className={`w-10 h-10 text-${role === 'TEACHER' ? 'blue' : 'purple'}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Verify Your Email</h2>
            <p className="text-gray-400 text-sm mt-2">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* OTP Code Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="otpCode"
                  value={otpCode}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-center text-2xl tracking-widest"
                  style={{ letterSpacing: '0.5em' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Error and Info Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-shake">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
            {info && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                <p className="text-green-400 text-sm text-center">{info}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 bg-gradient-to-r from-${role === 'TEACHER' ? 'blue' : 'purple'}-600 to-${role === 'TEACHER' ? 'blue' : 'purple'}-700 hover:from-${role === 'TEACHER' ? 'blue' : 'purple'}-700 hover:to-${role === 'TEACHER' ? 'blue' : 'purple'}-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-${role === 'TEACHER' ? 'blue' : 'purple'}-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900/50 text-gray-500">Didn't get the code?</span>
            </div>
          </div>

          {/* Resend Section */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email || !canResend}
              className={`${!canResend ? 'text-gray-500' : 'text-blue-400 hover:text-blue-300'} transition-colors font-medium text-sm disabled:cursor-not-allowed`}
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : canResend ? (
                'Resend Code'
              ) : (
                `Resend code in ${timer}s`
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Check your spam folder if you don't see the email
            </p>
          </div>

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-sm text-gray-400">
              Go back to{' '}
              <button
                type="button"
                onClick={() => navigate(role === 'TEACHER' ? '/teacher/login' : '/student/login')}
                className={`text-${role === 'TEACHER' ? 'blue' : 'purple'}-400 hover:text-${role === 'TEACHER' ? 'blue' : 'purple'}-300 font-medium transition-colors`}
              >
                Login
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Having trouble? Contact our support team
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}