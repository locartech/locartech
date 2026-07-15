import { useEffect, useRef, useState } from 'react';

const defaultMessage = 'Voce nao tem permissao para editar este setor.';

export default function usePermissionNotice() {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const showPermissionNotice = (nextMessage = defaultMessage) => {
    setMessage(nextMessage);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setMessage(''), 2600);
  };

  return { permissionMessage: message, showPermissionNotice };
}
