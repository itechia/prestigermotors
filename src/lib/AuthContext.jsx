'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getSimulatedUserId, SIMULATED_USER_STORAGE_KEY } from '@/lib/adminApi';

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
  const [realProfile, setRealProfile]         = useState(null);
  const [simulation, setSimulation]           = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const loadProfile = async (session) => {
    if (!session?.access_token) {
      setProfile(null);
      setRealProfile(null);
      setSimulation(null);
      return null;
    }

    setIsLoadingProfile(true);
    try {
      const response = await fetch("/api/admin/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...(getSimulatedUserId() ? { "X-Simulated-User-Id": getSimulatedUserId() } : {}),
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || payload.error || `Falha ao carregar perfil (${response.status}).`);
      }
      setProfile(payload.profile || null);
      setRealProfile(payload.real_profile || payload.profile || null);
      setSimulation(payload.simulation || null);
      setAuthError(null);
      return payload.profile || null;
    } catch (error) {
      setProfile(null);
      setRealProfile(null);
      setSimulation(null);
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
      else {
        setProfile(null);
        setRealProfile(null);
        setSimulation(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async (redirectUrl) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setProfile(null);
    setRealProfile(null);
    setSimulation(null);
    setAuthError(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(SIMULATED_USER_STORAGE_KEY);
    if (redirectUrl) window.location.href = redirectUrl;
    else window.location.href = '/';
  };

  const startSimulation = (userId) => {
    if (!userId || typeof window === "undefined") return;
    window.localStorage.setItem(SIMULATED_USER_STORAGE_KEY, userId);
    window.location.href = "/admin";
  };

  const stopSimulation = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(SIMULATED_USER_STORAGE_KEY);
    window.location.href = "/admin/usuarios";
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
      realProfile,
      simulation,
      isLoadingProfile,
      isSuperAdmin: realProfile?.role === "super_admin",
      isSimulating: !!simulation?.active,
      startSimulation,
      stopSimulation,
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
