
import { useState } from 'react';
import './LearningHub.css';

const tutorials = [
  {
    id: 1,
    title: 'Python Programming',
    category: 'Python',
    level: 'Beginner',
    duration: '4-6 Weeks',
    description: 'Learn Python fundamentals, variables, loops, functions and OOP.',
    topics: ['Python Basics', 'Loops', 'Functions', 'OOP'],
    link: 'https://docs.python.org/3/tutorial/',
    video: 'https://www.youtube.com/results?search_query=python+full+course+for+beginners'
  },
  {
    id: 2,
    title: 'Java Programming',
    category: 'Java',
    level: 'Beginner',
    duration: '5-6 Weeks',
    description: 'Learn Java programming, object-oriented concepts and collections.',
    topics: ['Java Basics', 'OOP', 'Collections', 'Exception Handling'],
    link: 'https://dev.java/learn/',
    video: 'https://www.youtube.com/results?search_query=java+full+course+for+beginners'
  },
  {
    id: 3,
    title: 'SQL and Database Management',
    category: 'SQL',
    level: 'Beginner',
    duration: '3-4 Weeks',
    description: 'Understand SQL queries, joins, subqueries and database design.',
    topics: ['SELECT', 'JOIN', 'Subqueries', 'Database Design'],
    link: 'https://www.w3schools.com/sql/',
    video: 'https://www.youtube.com/results?search_query=sql+full+course+for+beginners'
  },
  {
    id: 4,
    title: 'HTML and CSS',
    category: 'Frontend',
    level: 'Beginner',
    duration: '3 Weeks',
    description: 'Build attractive and responsive websites from scratch.',
    topics: ['HTML', 'CSS', 'Flexbox', 'Responsive Design'],
    link: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    video: 'https://www.youtube.com/results?search_query=html+css+full+course'
  },
  {
    id: 5,
    title: 'JavaScript Development',
    category: 'JavaScript',
    level: 'Intermediate',
    duration: '4 Weeks',
    description: 'Learn modern JavaScript, ES6, DOM and asynchronous programming.',
    topics: ['ES6', 'DOM', 'Promises', 'Async/Await'],
    link: 'https://javascript.info/',
    video: 'https://www.youtube.com/results?search_query=javascript+full+course'
  },
  {
    id: 6,
    title: 'React JS Development',
    category: 'React',
    level: 'Intermediate',
    duration: '4 Weeks',
    description: 'Build interactive web applications using React components and hooks.',
    topics: ['Components', 'Props', 'Hooks', 'Routing'],
    link: 'https://react.dev/learn',
    video: 'https://www.youtube.com/results?search_query=react+js+full+course'
  },
  {
    id: 7,
    title: 'Flask Backend Development',
    category: 'Python',
    level: 'Intermediate',
    duration: '3 Weeks',
    description: 'Create Python backend applications and REST APIs with Flask.',
    topics: ['Flask', 'Routes', 'REST APIs', 'SQLite'],
    link: 'https://flask.palletsprojects.com/en/stable/tutorial/',
    video: 'https://www.youtube.com/results?search_query=python+flask+full+course'
  },
  {
    id: 8,
    title: 'Power BI for Data Analysts',
    category: 'Data Analytics',
    level: 'Beginner',
    duration: '3 Weeks',
    description: 'Learn dashboards, data modelling, visualizations and DAX basics.',
    topics: ['Data Import', 'Power Query', 'DAX', 'Dashboards'],
    link: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi/',
    video: 'https://www.youtube.com/results?search_query=power+bi+full+course'
  },
  {
    id: 9,
    title: 'Excel for Data Analysis',
    category: 'Data Analytics',
    level: 'Beginner',
    duration: '2 Weeks',
    description: 'Learn formulas, pivot tables, charts and data cleaning.',
    topics: ['Formulas', 'VLOOKUP', 'Pivot Tables', 'Charts'],
    link: 'https://support.microsoft.com/en-us/excel',
    video: 'https://www.youtube.com/results?search_query=excel+for+data+analysis+course'
  },
  {
    id: 10,
    title: 'Node.js Backend Development',
    category: 'Backend',
    level: 'Intermediate',
    duration: '4 Weeks',
    description: 'Develop backend applications using Node.js and Express.',
    topics: ['Node.js', 'Express', 'Middleware', 'APIs'],
    link: 'https://nodejs.org/en/learn',
    video: 'https://www.youtube.com/results?search_query=nodejs+express+full+course'
  }
];

