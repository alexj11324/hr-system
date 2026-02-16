import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '100kb' }));

// --- Config ---
const SUPABASE_URL = 'https://xhncdveikphwxoazoudl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobmNkdmVpa3Bod3hvYXpvdWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTE4OTksImV4cCI6MjA4Njc2Nzg5OX0.ibEK1V95t8vzghnYU-tPnkyxVBBFs7Dos5Fjsmv3t_Y';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const RP_NAME = 'CardioGuard';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || `http://localhost:3000`;

// Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

// In-memory challenge store (TTL 5 min)
const challenges = new Map();
function storeChallenge(key, challenge) {
  challenges.set(key, challenge);
  setTimeout(() => challenges.delete(key), 5 * 60 * 1000);
}

// --- Ensure passkey_credentials table exists ---
async function ensureTable() {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin.rpc('pg_tables_exist', { tbl: 'passkey_credentials' }).maybeSingle();
  // If rpc doesn't exist, we just skip — user should create table manually
  if (error) {
    console.log('Note: passkey_credentials table should be created manually if not exists.');
  }
}

// --- Helper: get user from Bearer token ---
async function getUserFromToken(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// --- Helper: get credentials for user ---
async function getCredentials(userId) {
  const client = supabaseAdmin || supabaseAnon;
  const { data, error } = await client
    .from('passkey_credentials')
    .select('*')
    .eq('user_id', userId);
  if (error) return [];
  return data || [];
}

// ==========================================
// REGISTRATION ENDPOINTS
// ==========================================

app.post('/api/passkey/register-options', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const existingCreds = await getCredentials(user.id);
    const excludeCredentials = existingCreds.map(c => ({
      id: c.credential_id,
      transports: c.transports || [],
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.email || user.id,
      userDisplayName: user.email || 'User',
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    storeChallenge(`reg_${user.id}`, options.challenge);
    res.json(options);
  } catch (err) {
    console.error('register-options error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/passkey/register-verify', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const expectedChallenge = challenges.get(`reg_${user.id}`);
    if (!expectedChallenge) return res.status(400).json({ error: 'Challenge expired' });

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Verification failed' });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    const client = supabaseAdmin || supabaseAnon;
    const { error } = await client.from('passkey_credentials').insert({
      user_id: user.id,
      credential_id: credential.id,
      public_key: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: req.body.response?.transports || [],
      device_type: credentialDeviceType,
      backed_up: credentialBackedUp,
    });

    if (error) {
      console.error('DB insert error:', error);
      return res.status(500).json({ error: 'Failed to store credential' });
    }

    challenges.delete(`reg_${user.id}`);
    res.json({ verified: true });
  } catch (err) {
    console.error('register-verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/passkey/auth-options', async (req, res) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
    });

    // Use challenge as the key since we don't know the user yet
    storeChallenge(`auth_${options.challenge}`, options.challenge);
    res.json(options);
  } catch (err) {
    console.error('auth-options error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/passkey/auth-verify', async (req, res) => {
  try {
    const { id: credentialId } = req.body;
    if (!credentialId) return res.status(400).json({ error: 'Missing credential ID' });

    // Look up the credential
    const client = supabaseAdmin || supabaseAnon;
    const { data: cred, error: credError } = await client
      .from('passkey_credentials')
      .select('*')
      .eq('credential_id', credentialId)
      .single();

    if (credError || !cred) {
      return res.status(400).json({ error: 'Credential not found' });
    }

    // Extract challenge from the client's response to look up the correct stored challenge
    if (!req.body.response?.clientDataJSON) {
      return res.status(400).json({ error: 'Invalid authentication response' });
    }
    let challengeFromClient;
    try {
      const clientData = JSON.parse(
        Buffer.from(req.body.response.clientDataJSON, 'base64url').toString()
      );
      challengeFromClient = clientData.challenge;
    } catch {
      return res.status(400).json({ error: 'Invalid clientDataJSON' });
    }

    const expectedChallenge = challenges.get(`auth_${challengeFromClient}`);
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge expired or invalid' });
    }

    const publicKeyBytes = Uint8Array.from(
      Buffer.from(cred.public_key, 'base64url')
    );

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: cred.credential_id,
        publicKey: publicKeyBytes,
        counter: cred.counter,
        transports: cred.transports || [],
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'Verification failed' });
    }

    // Update counter
    await client
      .from('passkey_credentials')
      .update({ counter: verification.authenticationInfo.newCounter })
      .eq('credential_id', credentialId);

    // Clean up challenge
    for (const [key] of challenges.entries()) {
      if (key.startsWith('auth_') && challenges.get(key) === expectedChallenge) {
        challenges.delete(key);
        break;
      }
    }

    // Generate a session for the user via Supabase Admin API
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server not configured with service role key' });
    }

    // Get user email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(cred.user_id);
    if (userError || !user) {
      return res.status(500).json({ error: 'User not found' });
    }

    // Generate magic link to create session
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });

    if (linkError) {
      return res.status(500).json({ error: 'Failed to generate session' });
    }

    res.json({
      verified: true,
      token_hash: linkData.properties?.hashed_token,
      email: user.email,
      user_id: user.id,
    });
  } catch (err) {
    console.error('auth-verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Check if user has passkeys ---
app.get('/api/passkey/status', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const creds = await getCredentials(user.id);
    res.json({ hasPasskey: creds.length > 0, count: creds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Static files ---
// Hashed assets get long-lived immutable cache
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
  maxAge: '1y',
  immutable: true,
}));
app.use(express.static(path.join(__dirname, 'dist')));
// SPA fallback — never cache index.html so deploys take effect immediately
app.get('{*path}', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`RP_ID: ${RP_ID}, Origin: ${ORIGIN}`);
  if (!SUPABASE_SERVICE_KEY) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not set. Passkey auth will not work.');
  }
});
