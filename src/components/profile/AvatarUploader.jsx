import { Crop, ImagePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { validateProfileImage } from '../../utils/profileUtils';
import AvatarEditorModal from './AvatarEditorModal';

function AvatarUploader({ user, onUpload, onRemove }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const validationError = validateProfileImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      await onUpload(file);
      setError('');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel enviar a foto.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await onRemove();
      setError('');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel remover a foto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="avatar-uploader">
      <div className="profile-avatar-preview">
        {user.photoUrl ? <img src={user.photoUrl} alt="" /> : <span>{user.avatarInitials}</span>}
      </div>
      <div className="avatar-actions">
        <label className="ghost-button">
          <ImagePlus size={15} aria-hidden="true" />
          Trocar foto
          <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFile} disabled={busy} />
        </label>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setEditorOpen(true)}
          disabled={busy || !user.photoUrl}
        >
          <Crop size={15} aria-hidden="true" />
          Editar foto
        </button>
        <button type="button" className="ghost-button" onClick={handleRemove} disabled={busy || !user.photoUrl}>
          <Trash2 size={15} aria-hidden="true" />
          Remover foto
        </button>
      </div>
      {error ? <p className="profile-photo-error">{error}</p> : null}

      {editorOpen ? (
        <AvatarEditorModal
          photoUrl={user.photoUrl}
          onClose={() => setEditorOpen(false)}
          onSave={onUpload}
        />
      ) : null}
    </div>
  );
}

export default AvatarUploader;