const categories = [
  'All',
  'Python',
  'Java',
  'SQL',
  'Frontend',
  'JavaScript',
  'React',
  'Backend',
  'Data Analytics'
];

function LearningHub() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [completed, setCompleted] = useState([]);

  const filteredTutorials = tutorials.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.topics.some(topic =>
        topic.toLowerCase().includes(search.toLowerCase())
      );

    const matchesCategory =
      category === 'All' || item.category === category;

    return matchesSearch && matchesCategory;
  });

  const toggleComplete = (id) => {
    setCompleted(previous =>
      previous.includes(id)
        ? previous.filter(item => item !== id)
        : [...previous, id]
    );
  };

  const progress = Math.round(
    (completed.length / tutorials.length) * 100
  );

  return (
    <div className="learning-hub">

      <header className="learning-header">
        <div>
          <span className="learning-eyebrow">
            NEXORA AI LEARNING CENTER
          </span>

          <h1>Learning Hub</h1>

          <p>
            Learn new skills, improve your knowledge and
            prepare for your dream career.
          </p>
        </div>

        <div className="learning-brand">
          NEXORA <span>AI</span>
        </div>
      </header>

      {/* LEARNING PROGRESS */}

      <section className="learning-progress-card">
        <div className="progress-heading">
          <div>
            <h2>Your Learning Progress</h2>
            <p>Keep learning and achieve your career goals.</p>
          </div>

          <strong>{progress}%</strong>
        </div>

        <div className="learning-progress-bar">
          <div
            className="learning-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p>
          {completed.length} of {tutorials.length} tutorials completed
        </p>
      </section>

      {/* SEARCH */}

      <section className="learning-search-section">
        <h2>Explore Tutorials</h2>

        <input
          type="text"
          placeholder="Search Python, SQL, React, Excel..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="learning-categories">
          {categories.map(item => (
            <button
              key={item}
              className={category === item ? 'selected' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* TUTORIAL CARDS */}

      <section className="tutorial-grid">

        {filteredTutorials.map(item => (
          <article className="tutorial-card" key={item.id}>

            <div className="tutorial-top">
              <span className="tutorial-category">
                {item.category}
              </span>

              <span className="tutorial-level">
                {item.level}
              </span>
            </div>

            <h3>{item.title}</h3>

            <p className="tutorial-description">
              {item.description}
            </p>

            <div className="tutorial-duration">
              <span>⏱ {item.duration}</span>
            </div>

            <div className="tutorial-topics">
              {item.topics.map(topic => (
                <span key={topic}>{topic}</span>
              ))}
            </div>

            <div className="tutorial-actions">

              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="tutorial-learn-button"
              >
                Learn Now →
              </a>

              <a
                href={item.video}
                target="_blank"
                rel="noreferrer"
                className="tutorial-video-button"
              >
                ▶ Videos
              </a>

            </div>

            <button
              className={
                completed.includes(item.id)
                  ? 'complete-button completed'
                  : 'complete-button'
              }
              onClick={() => toggleComplete(item.id)}
            >
              {completed.includes(item.id)
                ? '✓ Completed'
                : 'Mark as Completed'}
            </button>

          </article>
        ))}

        {filteredTutorials.length === 0 && (
          <div className="learning-empty">
            <h3>No tutorials found</h3>
            <p>Try another search or category.</p>
          </div>
        )}

      </section>

      {/* LEARNING RESOURCES */}

      <section className="learning-resources">

        <h2>Free Learning Resources</h2>

        <div className="resource-grid">

          <a
            href="https://www.w3schools.com/"
            target="_blank"
            rel="noreferrer"
          >
            <h3>W3Schools</h3>
            <p>Programming tutorials and examples.</p>
          </a>

          <a
            href="https://www.freecodecamp.org/"
            target="_blank"
            rel="noreferrer"
          >
            <h3>freeCodeCamp</h3>
            <p>Free coding lessons and projects.</p>
          </a>

          <a
            href="https://www.geeksforgeeks.org/"
            target="_blank"
            rel="noreferrer"
          >
            <h3>GeeksforGeeks</h3>
            <p>Programming concepts and interview preparation.</p>
          </a>

          <a
            href="https://www.coursera.org/"
            target="_blank"
            rel="noreferrer"
          >
            <h3>Coursera</h3>
            <p>Online courses and professional learning.</p>
          </a>

        </div>

      </section>

      <footer className="learning-footer">
        © 2026 NEXORA AI. Learn Today, Lead Tomorrow.
      </footer>

    </div>
  );
}

export default LearningHub;
