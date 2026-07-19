function MemberTypeBadge({ accountType, principal = false }) {
  const isAdmin = principal || accountType === 'admin';
  const isOperacao = !isAdmin && accountType === 'operacao';
  const label = isAdmin ? 'Administrador principal' : isOperacao ? 'Obra' : 'Membro';
  const tone = isAdmin ? 'admin' : isOperacao ? 'operacao' : 'member';

  return <span className={`member-type-badge ${tone}`}>{label}</span>;
}

export default MemberTypeBadge;
