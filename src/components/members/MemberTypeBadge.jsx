function MemberTypeBadge({ accountType, principal = false }) {
  const isAdmin = principal || accountType === 'admin';
  return <span className={`member-type-badge ${isAdmin ? 'admin' : 'member'}`}>{isAdmin ? 'Administrador principal' : 'Membro'}</span>;
}

export default MemberTypeBadge;
