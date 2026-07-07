import { createContext, useContext, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../config/authConfig';
import { initialMembers } from '../data/membersData';
import { canAccessSystem, getCompanyAdminEmail, isCompanyAdmin, setCompanyAdminEmail } from '../utils/authUtils';
import { createMember, loadMembers, saveMembers } from '../utils/membersUtils';

const AuthContext = createContext(null);

function loadCurrentUser() {
  try {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedUser) {
      return JSON.parse(savedUser);
    }
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

  const login = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      return { ok: false, message: 'Preencha e-mail e senha para entrar.' };
    }

    const members = syncInitialMembers();
    const member = members.find((item) => item.email.toLowerCase() === normalizedEmail);

    if (!member) {
      return { ok: false, message: 'E-mail não encontrado no protótipo.' };
    }

    if (!canAccessSystem(member)) {
      return { ok: false, message: `Conta com status ${member.status}. Aguarde aprovação ou contate o administrador.` };
    }

    // Protótipo: a senha é validada apenas como campo obrigatório. Não há senha real no localStorage.
    setCurrentUser({ ...member, lastAccess: '2026-07-06' });
    return { ok: true };
  };

  const register = (values) => {
    const members = syncInitialMembers();
    const normalizedEmail = values.email.trim().toLowerCase();

    if (members.some((member) => member.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, message: 'Já existe uma conta com este e-mail.' };
    }

    if (values.password !== values.confirmPassword) {
      return { ok: false, message: 'As senhas não coincidem.' };
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
    return { ok: true, message: 'Conta criada. Aguarde aprovação do administrador principal para acessar o sistema.' };
  };

  const requestPasswordReset = (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const members = syncInitialMembers();
    const exists = members.some((member) => member.email.toLowerCase() === normalizedEmail);

    if (!exists) {
      return { ok: false, message: 'Não encontramos uma conta com este e-mail.' };
    }

    return { ok: true, message: 'Instruções simuladas enviadas. Integração real será feita com backend futuramente.' };
  };

  const logout = () => {
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
      isAdmin: isCompanyAdmin(currentUser, companyAdminEmail),
      isAuthenticated: Boolean(currentUser),
    }),
    [companyAdminEmail, currentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
