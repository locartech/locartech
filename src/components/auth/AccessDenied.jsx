import { LockKeyhole } from 'lucide-react';

function AccessDenied() {
  return (
    <section className="access-denied">
      <div className="access-denied-icon">
        <LockKeyhole size={22} aria-hidden="true" />
      </div>
      <div>
        <p className="eyebrow">Acesso restrito</p>
        <h2>Você não tem permissão para acessar o gerenciamento de membros.</h2>
        <p>
          Esta área é exclusiva do administrador principal definido pelo e-mail da empresa.
        </p>
      </div>
    </section>
  );
}

export default AccessDenied;
