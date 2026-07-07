import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../config/authConfig';
import { initialMembers } from '../data/membersData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  createPendingProfile,
  fetchProfileByAuthUser,
  fetchProfileByEmail,
  touchLastAccess,
} from '../services/profilesService';
import { canAccessSystem, getCompanyAdminEmail, isCompanyAdmin, setCompanyAdminEmail } from '../utils/authUtils';
import { createMember, loadMembers, saveMembers } from '../utils/membersUtils';

const AuthContext = createContext(null);

function loadCurrentUser() {
  try {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedUser) return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return null;
}

function syncInitialMembers() {
  const members = loadMembers();
  if (!members?.length) {
    saveMembers(initialMembers);
    return initialMembers;
  }
  return members;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(loadCurrentUser);
  const [companyAdminEmail, setCompanyAdminEmailState] = useState(getCompanyAdminEmail);

  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let mounted = true;

    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      const authUser = data.session?.user;
      if (!authUser || !mounted) return;

      try {
        const profile = await fetchProfileByAuthUser(authUser.id);
        if (profile && canAccessSystem(profile)) {
          setCurrentUser(profile);
          touchLastAccess(profile.id);
        }
      } catch {
        // The local fallback stays active until the Supabase schema is applied.
      }
    };

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return;
      try {
        const profile = await fetchProfileByAuthUser(session.user.id);
        if (profile && canAccessSystem(profile)) setCurrentUser(profile);
      } catch {
        // Ignore setup-time database errors.
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

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) return { ok: false, message: error.message };

        const profile = await fetchProfileByAuthUser(data.user.id);
        if (!profile) return { ok: false, message: 'Conta sem perfil cadastrado no sistema.' };
        if (!canAccessSystem(profile)) {
          await supabase.auth.signOut();
          return { ok: false, message: `Conta com status ${profile.status}. Aguarde aprovacao ou contate o administrador.` };
        }

        setCurrentUser(profile);
        touchLastAccess(profile.id);
        return { ok: true };
      } catch {
        // Fallback keeps the app usable until the database is created.
      }
    }

    const members = syncInitialMembers();
    const member = members.find((item) => item.email.toLowerCase() === normalizedEmail);

    if (!member) return { ok: false, message: 'E-mail nao encontrado.' };
    if (!canAccessSystem(member)) {
      return { ok: false, message: `Conta com status ${member.status}. Aguarde aprovacao ou contate o administrador.` };
    }

    setCurrentUser({ ...member, lastAccess: new Date().toISOString().slice(0, 10) });
    return { ok: true };
  };

  const register = async (values) => {
    const normalizedEmail = values.email.trim().toLowerCase();

    if (values.password !== values.confirmPassword) {
      return { ok: false, message: 'As senhas nao coincidem.' };
    }

    if (isSupabaseConfigured) {
      try {
        const existingProfile = await fetchProfileByEmail(normalizedEmail);
        if (existingProfile) return { ok: false, message: 'Ja existe uma conta com este e-mail.' };

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: values.password,
        });

        if (error) return { ok: false, message: error.message };

        await createPendingProfile({ ...values, email: normalizedEmail }, data.user?.id);
        return { ok: true, message: 'Conta criada. Aguarde aprovacao do administrador principal para acessar o sistema.' };
      } catch {
        // Fallback below works while the Supabase schema is not applied.
      }
    }

    const members = syncInitialMembers();
    if (members.some((member) => member.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, message: 'Ja existe uma conta com este e-mail.' };
    }

    const newMember = createMember({
      name: values.name,
      email: normalizedEmail,
      sector: values.sector,
      role: values.role,
      accountType: 'member',
      status: 'Pendente',
    });

    saveMembers([...members, newMember]);
    return { ok: true, message: 'Conta criada. Aguarde aprovacao do administrador principal para acessar o sistema.' };
  };

  const requestPasswordReset = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
        if (error) return { ok: false, message: error.message };
        return { ok: true, message: 'Se o e-mail existir, as instrucoes de recuperacao serao enviadas.' };
      } catch {
        // Continue to local fallback.
      }
    }

    const members = syncInitialMembers();
    const exists = members.some((member) => member.email.toLowerCase() === normalizedEmail);
    if (!exists) return { ok: false, message: 'Nao encontramos uma conta com este e-mail.' };
    return { ok: true, message: 'Instrucoes simuladas enviadas. Integracao real sera feita com backend futuramente.' };
  };

  const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const transferAdmin = (email) => {
    setCompanyAdminEmail(email);
    setCompanyAdminEmailState(email);
  };

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      login,
      register,
      requestPasswordReset,
      logout,
      companyAdminEmail,
      transferAdmin,
      isAdmin: currentUser?.accountType === 'admin' || isCompanyAdmin(currentUser, companyAdminEmail),
      isAuthenticated: Boolean(currentUser),
    }),
    [companyAdminEmail, currentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
