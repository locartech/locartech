import { MEMBERS_STORAGE_KEY, initialMembers } from '../data/membersData';
import { getInitials } from './authUtils';

const today = '2026-07-06';

export function loadMembers() {
  try {
    const savedMembers = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (savedMembers) {
      return JSON.parse(savedMembers);
    }
  } catch {
    localStorage.removeItem(MEMBERS_STORAGE_KEY);
  }

  return initialMembers;
}

export function saveMembers(members) {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
}

export function createMember(values) {
  return {
    id: `u-${crypto.randomUUID()}`,
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    sector: values.sector,
    role: values.role.trim(),
    accountType: values.accountType,
    status: values.status,
    joinedAt: today,
    lastAccess: null,
    avatarInitials: getInitials(values.name.trim()),
  };
}

export function updateMember(members, memberId, values) {
  return members.map((member) =>
    member.id === memberId
      ? {
          ...member,
          ...values,
          email: values.email.trim().toLowerCase(),
          name: values.name.trim(),
          role: values.role.trim(),
          avatarInitials: getInitials(values.name.trim()),
        }
      : member,
  );
}

export function removeMember(members, memberId) {
  return members.filter((member) => member.id !== memberId);
}

export function deactivateMember(members, memberId) {
  return members.map((member) => (member.id === memberId ? { ...member, status: 'Inativo' } : member));
}

export function approveMember(members, memberId) {
  return members.map((member) => (member.id === memberId ? { ...member, status: 'Ativo' } : member));
}

export function rejectMember(members, memberId) {
  return members.map((member) => (member.id === memberId ? { ...member, status: 'Rejeitado' } : member));
}

export function updateMemberPhoto(members, memberId, photoUrl) {
  return members.map((member) => (member.id === memberId ? { ...member, photoUrl } : member));
}

export function getMemberStats(members) {
  return {
    total: members.length,
    active: members.filter((member) => member.status === 'Ativo').length,
    inactive: members.filter((member) => member.status === 'Inativo').length,
    sectors: new Set(members.map((member) => member.sector)).size,
  };
}
