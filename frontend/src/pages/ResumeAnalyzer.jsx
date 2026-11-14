
import { useState } from 'react';
import api from '../api';
import './ResumeAnalyzer.css';

function ResumeAnalyzer() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!resume) {
      setError('Please upload your resume PDF.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please enter the job description.');
      return;
    }

    if (resume.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('job_description', jobDescription);

      const response = await api.post(
        '/analyze-resume',
        formData
      );

      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer-page">
      <header className="analyzer-header">
        <div>
          <h1>AI Resume Analyzer</h1>
          <p>Analyze your resume and discover how well it matches a job.</p>
        </div>
        <span className="analyzer-tag">NEXORA AI</span>
      </header>

      <div className="analyzer-content">
        <section className="analyzer-card">
          <h2>Upload Your Resume</h2>
          <p>Upload your resume in PDF format.</p>

          <label className="upload-area">
            <span className="upload-icon">📄</span>
            <strong>
              {resume ? resume.name : 'Choose your resume PDF'}
            </strong>
            <span>Click here to select a file</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                setResume(e.target.files?.[0] || null);
                setResult(null);
                setError('');
              }}
            />
          </label>
        </section>

        <section className="analyzer-card">
          <h2>Job Description</h2>
          <p>Paste the job description you want to match.</p>

          <textarea
            className="job-description-input"
            placeholder="Paste the complete job description here..."
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              setResult(null);
            }}
          />

          <button
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing Resume...' : 'Analyze My Resume'}
          </button>

          {error && <p className="analyzer-error">{error}</p>}
        </section>

        {result && (
          <section className="analyzer-card results-card">
            <h2>Analysis Results</h2>

            <div className="score-section">
              <div className="score-circle">
                <strong>{result.ats_score}%</strong>
                <span>ATS Score</span>
              </div>
              <p>{result.summary}</p>
            </div>

            <div className="result-columns">
              <div>
                <h3>Matched Skills</h3>
                {result.matched_skills?.length ? (
                  result.matched_skills.map((skill, index) => (
                    <span className="skill-chip matched" key={index}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <p>No matched skills found.</p>
                )}
              </div>

              <div>
                <h3>Missing Skills</h3>
                {result.missing_skills?.length ? (
                  result.missing_skills.map((skill, index) => (
                    <span className="skill-chip missing" key={index}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <p>No missing skills found.</p>
                )}
              </div>
            </div>

            <div className="suggestions-section">
              <h3>Improvement Suggestions</h3>
              {result.suggestions?.map((suggestion, index) => (
                <p key={index}>• {suggestion}</p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ResumeAnalyzer;
