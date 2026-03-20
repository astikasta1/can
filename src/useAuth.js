import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export function useAuth() {
  const [session, setSession] = useState(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;

    let subscription;
    try {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data?.session ?? null);
      }).catch(() => setSession(null));

      const { data } = supabase.auth.onAuthStateChange((_ev, session) => {
        setSession(session);
      });
      subscription = data?.subscription;
    } catch {
      setSession(null);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase ? supabase.auth.signInWithPassword({ email, password }) : Promise.reject(new Error('Supabase not configured'));

  const signOut = () =>
    supabase ? supabase.auth.signOut() : Promise.resolve();

  return { session, loading: session === undefined, signIn, signOut };
}
