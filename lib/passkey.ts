import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from './supabase';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function registerPasskey(): Promise<boolean> {
  // 1. Get registration options from server
  const headers = await getAuthHeader();
  const optRes = await fetch('/api/passkey/register-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  if (!optRes.ok) throw new Error('Failed to get registration options');
  const optionsJSON = await optRes.json();

  // 2. Create credential via browser WebAuthn API
  const attResp = await startRegistration({ optionsJSON });

  // 3. Verify with server
  const verifyRes = await fetch('/api/passkey/register-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(attResp),
  });
  const result = await verifyRes.json();
  if (!result.verified) throw new Error(result.error || 'Registration failed');
  return true;
}

export async function authenticateWithPasskey(): Promise<{
  email: string;
  userId: string;
}> {
  // 1. Get authentication options
  const optRes = await fetch('/api/passkey/auth-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!optRes.ok) throw new Error('Failed to get auth options');
  const optionsJSON = await optRes.json();

  // 2. Authenticate via browser WebAuthn API
  const asseResp = await startAuthentication({ optionsJSON });

  // 3. Verify with server
  const verifyRes = await fetch('/api/passkey/auth-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asseResp),
  });
  const result = await verifyRes.json();
  if (!result.verified) throw new Error(result.error || 'Authentication failed');

  // 4. Use the token_hash to establish a Supabase session
  const { error } = await supabase.auth.verifyOtp({
    token_hash: result.token_hash,
    type: 'magiclink',
  });
  if (error) throw new Error('Session creation failed: ' + error.message);

  return { email: result.email, userId: result.user_id };
}

export async function getPasskeyStatus(): Promise<{ hasPasskey: boolean; count: number }> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/passkey/status', { headers });
  if (!res.ok) return { hasPasskey: false, count: 0 };
  return res.json();
}
