
import { useState } from 'react';
import api from '../api';

function CandidateResume({ user }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resumeName, setResumeName] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select your resume PDF.');
      return;
    }

    if (file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF resumes are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Resume must be smaller than 5 MB.');
      return;
    }

    if (!user?.id) {
      setError('Please log in again to upload your resume.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post(
        `/resume/${user.id}`,
        formData
      );

      setResumeName(
        response.data.original_filename || file.name
      );

      setMessage(
        response.data.message || 'Resume uploaded successfully!'
      );

      setFile(null);

      const fileInput = document.getElementById('candidate-resume-input');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to upload resume. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="candidate-panel">
      <h2>📄 My Profile Resume</h2>

      <p>
        Upload your latest resume. NEXORA AI will make it
        available to recruiters when they review your applications.
      </p>

      <form onSubmit={handleUpload}>
        <input
          id="candidate-resume-input"
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setError('');
            setMessage('');
          }}
        />

        <p>
          <small>PDF only. Maximum file size: 5 MB.</small>
        </p>

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </form>

      {file && <p>Selected: {file.name}</p>}

      {resumeName && (
        <p>
          Uploaded resume: <strong>{resumeName}</strong>
        </p>
      )}

      {message && (
        <p className="success-message">{message}</p>
      )}

      {error && (
        <p className="error-message">{error}</p>
      )}
    </section>
  );
}

export default CandidateResume;
