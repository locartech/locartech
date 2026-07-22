import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { fetchOrganization } from '../services/organizationService';
import {
  createPendingProfile,
  fetchProfileByAuthUser,
  fetchProfileByEmail,
  touchLastAccess,
  updateProfile as updateProfileRow,
  updateProfilePhoto,
} from '../services/profilesService';
import { removeAvatar as removeAvatarFile, uploadAvatar as uploadAvatarFile } from '../services/storageService';
import { canAccessSystem } from '../utils/authUtils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = async (authUserId) => {
    try {
      const nextProfile = await fetchProfileByAuthUser(authUserId);
      setProfile(nextProfile);
      if (nextProfile && canAccessSystem(nextProfile)) touchLastAccess(nextProfile.id);
      return nextProfile;
    } catch {
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    fetchOrganization()
      .then((org) => mounted && setOrganization(org))
      .catch(() => {});

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      if (data.session?.user) await loadProfile(data.session.user.id);
      if (mounted) setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
      setSession(nextSession);
      if (nextSession?.user) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      return { ok: false, message: 'Preencha e-mail e senha para entrar.' };
    }
    if (!isSupabaseConfigured) {
      return { ok: false, message: 'Supabase nao configurado neste ambiente.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) return { ok: false, message: error.message };

    setSession(data.session);
    const nextProfile = await loadProfile(data.user.id);
    if (!nextProfile) {
      await supabase.auth.signOut();
      return { ok: false, message: 'Conta sem perfil cadastrado no sistema.' };
    }

    return { ok: true };
  };

  const register = async (values) => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: 'Supabase nao configurado neste ambiente.' };
    }

    const normalizedEmail = values.email.trim().toLowerCase();
    if (values.password !== values.confirmPassword) {
      return { ok: false, message: 'As senhas nao coincidem.' };
    }

    const existingProfile = await fetchProfileByEmail(normalizedEmail);
    if (existingProfile) return { ok: false, message: 'Ja existe uma conta com este e-mail.' };

    const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password: values.password });
    if (error) return { ok: false, message: error.message };

    try {
      await createPendingProfile({ ...values, email: normalizedEmail }, data.user?.id ?? null);
    } catch (profileError) {
      return { ok: false, message: profileError.message ?? 'Nao foi possivel concluir o cadastro. Tente novamente.' };
    }

    if (data.session) {
      setSession(data.session);
      await loadProfile(data.user.id);
    }

    return { ok: true, message: 'Conta criada. Aguarde aprovacao do administrador principal para acessar o sistema.' };
  };

  const requestPasswordReset = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        message: 'Não foi possível enviar o link de recuperação agora. Tente novamente em instantes.',
      };
    }

    const siteUrl = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

    // O Supabase Auth envia o e-mail. O SMTP transacional sera configurado no painel usando Brevo.
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${siteUrl}/redefinir-senha`,
    });

    if (error) {
      return {
        ok: false,
        message: 'Não foi possível enviar o link de recuperação agora. Tente novamente em instantes.',
      };
    }

    return {
      ok: true,
      message: 'Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.',
    };
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        message: 'Não foi possível atualizar sua senha. Solicite um novo link de recuperação.',
      };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return {
        ok: false,
        message: 'Não foi possível atualizar sua senha. Solicite um novo link de recuperação.',
      };
    }

    return { ok: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setIsPasswordRecovery(false);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (values) => {
    if (!profile) throw new Error('Nenhum perfil carregado.');
    const updated = await updateProfileRow(profile.id, { ...profile, ...values });
    setProfile(updated);
    return updated;
  };

  const uploadAvatar = async (file) => {
    if (!session?.user?.id || !profile) throw new Error('Sessao invalida.');
    const publicUrl = await uploadAvatarFile(session.user.id, file);
    const updated = await updateProfilePhoto(profile.id, publicUrl);
    setProfile(updated);
    return updated;
  };

  const removeAvatar = async () => {
    if (!session?.user?.id || !profile) throw new Error('Sessao invalida.');
    await removeAvatarFile(session.user.id);
    const updated = await updateProfilePhoto(profile.id, null);
    setProfile(updated);
    return updated;
  };

  const refreshOrganization = async () => {
    const org = await fetchOrganization();
    setOrganization(org);
    return org;
  };

  const value = useMemo(
    () => ({
      session,
      profile,
      currentUser: profile,
      setCurrentUser: setProfile,
      organization,
      loading,
      isAuthenticated: Boolean(session),
      isPasswordRecovery,
      isActive: canAccessSystem(profile),
      isAdmin: profile?.accountType === 'admin',
      // Self-registration has no "tipo de conta" field, so a member who signs up
      // choosing the Obra sector stays accountType 'member' - gate on either
      // signal so restricted access can't be bypassed by just picking that sector.
      isOperacao: profile?.accountType === 'operacao' || profile?.sector === 'Obra',
      isPrimaryAdmin: Boolean(profile && organization && profile.id === organization.adminProfileId),
      login,
      register,
      requestPasswordReset,
      updatePassword,
      logout,
      updateProfile,
      uploadAvatar,
      removeAvatar,
      refreshOrganization,
    }),
    [session, profile, organization, isPasswordRecovery, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
