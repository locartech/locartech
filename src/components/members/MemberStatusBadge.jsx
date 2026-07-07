function MemberStatusBadge({ status }) {
  return <span className={`member-status-badge status-${status.toLowerCase()}`}>{status}</span>;
}

export default MemberStatusBadge;
