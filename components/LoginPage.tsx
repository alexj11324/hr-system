
import React, { useState } from 'react';
import { BrandSymbol, BriefcaseIcon, UsersIcon, ArrowLeftIcon, RotateCwIcon } from './Icons';
import { ALLOWED_USERS } from '../constants';
import { supabase } from '../lib/supabase';
import { signInWithPasskey } from '../lib/auth';

interface LoginPageProps {
  onLogin: (user: string) => void;
  onGoToCareers?: () => void;
}

const HR_EMAIL = 'hr@cardioguard.com';
const HR_PASSWORD = 'cardioguard2026';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoToCareers }) => {
  const [step, setStep] = useState<'persona' | 'identity'>('persona');
  const [selectedUser, setSelectedUser] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setAuthError(null);
    try {
      // 1) Check for existing session
      const { data: sessionData } = await supabase.auth.getSession();
      const alreadySignedIn = !!sessionData.session?.user;

      if (!alreadySignedIn) {
        // 2) Attempt Silent HR Supabase sign-in
        const { error } = await supabase.auth.signInWithPassword({
          email: HR_EMAIL,
          password: HR_PASSWORD,
        });

        // If the HR account doesn't exist or credentials are wrong,
        // we log a warning but still allow the user to enter the dashboard
        // to view mock data, as this is a Sprint 1 MVP.
        if (error) {
          console.warn("Supabase HR Auth failed:", error.message);
          setAuthError(`Auth failed (${error.message}). Entering in Mock Mode.`);
          // Allow a brief moment for the user to see the "Mock Mode" message
          setTimeout(() => onLogin(selectedUser), 1500);
          return;
        }
      }

      // 3) Successfully authorized or already signed in
      onLogin(selectedUser);
    } catch (err: any) {
      console.error("Internal access error:", err);
      setAuthError("Unexpected error. Proceeding in Limited Mode.");
      setTimeout(() => onLogin(selectedUser), 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      if (!email) {
        setAuthError("Please enter your email address for passkey login.");
        setIsSubmitting(false);
        return;
      }

      const res = await signInWithPasskey(email);
      const user = res.user ?? res.session?.user;

      if (!user) throw new Error("Passkey authentication failed.");

      // Check if user is HR staff
      if (user.email === HR_EMAIL) {
        // Find matching user in ALLOWED_USERS or default to first user
        const matchedUser = ALLOWED_USERS[0]; // Default to first user for HR access
        onLogin(matchedUser);
      } else {
        setAuthError("Passkey authentication is for authorized HR personnel only.");
      }
    } catch (err: any) {
      console.error("Passkey auth error:", err);
      let friendlyError = err?.message ?? 'Passkey authentication failed.';
      if (friendlyError.toLowerCase().includes("webauthn is not supported")) {
        friendlyError = "Passkeys are not supported on this device or browser.";
      }
      setAuthError(friendlyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans selection:bg-red-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-10">
        <div className="flex flex-col items-center">
          <BrandSymbol className="h-20 w-20 shadow-2xl shadow-red-500/20 mb-8" />
          <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none text-center">
            Cardio<span className="text-red-600">Guard</span>
          </h2>
          <p className="mt-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
            Unified Recruitment Ecosystem
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-8 sm:px-12 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] border border-gray-100 overflow-hidden relative">

          {/* Persona Selection Step */}
          {step === 'persona' && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-6">Select Your Portal</h3>

                {/* Applicant Entry (Primary - Red) */}
                {onGoToCareers && (
                  <button
                    onClick={onGoToCareers}
                    className="w-full group flex items-center justify-between p-6 bg-red-600 rounded-[2rem] text-white hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <BriefcaseIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">I'm An Applicant</p>
                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Explore Open Roles</p>
                      </div>
                    </div>
                    <span className="text-xl font-light opacity-30 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                )}

                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Gateway</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Admin / HR Entry (Secondary - White) */}
                <button
                  onClick={() => setStep('identity')}
                  className="w-full group flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] text-gray-900 hover:border-red-600/30 hover:bg-gray-50 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">I'm Talent Recruitment</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Internal Dashboard</p>
                    </div>
                  </div>
                  <span className="text-xl font-light text-gray-200 group-hover:text-red-600 transition-colors">→</span>
                </button>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed text-center">
                  Access to internal systems is monitored. Unauthorized attempts are logged.
                </p>
              </div>
            </div>
          )}

          {/* Identity Selection Step */}
          {step === 'identity' && (
            <div className="space-y-8 animate-fade-in">
              <button
                onClick={() => setStep('persona')}
                className="group flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-[0.2em] transition-all"
                disabled={isSubmitting}
              >
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Selection
              </button>

              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">Internal Access</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identify yourself to continue</p>
              </div>

              {authError && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                   <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-tight">
                     {authError}
                   </p>
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-6">
                <div>
                  <label htmlFor="user" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Select Member
                  </label>
                  <div className="relative group">
                    <select
                      id="user"
                      name="user"
                      required
                      className="appearance-none block w-full px-6 py-5 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-red-600 outline-none bg-gray-50 transition-all cursor-pointer"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="" disabled>Search Team...</option>
                      {ALLOWED_USERS.map((user) => (
                        <option key={user} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-300">
                      <UsersIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <button
                    type="submit"
                    disabled={!selectedUser || isSubmitting}
                    className={`w-full flex justify-center py-5 border border-transparent rounded-[1.5rem] shadow-xl text-[10px] font-black uppercase tracking-widest text-white transition-all ${
                      (!selectedUser || isSubmitting)
                        ? 'bg-gray-200 cursor-not-allowed text-gray-400'
                        : 'bg-red-600 hover:bg-red-700 hover:scale-[1.02] shadow-red-500/20'
                    }`}
                  >
                    {isSubmitting ? 'Authorizing…' : 'Authorize Access'}
                  </button>
                </div>
              </form>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Or</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Email for Passkey Login
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-4 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none bg-gray-50 transition-all"
                    placeholder="hr@cardioguard.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-5 border border-gray-200 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-900 bg-white hover:bg-gray-50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <RotateCwIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    'Sign In with Passkey'
                  )}
                </button>
              </div>

              <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100/50">
                <p className="text-[9px] text-red-700 font-bold uppercase tracking-widest leading-relaxed text-center">
                  Restricted access. This identity is linked to specific CardioGuard acquisition permissions.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-12 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">
          &copy; 2024 Cardio Guard Inc. • Sprint 1 MVP
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
