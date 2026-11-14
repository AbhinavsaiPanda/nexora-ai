
import { useEffect, useState } from 'react';
import api from '../api';

import ResumeBuilder from './ResumeBuilder';
import ResumeAnalyzer from './ResumeAnalyzer';
import SkillGapAnalysis from './SkillGapAnalysis';
import LearningHub from './LearningHub';
import CandidateResume from './CandidateResume';
import ProfilePhoto from './ProfilePhoto';
import InterviewPreparation from '../InterviewPreparation';

import './CandidateDashboard.css';


function CandidateDashboard({ user }) {
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const handlePhotoUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    setMessage('Profile photo updated successfully!');
  };

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savingJobId, setSavingJobId] = useState(null);
  const [removingJobId, setRemovingJobId] = useState(null);
  const [jobMatches, setJobMatches] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [applyingId, setApplyingId] = useState(null);

  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  const [profileData, setProfileData] = useState({
    phone: '',
    location: '',
    headline: '',
    summary: '',
    date_of_birth: '',
    education: '',
    college: '',
    graduation_year: '',
    cgpa: '',
    skills: '',
    projects: '',
    internships: '',
    preferred_roles: '',
    preferred_locations: '',
    expected_salary: '',
    experience_level: 'Fresher',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showResumeBuilder, setShowResumeBuilder] = useState(false);
  const [showResumeAnalyzer, setShowResumeAnalyzer] = useState(false);
  const [showSkillGap, setShowSkillGap] = useState(false);
  const [showLearningHub, setShowLearningHub] = useState(false);
  const [showInterview, setShowInterview] = useState(false);

  const candidateId = currentUser?.id;

  // LOAD RESUME-BASED JOB MATCHES
  const loadJobMatches = async (jobList) => {
    if (!candidateId || !jobList || jobList.length === 0) {
      setJobMatches({});
      return;
    }

    setMatchingLoading(true);

    try {
      const results = await Promise.all(
        jobList.map(async (job) => {
          try {
            const response = await api.get(`/match-job/${job.id}/${candidateId}`);

            return [job.id, response.data];
          } catch (err) {
            console.error(
              `Matching unavailable for job ${job.id}:`,
              err.response?.data || err.message
            );

            return [job.id, null];
          }
        })
      );

      const matches = Object.fromEntries(
        results.filter(([, match]) => match !== null)
      );

      setJobMatches(matches);

    } catch (err) {
      console.error('Unable to load job matches:', err);
    } finally {
      setMatchingLoading(false);
    }
  };

  // LOAD JOBS
  const loadJobs = async () => {
    try {
      const response = await api.get('/jobs');

      const jobList = response.data || [];

      setJobs(jobList);

      await loadJobMatches(jobList);

    } catch (err) {
      setError('Unable to load jobs. Please check the backend.');
    }
  };

  // LOAD APPLICATIONS AND CREATE NOTIFICATIONS
  const loadApplications = async () => {
    if (!candidateId) return;

    try {
      const response = await api.get(`/candidate/${candidateId}/applications`);

      const nextApplications = response.data || [];
      setApplications(nextApplications);

      const snapshotKey = `nexora_application_status_${candidateId}`;
      const notificationKey = `nexora_notifications_${candidateId}`;

      const nextSnapshot = Object.fromEntries(
        nextApplications.map(item => [
          String(item.application.id),
          item.application.status
        ])
      );

      try {
        const previousRaw = localStorage.getItem(snapshotKey);
        const previousSnapshot = previousRaw
          ? JSON.parse(previousRaw)
          : null;

        const storedNotifications = JSON.parse(
          localStorage.getItem(notificationKey) || '[]'
        );

        if (previousSnapshot) {
          const changes = nextApplications
            .filter(item => {
              const id = String(item.application.id);

              return (
                previousSnapshot[id] &&
                previousSnapshot[id] !== item.application.status
              );
            })
            .map(item => ({
              id: `${item.application.id}-${item.application.status}-${Date.now()}`,
              applicationId: item.application.id,
              jobTitle: item.job?.title || 'Your job application',
              status: item.application.status,
              message: `Your application status changed to ${item.application.status}.`,
              createdAt: new Date().toISOString(),
              read: false
            }));

          if (changes.length > 0) {
            const updatedNotifications = [
              ...changes,
              ...storedNotifications
            ].slice(0, 30);

            localStorage.setItem(
              notificationKey,
              JSON.stringify(updatedNotifications)
            );

            setNotifications(updatedNotifications);
          } else {
            setNotifications(storedNotifications);
          }
        } else {
          setNotifications(storedNotifications);
        }

        localStorage.setItem(
          snapshotKey,
          JSON.stringify(nextSnapshot)
        );

      } catch (storageError) {
        console.error(
          'Unable to save application notifications:',
          storageError
        );
      }

    } catch (err) {
      setError('Unable to load your applications.');
    }
  };

  // LOAD SAVED JOBS
  const loadSavedJobs = async () => {
    if (!candidateId) return;

    try {
      const response = await api.get(`/saved-jobs/${candidateId}`);

      setSavedJobs(response.data || []);

    } catch (err) {
      setError('Unable to load your saved jobs.');
    }
  };

  // SAVE A JOB
  const handleSaveJob = async (jobId) => {
    if (!candidateId) {
      setError('Please log in again.');
      return;
    }

    setSavingJobId(jobId);
    setMessage('');
    setError('');

    try {
      const response = await api.post(
        '/saved-jobs',
        {
          candidate_id: candidateId,
          job_id: jobId
        }
      );

      setMessage(
        response.data.message || 'Job saved successfully!'
      );

      await loadSavedJobs();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save this job.'
      );
    } finally {
      setSavingJobId(null);
    }
  };

  // REMOVE A SAVED JOB
  const handleRemoveSavedJob = async (jobId) => {
    if (!candidateId) return;

    setRemovingJobId(jobId);
    setMessage('');
    setError('');

    try {
      const response = await api.delete(`/saved-jobs/${candidateId}/${jobId}`);

      setSavedJobs(current =>
        current.filter(item => item.job?.id !== jobId)
      );

      setMessage(
        response.data.message || 'Job removed from saved jobs.'
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to remove this saved job.'
      );
    } finally {
      setRemovingJobId(null);
    }
  };

  // LOAD DASHBOARD DATA
  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    await Promise.all([
      loadJobs(),
      loadApplications(),
      loadSavedJobs()
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, [candidateId]);

  useEffect(() => {
    if (activeSection === 'profile') {
      loadCandidateProfile();
    }
  }, [activeSection, candidateId]);

  // CHECK RECRUITER STATUS UPDATES EVERY 12 SECONDS
  useEffect(() => {
    if (!candidateId) return undefined;

    const intervalId = window.setInterval(() => {
      loadApplications();
    }, 12000);

    return () => window.clearInterval(intervalId);
  }, [candidateId]);

  // APPLIED JOB IDS
  const appliedJobIds = applications.map(
    item => item.application.job_id
  );

  const savedJobIds = savedJobs.map(
    item => item.job?.id
  );

  // APPLICATION STATUS TIMELINE
  const renderApplicationTimeline = (status) => {
    const stages = [
      'Applied',
      'Shortlisted',
      'Interview',
      'Selected'
    ];

    const currentIndex = stages.indexOf(status);

    if (status === 'Rejected') {
      return (
        <div style={{
          marginTop: '18px',
          padding: '12px 14px',
          borderRadius: '10px',
          background: '#3b1720',
          color: '#fecaca'
        }}>
          <strong>✕ Application Rejected</strong>

          <p style={{
            margin: '5px 0 0',
            color: '#fda4af'
          }}>
            This application will not move to the next hiring stage.
          </p>
        </div>
      );
    }

    const activeIndex = currentIndex >= 0
      ? currentIndex
      : 0;

    return (
      <div style={{ marginTop: '20px' }}>

        <p style={{ marginBottom: '12px' }}>
          <strong>Application Progress</strong>
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          width: '100%',
          gap: '4px'
        }}>

          {stages.map((stage, index) => {
            const completed = index <= activeIndex;

            return (
              <div
                key={stage}
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'center',
                  position: 'relative'
                }}
              >

                <div style={{
                  height: '7px',
                  borderRadius: '8px',
                  background: completed
                    ? '#22c55e'
                    : '#d1d5db',
                  marginBottom: '9px'
                }} />

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: completed
                    ? '#16a34a'
                    : '#64748b',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  {completed ? '✓' : index + 1}
                </span>

                <p style={{
                  fontSize: '12px',
                  lineHeight: 1.3,
                  margin: '6px 2px 0',
                  color: completed
                    ? '#86efac'
                    : '#cbd5e1',
                  fontWeight: completed ? 700 : 500,
                  overflowWrap: 'anywhere'
                }}>
                  {stage}
                </p>

              </div>
            );
          })}

        </div>

        <p style={{
          marginTop: '10px',
          fontSize: '13px',
          color: '#cbd5e1'
        }}>
          Current status: <strong>{status || 'Applied'}</strong>
        </p>

      </div>
    );
  };

  // SAVE / REMOVE JOB BUTTON
  const renderSaveButton = (job) => {
    const isSaved = savedJobIds.includes(job.id);

    return (
      <button
        type="button"
        className="save-job-button"
        onClick={() =>
          isSaved
            ? handleRemoveSavedJob(job.id)
            : handleSaveJob(job.id)
        }
        disabled={
          savingJobId === job.id ||
          removingJobId === job.id
        }
      >
        {savingJobId === job.id
          ? 'Saving...'
          : removingJobId === job.id
          ? 'Removing...'
          : isSaved
          ? '★ Saved'
          : '☆ Save Job'}
      </button>
    );
  };

  // SORT JOBS BY MATCH PERCENTAGE
  const recommendedJobs = [...jobs].sort((a, b) => {
    const matchA = Number(
      jobMatches[a.id]?.match_percentage || 0
    );

    const matchB = Number(
      jobMatches[b.id]?.match_percentage || 0
    );

    return matchB - matchA;
  });

  // APPLY FOR JOB
  const handleApply = async (jobId) => {
    if (!candidateId) {
      setError('Please log in again.');
      return;
    }

    setApplyingId(jobId);
    setMessage('');
    setError('');

    try {
      const response = await api.post(
        '/applications',
        {
          candidate_id: candidateId,
          job_id: jobId
        }
      );

      setMessage(
        response.data.message ||
        'Application submitted successfully.'
      );

      await loadApplications();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to apply for this job.'
      );
    } finally {
      setApplyingId(null);
    }
  };


  // LOAD AND SAVE THE CANDIDATE'S OWN PROFILE
  const loadCandidateProfile = async () => {
    if (!candidateId) return;
    setProfileLoading(true);
    try {
      const response = await api.get(`/candidate-profile/${candidateId}`);
      setProfileData(current => ({ ...current, ...(response.data.profile || {}) }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const saveCandidateProfile = async () => {
    if (!candidateId) return;
    setProfileSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await api.put(`/candidate-profile/${candidateId}`, profileData);
      setProfileData(current => ({ ...current, ...(response.data.profile || {}) }));
      setMessage(response.data.message || 'Profile saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const updateProfileField = (field, value) => {
    setProfileData(current => ({ ...current, [field]: value }));
  };

  const profileFields = [
    ['phone', 'Phone number', 'tel'],
    ['location', 'Current location', 'text'],
    ['headline', 'Professional headline', 'text'],
    ['date_of_birth', 'Date of birth', 'text'],
    ['education', 'Degree / Education', 'text'],
    ['college', 'College name', 'text'],
    ['graduation_year', 'Graduation year', 'text'],
    ['cgpa', 'CGPA / Percentage', 'text'],
    ['preferred_roles', 'Preferred job roles', 'text'],
    ['preferred_locations', 'Preferred job locations', 'text'],
    ['expected_salary', 'Expected salary', 'text'],
    ['experience_level', 'Experience level (Fresher / Experienced)', 'text']
  ];

  // CLOSE ALL FEATURE PAGES
  const closeFeaturePages = () => {
    setShowResumeBuilder(false);
    setShowResumeAnalyzer(false);
    setShowSkillGap(false);
    setShowLearningHub(false);
    setShowInterview(false);
  };

  // OPEN DASHBOARD SECTION
  const openSection = (section) => {
    closeFeaturePages();

    setActiveSection(section);
    setMessage('');
    setError('');
  };

  // OPEN RESUME BUILDER
  const openResumeBuilder = () => {
    closeFeaturePages();

    setShowResumeBuilder(true);
    setActiveSection('resume-builder');
  };

  // OPEN RESUME ANALYZER
  const openResumeAnalyzer = () => {
    closeFeaturePages();

    setShowResumeAnalyzer(true);
    setActiveSection('resume-analysis');
  };

  // OPEN SKILL GAP ANALYSIS
  const openSkillGap = () => {
    closeFeaturePages();

    setShowSkillGap(true);
    setActiveSection('skill-gap');
  };

  // OPEN LEARNING HUB
  const openLearningHub = () => {
    closeFeaturePages();

    setShowLearningHub(true);
    setActiveSection('learning');
  };

  // OPEN INTERVIEW PREPARATION
  const openInterviewPreparation = () => {
    closeFeaturePages();

    setShowInterview(true);
    setActiveSection('interview');
  };

  // FILTER JOBS
  const filteredJobs = recommendedJobs.filter(job => {
    const searchText = search.toLowerCase();

    return (
      job.title?.toLowerCase().includes(searchText) ||
      job.company?.toLowerCase().includes(searchText) ||
      job.location?.toLowerCase().includes(searchText) ||
      job.skills?.toLowerCase().includes(searchText)
    );
  });

  // JOB MATCH DISPLAY
  const renderJobMatch = (job) => {
    const match = jobMatches[job.id];

    return (
      <div className="candidate-job-match">

        <h4>🤖 NEXORA AI Job Match</h4>

        {matchingLoading && !match ? (
          <p>Analyzing your resume...</p>
        ) : match ? (
          <>

            <h3>
              {match.match_percentage}% Match
            </h3>

            <p>
              {match.message || 'Resume matching completed.'}
            </p>

            <div className="candidate-match-skills">

              <p>
                <strong>Matched Skills:</strong>
              </p>

              {match.matched_skills?.length > 0 ? (
                <div className="candidate-skill-list">
                  {match.matched_skills.map(skill => (
                    <span
                      className="candidate-matched-skill"
                      key={skill}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p>No matching skills identified.</p>
              )}

            </div>

            <div className="candidate-match-skills">

              <p>
                <strong>Missing Skills:</strong>
              </p>

              {match.missing_skills?.length > 0 ? (
                <div className="candidate-skill-list">
                  {match.missing_skills.map(skill => (
                    <span
                      className="candidate-missing-skill"
                      key={skill}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p>No missing skills identified.</p>
              )}

            </div>

          </>
        ) : (
          <p>
            Upload your resume to view your job match.
          </p>
        )}

      </div>
    );
  };

  // APPLY BUTTON
  const renderApplyButton = (job) => (
    <button
      onClick={() => handleApply(job.id)}
      disabled={
        appliedJobIds.includes(job.id) ||
        applyingId === job.id
      }
    >
      {appliedJobIds.includes(job.id)
        ? 'Already Applied'
        : applyingId === job.id
        ? 'Applying...'
        : 'Apply Now'}
    </button>
  );

  // FEATURE PAGE BACK BUTTON
  const backButton = (
    <button
      className="analyze-button"
      onClick={() => openSection('dashboard')}
      style={{ margin: '20px', width: 'auto' }}
    >
      ← Back to Dashboard
    </button>
  );

  // RESUME BUILDER PAGE
  if (showResumeBuilder) {
    return (
      <div>
        {backButton}
        <ResumeBuilder user={user} />
      </div>
    );
  }

  // RESUME ANALYZER PAGE
  if (showResumeAnalyzer) {
    return (
      <div>
        {backButton}
        <ResumeAnalyzer />
      </div>
    );
  }

  // SKILL GAP ANALYSIS PAGE
  if (showSkillGap) {
    return (
      <div>
        {backButton}
        <SkillGapAnalysis />
      </div>
    );
  }

  // LEARNING HUB PAGE
  if (showLearningHub) {
    return (
      <div>
        {backButton}
        <LearningHub />
      </div>
    );
  }

  // INTERVIEW PREPARATION PAGE
  if (showInterview) {
    return (
      <div>
        {backButton}
        <InterviewPreparation user={user} />
      </div>
    );
  }

  return (
    <div className="candidate-dashboard">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <h2 className="sidebar-logo">
          NEXORA <span>AI</span>
        </h2>

        <p className="sidebar-label">MENU</p>

        <nav>

          <button
            className={activeSection === 'dashboard' ? 'active' : ''}
            onClick={() => openSection('dashboard')}
          >
            🏠 Dashboard
          </button>

          <button
            className={activeSection === 'profile' ? 'active' : ''}
            onClick={() => openSection('profile')}
          >
            👤 My Profile
          </button>

          <button
            className={activeSection === 'jobs' ? 'active' : ''}
            onClick={() => openSection('jobs')}
          >
            💼 Find Jobs
          </button>

          <button
            className={activeSection === 'saved-jobs' ? 'active' : ''}
            onClick={() => openSection('saved-jobs')}
          >
            ⭐ Saved Jobs ({savedJobs.length})
          </button>

          <button onClick={openResumeBuilder}>
            📄 Resume Builder
          </button>

          <button onClick={openResumeAnalyzer}>
            📊 Resume Analysis
          </button>

          <button
            className={activeSection === 'resume' ? 'active' : ''}
            onClick={() => openSection('resume')}
          >
            📎 Upload My Resume
          </button>

          <button onClick={openSkillGap}>
            🎯 Skill Gap Analysis
          </button>

          <button
            className={activeSection === 'learning' ? 'active' : ''}
            onClick={openLearningHub}
          >
            🎓 Learning Hub
          </button>

          <button
            className={activeSection === 'interview' ? 'active' : ''}
            onClick={openInterviewPreparation}
          >
            🎤 Interview Preparation
          </button>

          <button
            className={activeSection === 'applications' ? 'active' : ''}
            onClick={() => openSection('applications')}
          >
            📋 My Applications
          </button>

          <button
            className={activeSection === 'career' ? 'active' : ''}
            onClick={() => openSection('career')}
          >
            🤖 Career Assistant
          </button>

        </nav>

        <button
          className="logout-button"
          onClick={() => window.location.reload()}
        >
          ← Logout
        </button>

      </aside>

      {/* MAIN CONTENT */}

      <main className="candidate-main">

        <header
          className="candidate-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            position: 'relative'
          }}
        >

          <div>

            <h1>
              {activeSection === 'jobs'
                ? 'Find Jobs'
                : activeSection === 'profile'
                ? 'My Profile'
                : activeSection === 'applications'
                ? 'My Applications'
                : activeSection === 'saved-jobs'
                ? 'Saved Jobs'
                : activeSection === 'career'
                ? 'Career Assistant'
                : activeSection === 'resume'
                ? 'Upload My Resume'
                : 'Candidate Dashboard'}
            </h1>

            <p>
              Welcome back, {user?.name || 'Candidate'}!
            </p>

          </div>

          {/* TOP-RIGHT NOTIFICATIONS AND PROFILE */}

          <div
            className="candidate-header-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '18px',
              position: 'relative',
              marginLeft: 'auto',
              flexShrink: 0
            }}
          >

            <div style={{ position: 'relative' }}>

              <button
                type="button"
                onClick={() => {
                  const nextOpen = !showNotifications;
                  setShowNotifications(nextOpen);

                  if (nextOpen) {
                    const updated = notifications.map(item => ({
                      ...item,
                      read: true
                    }));

                    setNotifications(updated);

                    try {
                      localStorage.setItem(
                        `nexora_notifications_${candidateId}`,
                        JSON.stringify(updated)
                      );
                    } catch (storageError) {
                      console.error(
                        'Unable to update notification state:',
                        storageError
                      );
                    }
                  }
                }}
                aria-label="Notifications"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid rgba(148,163,184,.35)',
                  borderRadius: '24px',
                  background: '#fff',
                  color: '#263248',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(15,23,42,.08)'
                }}
              >

                <span style={{ fontSize: '19px' }}>🔔</span>
                <span>Notifications</span>

                {notifications.filter(item => !item.read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '-7px',
                    minWidth: '19px',
                    height: '19px',
                    padding: '0 4px',
                    borderRadius: '20px',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {notifications.filter(item => !item.read).length}
                  </span>
                )}

              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '52px',
                  width: 'min(360px, 85vw)',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  background: '#fff',
                  color: '#1e293b',
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0,0,0,.25)',
                  padding: '14px'
                }}>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                  }}>
                    <strong>Notifications</strong>

                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      style={{
                        border: 0,
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#475569',
                        fontSize: '18px'
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p style={{
                      color: '#64748b',
                      margin: '12px 0'
                    }}>
                      No notifications yet. Recruiter updates will appear here.
                    </p>
                  ) : (
                    notifications.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px 4px',
                          borderTop: '1px solid #e2e8f0',
                          background: item.read ? '#fff' : '#f5f3ff'
                        }}
                      >
                        <strong style={{ fontSize: '13px' }}>
                          {item.jobTitle}
                        </strong>

                        <p style={{
                          margin: '4px 0',
                          fontSize: '13px'
                        }}>
                          {item.message}
                        </p>

                        <span style={{
                          color: '#64748b',
                          fontSize: '11px'
                        }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}

                </div>
              )}

            </div>

            <div className="candidate-profile">
              <ProfilePhoto
                user={currentUser}
                onPhotoUpdated={handlePhotoUpdated}
              />
              <strong>{currentUser?.name || 'Candidate'}</strong>
            </div>

          </div>

        </header>

        {(message || error) && (
          <div className={error ? 'error-message' : 'success-message'}>
            {error || message}
          </div>
        )}

        {loading ? (
          <p>Loading your dashboard...</p>
        ) : (

          <>

            {/* DASHBOARD HOME */}

            {activeSection === 'dashboard' && (
              <>

                <section className="candidate-welcome">

                  <div>
                    <h2>Discover Your Next Opportunity!</h2>

                    <p>
                      Explore jobs, improve your resume and
                      build your career with NEXORA AI.
                    </p>
                  </div>

                </section>

                {/* DASHBOARD STATISTICS */}

                <section className="candidate-stats">

                  <div className="candidate-stat-card">
                    <h3>{jobs.length}</h3>
                    <p>Available Jobs</p>
                  </div>

                  <div className="candidate-stat-card">
                    <h3>{applications.length}</h3>
                    <p>Applications</p>
                  </div>

                  <div className="candidate-stat-card">

                    <h3>
                      {applications.filter(
                        item =>
                          item.application.status === 'Shortlisted'
                      ).length}
                    </h3>

                    <p>Shortlisted</p>

                  </div>

                </section>

                {/* RECOMMENDED JOBS */}

                <section className="candidate-panel">

                  <h2>Recommended Opportunities</h2>

                  <p>
                    Jobs ranked according to your resume skills.
                  </p>

                  {matchingLoading && (
                    <p>Calculating your job matches...</p>
                  )}

                  {recommendedJobs.slice(0, 3).map(job => (

                    <div className="candidate-job" key={job.id}>

                      <h3>{job.title}</h3>

                      <p>🏢 {job.company}</p>

                      <p>📍 {job.location}</p>

                      <p>
                        💰 {job.salary || 'Not specified'}
                      </p>

                      {renderJobMatch(job)}

                      {renderSaveButton(job)}
                      {renderApplyButton(job)}

                    </div>

                  ))}

                  {jobs.length === 0 && (
                    <p>No jobs available right now.</p>
                  )}

                  <button
                    className="view-all-button"
                    onClick={() => openSection('jobs')}
                  >
                    View All Jobs →
                  </button>

                </section>

                {/* CAREER TOOLS */}

                <section className="quick-actions">

                  <h2>Career Development Tools</h2>

                  <button onClick={openResumeBuilder}>
                    📄 Build My Resume
                  </button>

                  <button onClick={openResumeAnalyzer}>
                    📊 Analyze My Resume
                  </button>

                  <button onClick={openSkillGap}>
                    🎯 Check Skill Gaps
                  </button>

                  <button onClick={openLearningHub}>
                    🎓 Explore Tutorials
                  </button>

                  <button
                    onClick={() => openSection('applications')}
                  >
                    📋 Track Applications
                  </button>

                  <button
                    onClick={() => openSection('resume')}
                  >
                    📎 Upload My Resume
                  </button>

                </section>

              </>
            )}

            {/* FIND JOBS */}

            {activeSection === 'jobs' && (
              <section className="candidate-panel">

                <h2>Explore Job Opportunities</h2>

                <input
                  type="text"
                  className="job-search-input"
                  placeholder="Search by title, company, location or skill..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />

                {filteredJobs.map(job => (

                  <div className="candidate-job" key={job.id}>

                    <h3>{job.title}</h3>

                    <p>🏢 {job.company}</p>

                    <p>📍 {job.location}</p>

                    <p>💼 {job.job_type}</p>

                    <p>
                      💰 {job.salary || 'Not specified'}
                    </p>

                    <p>{job.description}</p>

                    <p>
                      <strong>Skills:</strong> {job.skills}
                    </p>

                    {renderJobMatch(job)}

                    {renderSaveButton(job)}
                    {renderApplyButton(job)}

                  </div>

                ))}

                {filteredJobs.length === 0 && (
                  <p>No matching jobs found.</p>
                )}

              </section>
            )}

            {/* SAVED JOBS */}

            {activeSection === 'saved-jobs' && (
              <section className="candidate-panel">

                <h2>My Saved Jobs</h2>
                <p>Jobs you bookmarked for later.</p>

                {savedJobs.length === 0 ? (
                  <p>
                    You have not saved any jobs yet.
                    Visit Find Jobs and select ☆ Save Job.
                  </p>
                ) : (
                  savedJobs.map(item => {
                    const job = item.job;
                    if (!job) return null;

                    return (
                      <div
                        className="candidate-job"
                        key={job.id}
                      >
                        <h3>{job.title}</h3>
                        <p>🏢 {job.company}</p>
                        <p>📍 {job.location}</p>
                        <p>💼 {job.job_type}</p>
                        <p>💰 {job.salary || 'Not specified'}</p>
                        <p>{job.description}</p>
                        <p><strong>Skills:</strong> {job.skills}</p>

                        {renderJobMatch(job)}
                        {renderSaveButton(job)}
                        {renderApplyButton(job)}
                      </div>
                    );
                  })
                )}

              </section>
            )}

            {/* MY APPLICATIONS */}

            {activeSection === 'applications' && (
              <section className="candidate-panel">

                <h2>My Job Applications</h2>

                {applications.length === 0 ? (
                  <p>
                    You have not applied for any jobs yet.
                  </p>
                ) : (
                  applications.map(item => {
                    const application = item.application;
                    const job = item.job;

                    return (
                      <div
                        className="candidate-job"
                        key={application.id}
                      >

                        <h3>{job.title}</h3>

                        <p>🏢 {job.company}</p>
                        <p>📍 {job.location}</p>

                        <p>
                          Applied on:{' '}
                          {new Date(
                            application.applied_at
                          ).toLocaleDateString()}
                        </p>

                        <p>
                          Status:{' '}
                          <strong>{application.status}</strong>
                        </p>

                        {renderApplicationTimeline(application.status)}

                      </div>
                    );
                  })
                )}

              </section>
            )}

            {/* UPLOAD PROFILE RESUME */}

            {activeSection === 'resume' && (
              <CandidateResume user={user} />
            )}


            {/* MY PROFILE */}
            {activeSection === 'profile' && (
              <section className="candidate-panel candidate-my-profile">
                <h2>My Professional Profile</h2>
                <p>Complete your profile so recruiters can understand your experience, skills and career goals.</p>

                {profileLoading ? (
                  <p>Loading your profile...</p>
                ) : (
                  <>
                    <div className="candidate-profile-completion">
                      <strong>Profile completion</strong>
                      <span>
                        {Math.round(
                          (Object.values(profileData).filter(value => String(value || '').trim()).length /
                          Object.keys(profileData).length) * 100
                        )}%
                      </span>
                      <div className="candidate-profile-progress">
                        <div style={{
                          width: `${Math.round(
                            (Object.values(profileData).filter(value => String(value || '').trim()).length /
                            Object.keys(profileData).length) * 100
                          )}%`
                        }} />
                      </div>
                    </div>

                    <div className="candidate-profile-form-grid">
                      {profileFields.map(([field, label, type]) => (
                        <label className="candidate-profile-field" key={field}>
                          <span>{label}</span>
                          <input
                            type={type}
                            value={profileData[field] || ''}
                            onChange={event => updateProfileField(field, event.target.value)}
                            placeholder={`Enter ${label.toLowerCase()}`}
                          />
                        </label>
                      ))}
                    </div>

                    <label className="candidate-profile-field candidate-profile-wide">
                      <span>Professional summary / Career objective</span>
                      <textarea rows="4" value={profileData.summary || ''}
                        onChange={event => updateProfileField('summary', event.target.value)}
                        placeholder="Write a short professional summary..." />
                    </label>

                    <label className="candidate-profile-field candidate-profile-wide">
                      <span>Technical and soft skills (comma separated)</span>
                      <textarea rows="3" value={profileData.skills || ''}
                        onChange={event => updateProfileField('skills', event.target.value)}
                        placeholder="Python, SQL, React, Communication..." />
                    </label>

                    <label className="candidate-profile-field candidate-profile-wide">
                      <span>Projects</span>
                      <textarea rows="4" value={profileData.projects || ''}
                        onChange={event => updateProfileField('projects', event.target.value)}
                        placeholder="Add project names, technologies and descriptions..." />
                    </label>

                    <label className="candidate-profile-field candidate-profile-wide">
                      <span>Internships / Work experience</span>
                      <textarea rows="4" value={profileData.internships || ''}
                        onChange={event => updateProfileField('internships', event.target.value)}
                        placeholder="Add internship or work experience details..." />
                    </label>

                    <button type="button" className="analyze-button"
                      onClick={saveCandidateProfile} disabled={profileSaving}>
                      {profileSaving ? 'Saving...' : '💾 Save My Profile'}
                    </button>
                  </>
                )}
              </section>
            )}

            {/* CAREER ASSISTANT */}

            {activeSection === 'career' && (
              <section className="candidate-panel">

                <h2>NEXORA AI Career Assistant</h2>

                <p>
                  Your career assistant will help you with:
                </p>

                <ul>
                  <li>Technical interview preparation</li>
                  <li>Python and SQL practice questions</li>
                  <li>Resume improvement guidance</li>
                  <li>Career planning and job preparation</li>
                </ul>

                <p>
                  Interactive AI chatbot integration is coming soon.
                </p>

              </section>
            )}

          </>

        )}

        <footer className="candidate-footer">
          <p>© 2026 Nexora AI. All rights reserved.</p>
        </footer>

      </main>

    </div>
  );
}

export default CandidateDashboard;
 