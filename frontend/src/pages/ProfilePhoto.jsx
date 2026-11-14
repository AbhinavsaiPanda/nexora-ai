
import { useState } from 'react';
import api from '../api';

const SERVER_URL = 'http://127.0.0.1:5000';

function ProfilePhoto({ user, onPhotoUpdated }) {
  const [photo, setPhoto] = useState(
    user?.profile_photo_url
      ? `${SERVER_URL}${user.profile_photo_url}`
      : ''
  );

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePhotoChange = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please select a JPG, PNG or WEBP image.');
      event.target.value = '';
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Photo must be smaller than 5 MB.');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);

    setUploading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post(
        `/profile-photo/${user.id}`,
        formData
      );

      const updatedUser = response.data.user;

      const photoUrl = updatedUser.profile_photo_url
        ? `${SERVER_URL}${updatedUser.profile_photo_url}`
        : '';

      setPhoto(photoUrl);

      if (onPhotoUpdated) {
        onPhotoUpdated(updatedUser);
      }

      setMessage('Profile photo updated successfully!');

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to upload your photo.'
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="profile-photo-upload">

      <div className="profile-photo-preview">
        {photo ? (
          <img
            src={photo}
            alt={`${user?.name || 'User'} profile`}
            className="profile-photo-image"
          />
        ) : (
          <div className="profile-photo-placeholder">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
      </div>

      <label className="profile-photo-button">
        {uploading ? 'Uploading...' : '📷 Change Photo'}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          disabled={uploading}
          hidden
        />
      </label>

      {message && (
        <p className="profile-photo-success">{message}</p>
      )}

      {error && (
        <p className="profile-photo-error">{error}</p>
      )}

    </div>
  );
}

export default ProfilePhoto;
