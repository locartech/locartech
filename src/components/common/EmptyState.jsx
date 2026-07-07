import { Inbox } from 'lucide-react';

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <Inbox size={22} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export default EmptyState;
