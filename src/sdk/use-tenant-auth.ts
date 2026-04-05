'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface TenantAuth {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  updateProfile: (metadata: Record<string, unknown>) => Promise<boolean>;
}

// Auth hook for tenant apps. Uses Supabase Auth so tenant app users
// get real authentication with email verification, password reset, etc.
// Only used when the app creator adds authentication to their app.
export function useTenantAuth(): TenantAuth {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: u } }: { data: { user: User | null } }) => {
      setUser(u);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User | null } | null) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>): Promise<boolean> => {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (err) {
      setError(err.message);
      return false;
    }
    return true;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    if (err) {
      setError(err.message);
      return false;
    }
    return true;
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) {
      setError(err.message);
      return false;
    }
    return true;
  }, []);

  const updateProfile = useCallback(async (metadata: Record<string, unknown>): Promise<boolean> => {
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.updateUser({ data: metadata });
    if (err) {
      setError(err.message);
      return false;
    }
    if (data.user) setUser(data.user);
    return true;
  }, []);

  return { user, loading, error, signUp, signIn, signOut, resetPassword, updatePassword, updateProfile };
}
