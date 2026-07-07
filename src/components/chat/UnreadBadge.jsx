function UnreadBadge({ count }) {
  if (!count) return null;
  return <span className="chat-unread-badge">{count}</span>;
}

export default UnreadBadge;
