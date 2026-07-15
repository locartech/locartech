import { useEffect, useRef } from 'react';

const escapeStack = [];

function handleEscape(event) {
  if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;

  const activeEntry = escapeStack.at(-1);
  if (!activeEntry) return;

  event.preventDefault();
  event.stopPropagation();
  activeEntry.close();
}

export default function useEscapeKey(onClose, enabled = true) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!enabled) return undefined;

    const previouslyFocused = document.activeElement;
    const entry = { close: () => closeRef.current?.() };
    escapeStack.push(entry);

    if (escapeStack.length === 1) document.addEventListener('keydown', handleEscape);

    return () => {
      const entryIndex = escapeStack.indexOf(entry);
      if (entryIndex >= 0) escapeStack.splice(entryIndex, 1);
      if (escapeStack.length === 0) document.removeEventListener('keydown', handleEscape);

      window.requestAnimationFrame(() => {
        if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
          previouslyFocused.focus();
        }
      });
    };
  }, [enabled]);
}
