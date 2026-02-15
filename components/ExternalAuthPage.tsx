
import React, { useState } from 'react';
import { supabase } from "../lib/supabase";
import { BrandSymbol, RotateCwIcon } from './Icons';
import { ApplicantAccount } from '../types';
import { signInWithEmail, signUpWithEmail, signInWithPasskey } from '../lib/auth';

interface ExternalAuthPageProps {
  onLogin: (account: ApplicantAccount) => void;
  onBack: () => void;
}

const ExternalAuthPage: React.FC<ExternalAuthPageProps> = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const handleAuthSuccess = async (user: any) => {
    // Fetch profile data to provide a complete account object to the parent
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.warn("Profile not found, creating a minimal one...");
      const { data: newProfile } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        role: "applicant",
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone
      }).select().single();
      
      const loggedInAccount: ApplicantAccount = {
        id: user.id,
        email: user.email ?? formData.email,
        firstName: newProfile?.first_name ?? formData.firstName ?? '',
        lastName: newProfile?.last_name ?? formData.lastName ?? '',
        phone: newProfile?.phone ?? formData.phone ?? '',
        createdAt: newProfile?.created_at ?? new Date().toISOString()
      };
      onLogin(loggedInAccount);
      return;
    }

    const loggedInAccount: ApplicantAccount = {
      id: user.id,
      email: user.email ?? formData.email,
      firstName: profile?.first_name ?? '',
      lastName: profile?.last_name ?? '',
      phone: profile?.phone ?? '',
      createdAt: profile?.created_at ?? new Date().toISOString()
    };

    onLogin(loggedInAccount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMsg("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const res = await signUpWithEmail(formData.email, formData.password);
        const user = res.user ?? res.session?.user;

        if (user) {
          // Create/Update the profile entry in Supabase
          await supabase.from("profiles").upsert({
            id: user.id,
            email: formData.email,
            role: "applicant",
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          });

          // If session is returned, we can log them in immediately (auto-confirm is ON)
          if (res.session) {
             await handleAuthSuccess(user);
             return;
          } else {
             // Email confirmation is required
             alert("Account created! Please check your email to verify your account before signing in.");
             setMode("login");
          }
        }
      } else {
        // Handle Login
        const res = await signInWithEmail(formData.email, formData.password);
        const user = res.user ?? res.session?.user;

        if (!user) throw new Error("Authentication failed: User profile not found.");
        await handleAuthSuccess(user);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let friendlyError = err?.message ?? 'Authentication failed. Please check your credentials.';
      
      if (friendlyError.toLowerCase().includes("invalid login credentials")) {
        friendlyError = "Invalid email or password. If you haven't joined yet, please sign up.";
      } else if (friendlyError.toLowerCase().includes("email not confirmed")) {
        friendlyError = "Please confirm your email address before signing in.";
      }
      
      setErrorMsg(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (!formData.email) {
        setErrorMsg("Please enter your email address for passkey login.");
        setIsLoading(false);
        return;
      }

      const res = await signInWithPasskey(formData.email);
      const user = res.user ?? res.session?.user;

      if (!user) throw new Error("Passkey authentication failed.");
      await handleAuthSuccess(user);
    } catch (err: any) {
      console.error("Passkey auth error:", err);
      let friendlyError = err?.message ?? 'Passkey authentication failed.';
       if (friendlyError.toLowerCase().includes("webauthn is not supported")) {
        friendlyError = "Passkeys are not supported on this device or browser.";
      }
      setErrorMsg(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-red-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <button 
            onClick={onBack} 
            className="mb-8 group flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest transition-all"
          >
            ← Back to Jobs
          </button>
          <BrandSymbol className="h-16 w-16 shadow-2xl shadow-red-500/20 mb-6" />
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            {mode === 'login' ? 'Welcome Back' : 'Join the Team'}
          </h2>
          <p className="mt-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose max-w-[280px]">
            {mode === 'login' ? 'Sign in to manage your applications' : 'Create an account to apply and track your status'}
          </p>
        </div>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-10 px-6 sm:px-10 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100">
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
               <p className="text-[10px] font-black text-red-600 uppercase tracking-widest text-center leading-tight">
                 {errorMsg}
               </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">First Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-4 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none bg-gray-50 transition-all"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Last Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-4 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none bg-gray-50 transition-all"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Email Address</label>
              <input
                required
                type="email"
                className="w-full px-4 py-4 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none bg-gray-50 transition-all"
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Phone Number</label>
                <input
                  required
                  type="tel"
                  className="w-full px-4 py-4 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none bg-gray-50 transition-all"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Password</label>
              <input
                required
                type="password"
                className="w-full px-4 py-4 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none bg-gray-50 transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              {mode === 'signup' && (
                <p className="mt-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest">Min. 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-5 border border-transparent rounded-2xl shadow-xl text-[10px] font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <RotateCwIcon className="w-4 h-4 animate-spin" />
              ) : (
                mode === 'login' ? 'Sign In to Portal' : 'Create Account'
              )}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={isLoading}
                className="w-full flex justify-center py-5 border border-gray-200 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-900 bg-white hover:bg-gray-50 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign In with Passkey
              </button>
            )}
          </form>

          <div className="mt-8 text-center border-t border-gray-50 pt-8">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setIsLoading(false);
                setErrorMsg(null);
              }}
              className="text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest transition-all"
            >
              {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalAuthPage;
