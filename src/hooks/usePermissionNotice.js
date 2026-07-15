import { useEffect, useRef, useState } from 'react';

const defaultMessage = 'Voce nao tem permissao para editar este setor.';

export default function usePermissionNotice() {
  const [notice, setNotice] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const showPermissionNotice = (eventOrMessage, customMessage) => {
    const hasPointer = typeof eventOrMessage?.clientX === 'number';
    const message = typeof eventOrMessage === 'string' ? eventOrMessage : customMessage || defaultMessage;
    const position = hasPointer
      ? {
          x: Math.max(12, Math.min(eventOrMessage.clientX + 10, window.innerWidth - 300)),
          y: Math.max(12, Math.min(eventOrMessage.clientY + 16, window.innerHeight - 54)),
        }
      : { x: Math.max(12, window.innerWidth / 2 - 140), y: Math.max(12, window.innerHeight / 2) };

    setNotice({ message, ...position });
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setNotice(null), 2600);
  };

  return { permissionNotice: notice, showPermissionNotice };
}
