
import React, { useState } from 'react';
import { AuthStage } from '../types';
import { api } from '../services/api';

interface AuthFormsProps {
  onSuccess: (user: any) => void;
}

const AuthForms: React.FC<AuthFormsProps> = ({ onSuccess }) => {
  const [stage, setStage] = useState<AuthStage>(AuthStage.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { email, password });
      setStage(AuthStage.VERIFY);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp, verifyingFor: 'signup' });
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      onSuccess(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-500 mb-4";
  const btnClasses = "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          {stage === AuthStage.LOGIN && "Welcome Back"}
          {stage === AuthStage.REGISTER && "Create Account"}
          {stage === AuthStage.VERIFY && "Verify Email"}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {stage === AuthStage.LOGIN && "Sign in to access your 3D workspace"}
          {stage === AuthStage.REGISTER && "Join the next generation of messaging"}
          {stage === AuthStage.VERIFY && `We sent a code to ${email}`}
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {stage === AuthStage.LOGIN && (
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="Email" 
              className={inputClasses} 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              className={inputClasses} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            <button type="submit" className={btnClasses} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
            <p className="text-center mt-6 text-sm text-gray-400">
              Don't have an account? <button type="button" onClick={() => setStage(AuthStage.REGISTER)} className="text-indigo-400 hover:underline">Register</button>
            </p>
          </form>
        )}

        {stage === AuthStage.REGISTER && (
          <form onSubmit={handleRegister}>
            <input 
              type="email" 
              placeholder="Email" 
              className={inputClasses} 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              className={inputClasses} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            <button type="submit" className={btnClasses} disabled={loading}>
              {loading ? 'Processing...' : 'Register'}
            </button>
            <p className="text-center mt-6 text-sm text-gray-400">
              Already have an account? <button type="button" onClick={() => setStage(AuthStage.LOGIN)} className="text-indigo-400 hover:underline">Login</button>
            </p>
          </form>
        )}

        {stage === AuthStage.VERIFY && (
          <form onSubmit={handleVerify}>
            <input 
              type="text" 
              placeholder="6-digit OTP" 
              className={inputClasses} 
              maxLength={6}
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              required 
            />
            <button type="submit" className={btnClasses} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Sign Up'}
            </button>
            <p className="text-center mt-6 text-sm text-gray-400">
              Wrong email? <button type="button" onClick={() => setStage(AuthStage.REGISTER)} className="text-indigo-400 hover:underline">Go Back</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForms;
