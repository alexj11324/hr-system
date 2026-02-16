import * as Sentry from '@sentry/react';
import { Session } from '@supabase/supabase-js';
import { resetSupabaseClient, supabase } from './supabase';

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 1;

export interface SafeGetSessionOptions {
  timeoutMs?: number;
  retries?: number;
}

export interface SafeGetSessionResult {
  session: Session | null;
  attempts: number;
  timedOut: boolean;
  recovered: boolean;
  error?: unknown;
}

const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

const isTimeoutError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('timed out');
};

const addAuthBreadcrumb = (message: string, data?: Record<string, unknown>) => {
  Sentry.addBreadcrumb({
    category: 'auth.bootstrap',
    message,
    level: 'info',
    data,
  });
};

export const safeGetSession = async (options: SafeGetSessionOptions = {}): Promise<SafeGetSessionResult> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  let attempts = 0;
  let lastError: unknown;
  let timeoutDetected = false;

  while (attempts <= retries) {
    attempts += 1;
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), timeoutMs);
      return {
        session: data.session ?? null,
        attempts,
        timedOut: timeoutDetected,
        recovered: timeoutDetected && attempts > 1,
      };
    } catch (error) {
      lastError = error;
      if (isTimeoutError(error)) {
        timeoutDetected = true;
      } else {
        break;
      }
      if (attempts > retries) break;
      addAuthBreadcrumb('session-get-timeout-reset-client', { attempts, timeoutMs });
      resetSupabaseClient();
    }
  }

  return {
    session: null,
    attempts,
    timedOut: timeoutDetected,
    recovered: false,
    error: lastError,
  };
};

export const bootstrapAuthState = async (options: SafeGetSessionOptions = {}): Promise<SafeGetSessionResult> => {
  const result = await safeGetSession(options);
  addAuthBreadcrumb('session-bootstrap-finished', {
    attempts: result.attempts,
    timedOut: result.timedOut,
    recovered: result.recovered,
    hasSession: !!result.session,
  });
  return result;
};
