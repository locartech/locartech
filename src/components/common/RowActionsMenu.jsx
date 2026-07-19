import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Rendered through a portal into document.body, positioned from the trigger's
// actual screen coordinates - see PurchaseRequestTable's PurchaseStatusMenu
// for why (horizontal-scroll table wrappers clip a relatively-positioned menu).
function RowActionsMenu({ items }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const visibleItems = items.filter(Boolean);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
        minWidth: 180,
      });
    }
    setOpen((current) => !current);
  };

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleClose = () => setOpen(false);

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [open]);

  if (visibleItems.length === 0) return null;

  return (
    <div className="row-actions-menu">
      <button
        ref={triggerRef}
        type="button"
        className="table-icon-button row-actions-trigger"
        onClick={handleToggle}
        title="Mais acoes"
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>

      {open && menuStyle
        ? createPortal(
            <div ref={menuRef} className="row-actions-options" style={menuStyle}>
              {visibleItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`row-actions-option${item.tone ? ` ${item.tone}` : ''}`}
                  onClick={(event) => {
                    setOpen(false);
                    item.onClick(event);
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default RowActionsMenu;
