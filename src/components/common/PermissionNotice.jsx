import { LockKeyhole } from 'lucide-react';

function PermissionNotice({ message }) {
  if (!message) return null;

  return (
    <div className="permission-notice" role="status" aria-live="polite">
      <LockKeyhole size={14} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default PermissionNotice;
