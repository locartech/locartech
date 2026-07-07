import { COMPANY_ADMIN_EMAIL, COMPANY_ADMIN_EMAIL_STORAGE_KEY } from '../config/authConfig';

export function getCompanyAdminEmail() {
  try {
    return localStorage.getItem(COMPANY_ADMIN_EMAIL_STORAGE_KEY) || COMPANY_ADMIN_EMAIL;
  } catch {
    return COMPANY_ADMIN_EMAIL;
  }
}

export function setCompanyAdminEmail(email) {
  localStorage.setItem(COMPANY_ADMIN_EMAIL_STORAGE_KEY, email);
}

export function isCompanyAdmin(user, adminEmail = getCompanyAdminEmail()) {
  return Boolean(user?.email) && user.email.toLowerCase() === adminEmail.toLowerCase();
}

export function canAccessSystem(user) {
  return user?.status === 'Ativo';
}

export function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
