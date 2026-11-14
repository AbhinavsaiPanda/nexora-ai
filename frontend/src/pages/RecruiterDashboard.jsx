
import { useEffect, useState } from 'react';
import api from '../api';
import ProfilePhoto from './ProfilePhoto';
import './RecruiterDashboard.css';

const SERVER_URL = 'http://127.0.0.1:5000';

function RecruiterDashboard({ user }) {
  const [currentUser, setCurrentUser] = useState(user);

  const [activeSection, setActiveSection] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    company: user?.company || '',
    email: user?.email || ''
  });

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    job_type: 'Full Time',
    salary: '',
    description: '',
    skills: ''
  });

  // LOAD DASHBOARD
  useEffect(() => {
    if (currentUser?.id) {
      loadDashboardData();
    }
  }, [currentUser?.id]);

  // EDIT AND SAVE RECRUITER PROFILE
  const startProfileEdit = () => {
    setProfileForm({
      name: currentUser?.name || '',
      company: currentUser?.company || '',
      email: currentUser?.email || ''
    });
    setIsEditingProfile(true);
    setMessage('');
    setError('');
  };

  const handleProfileFieldChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const saveRecruiterProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await api.put(
        `/profile/${currentUser.id}`,
        profileForm
      );

      const updatedUser = response.data.user;
      setCurrentUser(updatedUser);
      setProfileForm({
        name: updatedUser.name || '',
        company: updatedUser.company || '',
        email: updatedUser.email || ''
      });
      setIsEditingProfile(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update profile. Please try again.'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // UPDATE USER AFTER PHOTO UPLOAD
  const handlePhotoUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    setMessage('Profile photo updated successfully!');
  };

  const loadDashboardData = async () => {
    setLoading(true);

    await Promise.all([
      loadJobs(),
      loadApplicants()
    ]);

    setLoading(false);
  };

  // LOAD RECRUITER JOBS
  const loadJobs = async () => {
    if (!currentUser?.id) return;

    try {
      const response = await api.get(`/recruiter/${currentUser.id}/jobs`);

      setJobs(
        Array.isArray(response.data)
          ? response.data
          : response.data.jobs || []
      );
    } catch (err) {
      setError('Unable to load job listings.');
    }
  };

  // LOAD APPLICANTS
  const loadApplicants = async () => {
    if (!currentUser?.id) return;

    try {
      const response = await api.get(`/recruiter/${currentUser.id}/applicants`);

      setApplicants(
        Array.isArray(response.data)
          ? response.data
          : response.data.applicants || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load applicants.'
      );
    }
  };

  // HANDLE FORM INPUTS
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // POST A JOB
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post(
        '/jobs',
        {
          ...formData,
          recruiter_id: currentUser.id
        }
      );

      setMessage(response.data.message);

      setFormData({
        title: '',
        location: '',
        job_type: 'Full Time',
        salary: '',
        description: '',
        skills: ''
      });

      await loadJobs();
      setActiveSection('jobs');

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to publish job.'
      );
    } finally {
      setLoading(false);
    }
  };

  // UPDATE APPLICATION STATUS
  const updateStatus = async (applicationId, status) => {
    setUpdatingId(applicationId);
    setMessage('');
    setError('');

    try {
      const response = await api.patch(
        `/applications/${applicationId}/status`,
        {
          recruiter_id: currentUser.id,
          status
        }
      );

      setMessage(response.data.message);
      await loadApplicants();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update application status.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // NAVIGATION
  const changeSection = (section) => {
    setActiveSection(section);
    setMessage('');
    setError('');

    if (section === 'jobs') {
      loadJobs();
    }

    if (section === 'applicants') {
      loadApplicants();
    }
  };

  // STATISTICS
  const shortlistedCount = applicants.filter(
    item => item.application?.status === 'Shortlisted'
  ).length;

  const interviewCount = applicants.filter(
    item => item.application?.status === 'Interview'
  ).length;

  // SIDEBAR MENU
  const menuItems = [
    { id: 'dashboard', icon: '▦', label: 'Dashboard' },
    { id: 'post', icon: '+', label: 'Post a Job' },
    { id: 'jobs', icon: '▣', label: 'My Jobs' },
    { id: 'applicants', icon: '♟', label: 'Applicants' },
    { id: 'settings', icon: '⚙', label: 'Settings' }
  ];

  // CANDIDATE PHOTO URL
  const getCandidatePhoto = (candidate) => {
    if (!candidate?.profile_photo_url) return null;

    return `${SERVER_URL}${candidate.profile_photo_url}`;
  };

  // CANDIDATE RESUME URL
  const getCandidateResumeUrl = (candidate) => {
    if (!candidate?.id || !currentUser?.id) return null;

    return `http://127.0.0.1:5000/api/resumes/${candidate.id}/download?recruiter_id=${currentUser.id}`;
  };

  return (
    <div className="recruiter-layout">

      {/* SIDEBAR */}
      <aside className="recruiter-sidebar">

        <h2 className="recruiter-logo">
          NEXORA <span>AI</span>
        </h2>

        <p className="recruiter-menu-title">
          WORKSPACE
        </p>

        <nav className="recruiter-nav">

          {menuItems.map(item => (
            <button
              key={item.id}
              className={
                activeSection === item.id
                  ? 'recruiter-nav-active'
                  : ''
              }
              onClick={() => changeSection(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

        </nav>

        <a className="recruiter-logout" href="/">
          ← Logout
        </a>

      </aside>

      {/* MAIN CONTENT */}
      <main className="recruiter-main">

        {/* HEADER */}
        <header className="recruiter-header">

          <div>
            <h1>
              {activeSection === 'dashboard' && 'Recruiter Dashboard'}
              {activeSection === 'post' && 'Create Job Posting'}
              {activeSection === 'jobs' && 'My Job Listings'}
              {activeSection === 'applicants' && 'Applicants'}
              {activeSection === 'settings' && 'Account Settings'}
            </h1>

            <p>
              Manage your hiring activities with Nexora AI.
            </p>
          </div>

          {/* RECRUITER PROFILE PHOTO */}
          <div className="recruiter-profile">

            <ProfilePhoto
              user={currentUser}
              onPhotoUpdated={handlePhotoUpdated}
            />

            <div className="recruiter-profile-details">
              <strong>
                {currentUser?.name || 'Recruiter'}
              </strong>

              <small>
                {currentUser?.company || 'Company Account'}
              </small>
            </div>

          </div>

        </header>

        {/* MESSAGES */}
        {message && (
          <div className="recruiter-message">
            {message}
          </div>
        )}

        {error && (
          <div className="recruiter-error">
            {error}
          </div>
        )}

        {/* DASHBOARD */}
        {activeSection === 'dashboard' && (
          <>

            <section className="recruiter-hero">

              <div>
                <span>RECRUITER WORKSPACE</span>

                <h2>
                  Welcome to your hiring dashboard! 👋
                </h2>

                <p>
                  Find talented candidates and manage your recruitment process.
                </p>
              </div>

              <button onClick={() => changeSection('post')}>
                + Post a New Job
              </button>

            </section>

            {/* STATISTICS */}
            <section className="recruiter-stats">

              <div className="recruiter-stat-card">
                <span>💼</span>
                <p>Active Jobs</p>
                <h2>{jobs.length}</h2>
                <small>Published job listings</small>
              </div>

              <div className="recruiter-stat-card">
                <span>👥</span>
                <p>Total Applicants</p>
                <h2>{applicants.length}</h2>
                <small>Applications received</small>
              </div>

              <div className="recruiter-stat-card">
                <span>⭐</span>
                <p>Shortlisted</p>
                <h2>{shortlistedCount}</h2>
                <small>Potential candidates</small>
              </div>

              <div className="recruiter-stat-card">
                <span>📅</span>
                <p>Interviews</p>
                <h2>{interviewCount}</h2>
                <small>Interview-stage candidates</small>
              </div>

            </section>

            {/* QUICK ACTIONS */}
            <section className="recruiter-panel">

              <div className="recruiter-panel-heading">
                <h2>Quick Actions</h2>
              </div>

              <div className="recruiter-actions">

                <button onClick={() => changeSection('post')}>
                  + Create Job Posting
                </button>

                <button onClick={() => changeSection('jobs')}>
                  ▣ Manage Job Listings
                </button>

                <button onClick={() => changeSection('applicants')}>
                  ♟ Review Applicants
                </button>

              </div>

            </section>

            {/* RECENT JOBS */}
            <section className="recruiter-panel">

              <div className="recruiter-panel-heading">
                <h2>Recent Job Listings</h2>

                <button onClick={() => changeSection('jobs')}>
                  View All →
                </button>
              </div>

              {loading ? (
                <p>Loading dashboard...</p>
              ) : jobs.length === 0 ? (
                <p>No jobs published yet.</p>
              ) : (
                jobs.slice(0, 3).map(job => (
                  <div className="recruiter-job-row" key={job.id}>

                    <div>
                      <strong>{job.title}</strong>
                      <p>{job.location} · {job.job_type}</p>
                    </div>

                    <span>Published</span>

                  </div>
                ))
              )}

            </section>

          </>
        )}

        {/* POST JOB */}
        {activeSection === 'post' && (
          <section className="recruiter-panel recruiter-form-panel">

            <h2>Publish a New Job</h2>

            <p>
              Provide the job details to reach suitable candidates.
            </p>

            <form onSubmit={handleSubmit}>

              <label>Job Title</label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: Python Developer"
                required
              />

              <label>Job Location</label>

              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Example: Hyderabad"
                required
              />

              <label>Employment Type</label>

              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
              >
                <option>Full Time</option>
                <option>Part Time</option>
                <option>Internship</option>
                <option>Remote</option>
                <option>Contract</option>
              </select>

              <label>Salary</label>

              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="Example: 3–5 LPA"
              />

              <label>Job Description</label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe responsibilities and requirements..."
                required
              />

              <label>Required Skills</label>

              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="Python, Flask, SQL"
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? 'Publishing...' : 'Publish Job'}
              </button>

            </form>

          </section>
        )}

        {/* MY JOBS */}
        {activeSection === 'jobs' && (
          <section className="recruiter-panel">

            <div className="recruiter-panel-heading">
              <h2>My Published Jobs</h2>

              <button onClick={loadJobs}>
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <p>Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p>
                No jobs found. Publish your first job to get started.
              </p>
            ) : (
              jobs.map(job => (
                <div className="recruiter-job-row" key={job.id}>

                  <div>
                    <strong>{job.title}</strong>

                    <p>
                      {job.company} · {job.location}
                    </p>

                    <small>
                      {job.job_type} · {job.salary || 'Salary not specified'}
                    </small>

                    <p>Skills: {job.skills}</p>
                  </div>

                  <span>Published</span>

                </div>
              ))
            )}

          </section>
        )}

        {/* APPLICANTS */}
        {activeSection === 'applicants' && (
          <section className="recruiter-panel">

            <div className="recruiter-panel-heading">
              <h2>Applicant Management</h2>

              <button onClick={loadApplicants}>
                ↻ Refresh Applicants
              </button>
            </div>

            {loading ? (
              <p>Loading applicants...</p>
            ) : applicants.length === 0 ? (
              <div className="empty-applicants">
                <h3>No Applications Yet</h3>

                <p>
                  Candidates who apply for your published jobs
                  will appear here.
                </p>
              </div>
            ) : (
              applicants.map(item => {
                const candidate = item.candidate || {};
                const job = item.job || {};
                const application = item.application || {};

                const candidatePhoto = getCandidatePhoto(candidate);
                const resumeUrl = getCandidateResumeUrl(candidate);
                const match = item.match || {};

                return (
                  <div
                    className="applicant-card"
                    key={application.id}
                  >

                    {/* CANDIDATE PHOTO AND DETAILS */}
                    <div className="applicant-information">

                      <div className="applicant-avatar">
                        {candidatePhoto ? (
                          <img
                            src={candidatePhoto}
                            alt={candidate.name || 'Candidate'}
                            className="applicant-photo"
                          />
                        ) : (
                          <span>
                            {candidate.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3>{candidate.name}</h3>
                        <p>{candidate.email}</p>

                        <p>
                          Applied for: <strong>{job.title}</strong>
                        </p>

                        <small>
                          Applied on:{' '}
                          {application.applied_at
                            ? new Date(
                                application.applied_at
                              ).toLocaleDateString()
                            : 'Not available'}
                        </small>

                        {/* RESUME ACTIONS */}
                        {resumeUrl && (
                          <div className="applicant-resume-actions">

                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Resume
                            </a>

                            <a
                              href={`${resumeUrl}&download=1`}
                            >
                              Download Resume
                            </a>

                          </div>
                        )}

                      </div>

                    </div>

                    {/* AI RESUME-TO-JOB MATCH */}
                    <div className="applicant-match">

                      <div className="applicant-match-heading">
                        <strong>AI Job Match</strong>

                        {typeof match.match_percentage === 'number' ? (
                          <span className="applicant-match-score">
                            {match.match_percentage}% Match
                          </span>
                        ) : (
                          <span className="applicant-match-unavailable">
                            Not available
                          </span>
                        )}
                      </div>

                      <p className="applicant-match-message">
                        {match.message || 'Match details are not available.'}
                      </p>

                      {match.matched_skills?.length > 0 && (
                        <div className="applicant-match-skills">
                          <strong>Matched skills</strong>

                          <div className="applicant-skill-list">
                            {match.matched_skills.map(skill => (
                              <span className="matched-skill" key={skill}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {match.missing_skills?.length > 0 && (
                        <div className="applicant-match-skills">
                          <strong>Missing skills</strong>

                          <div className="applicant-skill-list">
                            {match.missing_skills.map(skill => (
                              <span className="missing-skill" key={skill}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                    {/* APPLICATION STATUS */}
                    <div className="applicant-actions">

                      <span
                        className={`applicant-status status-${(
                          application.status || 'Applied'
                        ).toLowerCase()}`}
                      >
                        {application.status || 'Applied'}
                      </span>

                      <label>Update Application Status</label>

                      <select
                        value={application.status || 'Applied'}
                        disabled={updatingId === application.id}
                        onChange={e =>
                          updateStatus(
                            application.id,
                            e.target.value
                          )
                        }
                      >
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview">Interview</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                      </select>

                      {updatingId === application.id && (
                        <small>Updating...</small>
                      )}

                    </div>

                  </div>
                );
              })
            )}

          </section>
        )}

        {/* SETTINGS */}
        {activeSection === 'settings' && (
          <section className="recruiter-panel recruiter-settings-card">

            <div className="recruiter-panel-heading">
              <h2>Recruiter Account Information</h2>
              {!isEditingProfile && (
                <button type="button" onClick={startProfileEdit}>
                  ✎ Edit Profile
                </button>
              )}
            </div>

            <div className="recruiter-settings-profile">
              <ProfilePhoto
                user={currentUser}
                onPhotoUpdated={handlePhotoUpdated}
              />
            </div>

            {isEditingProfile ? (
              <form className="recruiter-profile-edit-form" onSubmit={saveRecruiterProfile}>
                <label htmlFor="recruiter-name">Name</label>
                <input
                  id="recruiter-name"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileFieldChange}
                  required
                />

                <label htmlFor="recruiter-company">Company</label>
                <input
                  id="recruiter-company"
                  name="company"
                  value={profileForm.company}
                  onChange={handleProfileFieldChange}
                  required
                />

                <label htmlFor="recruiter-email">Email</label>
                <input
                  id="recruiter-email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileFieldChange}
                  required
                />

                <div className="recruiter-profile-edit-actions">
                  <button type="submit" disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="recruiter-profile-cancel"
                    disabled={profileSaving}
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="settings-row">
                  <strong>Name</strong>
                  <span>{currentUser?.name || 'Not available'}</span>
                </div>

                <div className="settings-row">
                  <strong>Company</strong>
                  <span>{currentUser?.company || 'Not available'}</span>
                </div>

                <div className="settings-row">
                  <strong>Email</strong>
                  <span>{currentUser?.email || 'Not available'}</span>
                </div>
              </>
            )}

            <div className="settings-row">
              <strong>Account Type</strong>
              <span>Recruiter</span>
            </div>

          </section>
        )}

        {/* FOOTER */}
        <footer className="recruiter-footer">
          © 2026 Nexora AI. All rights reserved.
        </footer>

      </main>

    </div>
  );
}

export default RecruiterDashboard;
