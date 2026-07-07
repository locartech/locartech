import { ImagePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { readImageAsDataUrl, validateProfileImage } from '../../utils/profileUtils';

function AvatarUploader({ user, onChangePhoto }) {
  const [error, setError] = useState('');

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    const validationError = validateProfileImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const dataUrl = await readImageAsDataUrl(file);
    onChangePhoto(dataUrl);
    setError('');
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
          <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFile} />
        </label>
        <button type="button" className="ghost-button" onClick={() => onChangePhoto(null)}>
          <Trash2 size={15} aria-hidden="true" />
          Remover foto
        </button>
      </div>
      {error ? <p className="profile-photo-error">{error}</p> : null}
    </div>
  );
}

export default AvatarUploader;
