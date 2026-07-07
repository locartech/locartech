import { LogOut, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loadMembers, saveMembers, updateMemberPhoto } from '../../utils/membersUtils';
import AvatarUploader from './AvatarUploader';

function UserProfileModal({ onClose }) {
  const { currentUser, setCurrentUser, isAdmin, logout } = useAuth();

  const handlePhotoChange = (photoUrl) => {
    const members = loadMembers();
    const nextMembers = updateMemberPhoto(members, currentUser.id, photoUrl);
    saveMembers(nextMembers);
    setCurrentUser({ ...currentUser, photoUrl });
  };

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Perfil do usuário</p>
            <h2 id="profile-title">{currentUser.name}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar perfil">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="profile-modal-body">
          <AvatarUploader user={currentUser} onChangePhoto={handlePhotoChange} />
          <dl className="profile-detail-grid">
            <div>
              <dt>E-mail</dt>
              <dd>{currentUser.email}</dd>
            </div>
            <div>
              <dt>Setor</dt>
              <dd>{currentUser.sector}</dd>
            </div>
            <div>
              <dt>Cargo</dt>
              <dd>{currentUser.role}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{currentUser.status}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{currentUser.accountType === 'admin' ? 'Administrador principal' : 'Membro'}</dd>
            </div>
            <div>
              <dt>Permissão atual</dt>
              <dd>{isAdmin ? 'Administrador principal' : 'Membro comum'}</dd>
            </div>
          </dl>

          <div className="profile-modal-actions">
            <button
              type="button"
              className="logout-button"
              onClick={() => {
                onClose();
                logout();
              }}
            >
              <LogOut size={15} aria-hidden="true" />
              Sair da conta
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default UserProfileModal;
