import { LockKeyhole } from 'lucide-react';

function PermissionNotice({ notice }) {
  if (!notice) return null;

  return (
    <div
      className="permission-notice"
      role="status"
      aria-live="polite"
      style={{ left: notice.x, top: notice.y }}
    >
      <LockKeyhole size={14} aria-hidden="true" />
      <span>{notice.message}</span>
    </div>
  );
}

export default PermissionNotice;
