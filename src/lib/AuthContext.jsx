'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                     = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]     = useState(true);
  // mantém o nome para não quebrar App.jsx que lê isLoadingPublicSettings
  const [isLoadingPublicSettings]             = useState(false);
  const [authError, setAuthError]             = useState(null);
  const [authChecked, setAuthChecked]         = useState(false);
  const [profile, setProfile]                 = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const loadProfile = async (session) => {
    if (!session?.access_token) {
      setProfile(null);
      return null;
    }

    setIsLoadingProfile(true);
    try {
      const response = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Falha ao carregar perfil.");
      setProfile(payload.profile || null);
      setAuthError(null);
      return payload.profile || null;
    } catch (error) {
      setProfile(null);
      setAuthError(error.message);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    // Carrega sessão existente ao montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      if (session?.user) loadProfile(session);
    });

    // Escuta mudanças de sessão (login / logout em outra aba, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      setAuthError(null);
      if (session?.user) loadProfile(session);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async (redirectUrl) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (redirectUrl) window.location.href = redirectUrl;
    else window.location.href = '/';
  };

  const navigateToLogin = () => {
    window.location.href = `/admin/login?redirect=${encodeURIComponent(window.location.href)}`;
  };

  // checkUserAuth mantido para compatibilidade com AdminGuard
  const checkUserAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const u = session?.user ?? null;
    setUser(u ?? null);
    setIsAuthenticated(!!u);
    if (session?.user) await loadProfile(session);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      authChecked,
      profile,
      isLoadingProfile,
      reloadProfile: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return loadProfile(session);
      },
      logout,
      navigateToLogin,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
