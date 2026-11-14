
import { useState } from 'react';
import './SkillGapAnalysis.css';

function SkillGapAnalysis() {
  const [jobRole, setJobRole] = useState('');
  const [skills, setSkills] = useState('');
  const [results, setResults] = useState(null);

  const skillDatabase = {
    'python developer': [
      'Python', 'Flask', 'Django', 'SQL',
      'REST API', 'Git', 'OOP', 'Data Structures'
    ],
    'data analyst': [
      'Python', 'SQL', 'Excel', 'Power BI',
      'Statistics', 'Tableau', 'Pandas', 'Data Visualization'
    ],
    'frontend developer': [
      'HTML', 'CSS', 'JavaScript', 'React',
      'Responsive Design', 'Git', 'REST API'
    ],
    'backend developer': [
      'Python', 'Node.js', 'SQL', 'MongoDB',
      'REST API', 'Git', 'Authentication', 'Database Design'
    ],
    'full stack developer': [
      'HTML', 'CSS', 'JavaScript', 'React',
      'Node.js', 'Express.js', 'MongoDB', 'REST API', 'Git'
    ]
  };

  const analyzeSkills = () => {
    if (!jobRole.trim() || !skills.trim()) {
      alert('Please enter your target job role and existing skills.');
      return;
    }

    const role = jobRole.trim().toLowerCase();

    const requiredSkills = skillDatabase[role];

    if (!requiredSkills) {
      alert(
        'Currently supported roles: Python Developer, Data Analyst, Frontend Developer, Backend Developer and Full Stack Developer.'
      );
      return;
    }

    const candidateSkills = skills
      .split(',')
      .map(skill => skill.trim().toLowerCase())
      .filter(Boolean);

    const matched = requiredSkills.filter(skill =>
      candidateSkills.includes(skill.toLowerCase())
    );

    const missing = requiredSkills.filter(skill =>
      !candidateSkills.includes(skill.toLowerCase())
    );

    const percentage = Math.round(
      (matched.length / requiredSkills.length) * 100
    );

    const roadmap = missing.map((skill, index) => ({
      skill,
      priority: index < 3 ? 'High Priority' : 'Recommended',
      duration: index < 3 ? '1-2 weeks' : '1 week'
    }));

    setResults({
      requiredSkills,
      matched,
      missing,
      percentage,
      roadmap
    });
  };

  return (
    <div className="skill-gap-page">

      <header className="skill-gap-header">
        <div>
          <h1>Skill Gap Analysis</h1>
          <p>
            Discover missing skills and create your career learning roadmap.
          </p>
        </div>

        <span className="skill-gap-brand">NEXORA AI</span>
      </header>

      <div className="skill-gap-container">

        <section className="skill-gap-card">
          <h2>Analyze Your Skills</h2>

          <p>
            Enter your target job role and the skills you currently have.
          </p>

          <label>Target Job Role</label>

          <input
            type="text"
            placeholder="Example: Python Developer"
            value={jobRole}
            onChange={e => {
              setJobRole(e.target.value);
              setResults(null);
            }}
          />

          <label>Your Existing Skills</label>

          <textarea
            placeholder="Example: Python, SQL, HTML, CSS, JavaScript"
            value={skills}
            onChange={e => {
              setSkills(e.target.value);
              setResults(null);
            }}
          />

          <small>Separate each skill using a comma.</small>

          <button onClick={analyzeSkills}>
            Analyze My Skills →
          </button>
        </section>

        {results && (
          <section className="skill-gap-results">

            <div className="skill-gap-card">
              <h2>Your Skill Match</h2>

              <div className="skill-percentage">
                {results.percentage}%
              </div>

              <div className="skill-progress">
                <div
                  className="skill-progress-fill"
                  style={{ width: `${results.percentage}%` }}
                />
              </div>

              <p>
                You match {results.matched.length} out of{' '}
                {results.requiredSkills.length} required skills.
              </p>
            </div>

            <div className="skill-gap-grid">

              <div className="skill-gap-card">
                <h3>Matched Skills</h3>

                {results.matched.length ? (
                  results.matched.map(skill => (
                    <span className="skill-badge matched" key={skill}>
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <p>No matching skills found yet.</p>
                )}
              </div>

              <div className="skill-gap-card">
                <h3>Missing Skills</h3>

                {results.missing.length ? (
                  results.missing.map(skill => (
                    <span className="skill-badge missing" key={skill}>
                      + {skill}
                    </span>
                  ))
                ) : (
                  <p>You have all the listed skills!</p>
                )}
              </div>

            </div>

            <div className="skill-gap-card">
              <h2>Your Learning Roadmap</h2>

              {results.roadmap.length ? (
                results.roadmap.map((item, index) => (
                  <div className="roadmap-item" key={item.skill}>
                    <div className="roadmap-number">
                      {index + 1}
                    </div>

                    <div>
                      <h3>{item.skill}</h3>
                      <p>
                        {item.priority} • Suggested duration: {item.duration}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p>
                  Great work! You have all the skills in this role's
                  current checklist.
                </p>
              )}
            </div>

          </section>
        )}

      </div>
    </div>
  );
}

export default SkillGapAnalysis;
