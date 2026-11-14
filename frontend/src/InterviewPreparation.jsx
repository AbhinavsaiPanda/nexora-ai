
import React, { useEffect, useState } from "react";
import api from "./api";
import "./InterviewPreparation.css";

const questionBank = {
  Python: [
    { q: "Which keyword defines a function?", o: ["function", "def", "fun", "define"], a: "def", d: "Beginner", e: "def defines a Python function." },
    { q: "Which data type is immutable?", o: ["List", "Dictionary", "Set", "Tuple"], a: "Tuple", d: "Beginner", e: "Tuples cannot be modified after creation." },
    { q: "What is len('Python')?", o: ["5", "6", "7", "Error"], a: "6", d: "Beginner", e: "Python contains six characters." },
    { q: "Which method adds an item to a list?", o: ["add()", "insert()", "append()", "push()"], a: "append()", d: "Beginner", e: "append() adds an item at the end." },
    { q: "Which block handles exceptions?", o: ["if-else", "try-except", "for-while", "def-return"], a: "try-except", d: "Beginner", e: "try-except handles exceptions." },
    { q: "What does *args collect?", o: ["Keyword arguments", "Positional arguments", "Classes", "Modules"], a: "Positional arguments", d: "Intermediate", e: "*args collects variable positional arguments." },
    { q: "What is a lambda function?", o: ["Anonymous function", "Class", "Loop", "Module"], a: "Anonymous function", d: "Intermediate", e: "A lambda is a small anonymous function." },
    { q: "Which keyword creates a generator?", o: ["return", "yield", "async", "break"], a: "yield", d: "Intermediate", e: "yield produces values lazily." },
    { q: "What is the average dictionary lookup complexity?", o: ["O(n)", "O(log n)", "O(1)", "O(n²)"], a: "O(1)", d: "Advanced", e: "Dictionary lookup is average O(1)." },
    { q: "Which module supports regular expressions?", o: ["math", "re", "os", "sys"], a: "re", d: "Intermediate", e: "The re module provides regular expressions." }
  ],

  Java: [
    { q: "Which keyword declares a class?", o: ["class", "define", "struct", "object"], a: "class", d: "Beginner", e: "class declares a Java class." },
    { q: "What is the Java entry-point method?", o: ["start()", "run()", "main()", "init()"], a: "main()", d: "Beginner", e: "main() is the standard entry point." },
    { q: "Which concept allows inheritance?", o: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction"], a: "Inheritance", d: "Beginner", e: "Inheritance reuses properties and behavior." },
    { q: "Which keyword creates an object?", o: ["class", "new", "this", "static"], a: "new", d: "Beginner", e: "new creates an object." },
    { q: "Which collection prevents duplicates?", o: ["List", "ArrayList", "Set", "Queue"], a: "Set", d: "Beginner", e: "Set stores unique elements." },
    { q: "Which keyword prevents method overriding?", o: ["static", "final", "private", "void"], a: "final", d: "Intermediate", e: "A final method cannot be overridden." },
    { q: "Which interface represents an ordered collection?", o: ["List", "Runnable", "Comparable", "Serializable"], a: "List", d: "Intermediate", e: "List represents an ordered collection." },
    { q: "What does JVM stand for?", o: ["Java Variable Method", "Java Virtual Machine", "Joint Virtual Memory", "Java Verified Module"], a: "Java Virtual Machine", d: "Beginner", e: "JVM executes Java bytecode." },
    { q: "Which area stores objects at runtime?", o: ["Stack", "Heap", "Register", "Cache"], a: "Heap", d: "Advanced", e: "Java objects are allocated in the heap." },
    { q: "Can a Java class extend multiple classes?", o: ["Yes", "No", "Only two", "Only abstract classes"], a: "No", d: "Intermediate", e: "Java classes support single class inheritance." }
  ],

  SQL: [
    { q: "Which SQL command retrieves data?", o: ["GET", "SELECT", "FETCH", "OPEN"], a: "SELECT", d: "Beginner", e: "SELECT retrieves records." },
    { q: "Which clause filters rows?", o: ["ORDER BY", "GROUP BY", "WHERE", "JOIN"], a: "WHERE", d: "Beginner", e: "WHERE filters rows." },
    { q: "Which function counts rows?", o: ["SUM()", "COUNT()", "TOTAL()", "NUMBER()"], a: "COUNT()", d: "Beginner", e: "COUNT() counts rows." },
    { q: "Which command removes a table?", o: ["DELETE", "REMOVE", "DROP", "CLEAR"], a: "DROP", d: "Beginner", e: "DROP removes a database object." },
    { q: "Which key uniquely identifies a row?", o: ["Foreign key", "Primary key", "Index", "Default key"], a: "Primary key", d: "Beginner", e: "A primary key uniquely identifies each row." },
    { q: "Which join returns matching rows from both tables?", o: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "CROSS JOIN"], a: "INNER JOIN", d: "Intermediate", e: "INNER JOIN returns matching records." },
    { q: "Which clause filters grouped results?", o: ["WHERE", "HAVING", "ORDER BY", "LIMIT"], a: "HAVING", d: "Intermediate", e: "HAVING filters groups after aggregation." },
    { q: "Which function returns the highest value?", o: ["TOP()", "HIGH()", "MAX()", "UPPER()"], a: "MAX()", d: "Beginner", e: "MAX() returns the maximum value." },
    { q: "What is database normalization?", o: ["Encrypting data", "Organizing data to reduce redundancy", "Deleting tables", "Sorting records"], a: "Organizing data to reduce redundancy", d: "Advanced", e: "Normalization reduces redundancy and update anomalies." },
    { q: "Which command changes existing records?", o: ["ALTER", "UPDATE", "MODIFY TABLE", "CHANGE"], a: "UPDATE", d: "Intermediate", e: "UPDATE changes existing rows." }
  ],

  "Data Analyst": [
    { q: "Which Python library is used for data analysis?", o: ["Pandas", "Flask", "Django", "Tkinter"], a: "Pandas", d: "Beginner", e: "Pandas supports data manipulation and analysis." },
    { q: "What does KPI stand for?", o: ["Key Performance Indicator", "Known Process Information", "Key Program Integration", "Knowledge Performance Index"], a: "Key Performance Indicator", d: "Beginner", e: "KPIs measure performance against objectives." },
    { q: "Which chart compares categories?", o: ["Bar chart", "Scatter plot", "Map", "Histogram"], a: "Bar chart", d: "Beginner", e: "Bar charts compare category values." },
    { q: "What is data cleaning?", o: ["Deleting all data", "Correcting inaccurate data", "Creating charts", "Writing code"], a: "Correcting inaccurate data", d: "Beginner", e: "Cleaning improves data quality." },
    { q: "Which tool creates interactive dashboards?", o: ["Power BI", "Notepad", "Paint", "Calculator"], a: "Power BI", d: "Beginner", e: "Power BI creates interactive reports." },
    { q: "What does NULL represent in SQL?", o: ["Zero", "Empty string", "Missing or unknown value", "False"], a: "Missing or unknown value", d: "Intermediate", e: "NULL represents an absent or unknown value." },
    { q: "What is the median?", o: ["Most frequent value", "Middle value", "Average", "Largest value"], a: "Middle value", d: "Beginner", e: "Median is the middle value in sorted data." },
    { q: "Which Pandas method previews the first rows?", o: ["tail()", "head()", "info()", "describe()"], a: "head()", d: "Intermediate", e: "head() displays the first rows." },
    { q: "What is an outlier?", o: ["A missing column", "An unusually distant observation", "A duplicate table", "A chart title"], a: "An unusually distant observation", d: "Advanced", e: "Outliers differ substantially from other observations." },
    { q: "What does correlation measure?", o: ["Causation", "Association between variables", "Data size", "Missing values"], a: "Association between variables", d: "Advanced", e: "Correlation measures association." }
  ],

  Frontend: [
    { q: "What does HTML stand for?", o: ["Hyper Text Markup Language", "High Text Machine Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], a: "Hyper Text Markup Language", d: "Beginner", e: "HTML structures web content." },
    { q: "Which CSS property changes text color?", o: ["background", "font-size", "color", "text-style"], a: "color", d: "Beginner", e: "color changes text color." },
    { q: "Which method selects an element by ID?", o: ["getElementById()", "getElement()", "queryAll()", "selectId()"], a: "getElementById()", d: "Beginner", e: "getElementById selects an element by ID." },
    { q: "Which React hook manages state?", o: ["useEffect", "useState", "useRef", "useMemo"], a: "useState", d: "Beginner", e: "useState manages component state." },
    { q: "Which language adds interactivity to web pages?", o: ["HTML", "CSS", "JavaScript", "SQL"], a: "JavaScript", d: "Beginner", e: "JavaScript adds interactive behavior." },
    { q: "What is the virtual DOM?", o: ["A database", "A lightweight UI representation", "A CSS framework", "A browser extension"], a: "A lightweight UI representation", d: "Intermediate", e: "React uses a virtual representation to calculate UI updates." },
    { q: "What does CSS Flexbox help with?", o: ["Database queries", "Layout alignment", "API security", "Image editing"], a: "Layout alignment", d: "Intermediate", e: "Flexbox helps arrange items in a layout." },
    { q: "What does useEffect commonly handle?", o: ["Side effects", "CSS styles", "Class creation", "Database schema"], a: "Side effects", d: "Intermediate", e: "useEffect handles side effects." },
    { q: "What is event bubbling?", o: ["Events moving from child to ancestors", "Events being deleted", "CSS animation", "Page loading"], a: "Events moving from child to ancestors", d: "Advanced", e: "Bubbling propagates events upward through the DOM." },
    { q: "What is a React key used for in lists?", o: ["Encryption", "Identifying elements between renders", "Styling", "Routing"], a: "Identifying elements between renders", d: "Advanced", e: "Keys help React identify list items." }
  ]
};

const hrQuestions = [
  { q: "Tell me about yourself.", a: "I am a recent graduate with a background in computer science. I have worked on academic and personal projects and developed skills in programming, problem-solving and teamwork. I am looking for an opportunity to apply my skills and learn." },
  { q: "What are your strengths?", a: "My strengths include logical problem-solving, adaptability, attention to detail and willingness to learn new technologies." },
  { q: "Why should we hire you?", a: "I have a strong learning mindset, a foundation in relevant technical skills and the motivation to contribute to the team." },
  { q: "Where do you see yourself in five years?", a: "I aim to become a dependable professional with strong technical expertise, contribute to meaningful projects and take on greater responsibilities." },
  { q: "How do you handle pressure?", a: "I prioritize tasks, break complex work into smaller steps, communicate early about blockers and focus on completing important work first." },
  { q: "Why do you want this role?", a: "This role aligns with my skills and career interests. It would allow me to apply what I have learned while developing practical experience." }
];

function InterviewPreparation({ user }) {
  const candidateId = user?.id;
  const [role, setRole] = useState("Python");
  const [difficulty, setDifficulty] = useState("All");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState("test");
  const [openHr, setOpenHr] = useState(-1);

  // Load this candidate's interview history from the Flask/SQLite backend.
  useEffect(() => {
    if (!candidateId) return;

    const loadHistory = async () => {
      setHistoryLoading(true);

      try {
        const response = await api.get(
          `/interview-attempts/${candidateId}`
        );

        const data = response.data;

        setHistory(data.map(item => ({
          id: item.id,
          role: item.role,
          difficulty: item.difficulty,
          score: item.score,
          total: item.total_questions,
          percentage: item.percentage,
          date: item.created_at
            ? new Date(item.created_at).toLocaleString()
            : ""
        })));
      } catch (error) {
        console.error("Interview history error:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [candidateId]);

  const score = questions.filter((q, i) => answers[i] === q.a).length;
  const percentage = questions.length
    ? Math.round(score / questions.length * 100)
    : 0;

  useEffect(() => {
    if (!started || finished) return;

    if (timeLeft <= 0) {
      submitTest();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [started, finished, timeLeft]);

  const formatTime = seconds =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const startTest = () => {
    const available = questionBank[role].filter(
      q => difficulty === "All" || q.d === difficulty
    );

    setQuestions(available);
    setAnswers({});
    setCurrent(0);
    setTimeLeft(900);
    setFinished(false);
    setStarted(true);
    setActiveTab("test");
  };

  const submitTest = async () => {
    if (finished || !questions.length) return;

    const finalScore = questions.filter(
      (q, i) => answers[i] === q.a
    ).length;

    const finalPercentage = Math.round(
      finalScore / questions.length * 100
    );

    setSaveError("");
    setFinished(true);
    setStarted(false);

    if (!candidateId) {
      setSaveError("Your candidate account could not be identified. Please log in again.");
      return;
    }

    try {
      const response = await api.post(
        "/interview-attempts",
        {
          candidate_id: candidateId,
          role,
          difficulty,
          score: finalScore,
          total_questions: questions.length
        }
      );

      const data = response.data;

      const savedAttempt = data.attempt;

      const result = {
        id: savedAttempt.id,
        role: savedAttempt.role,
        difficulty: savedAttempt.difficulty,
        score: savedAttempt.score,
        total: savedAttempt.total_questions,
        percentage: savedAttempt.percentage,
        date: savedAttempt.created_at
          ? new Date(savedAttempt.created_at).toLocaleString()
          : new Date().toLocaleString()
      };

      setHistory(previous => [result, ...previous]);
    } catch (error) {
      console.error("Interview result save error:", error);
      setSaveError(
        `${error.message} Your test result is shown, but it was not saved to your account.`
      );
    }
  };

  const resetTest = () => {
    setStarted(false);
    setFinished(false);
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setTimeLeft(900);
  };

  const switchTab = tab => {
    resetTest();
    setActiveTab(tab);
  };

  return (
    <div className="interview-page">

      <header className="interview-header">
        <div>
          <span className="interview-eyebrow">NEXORA AI CAREER DEVELOPMENT</span>
          <h1>🎤 Interview Preparation</h1>
          <p>Practice smarter. Build confidence. Get interview ready.</p>
        </div>
        <div className="interview-header-icon">✦</div>
      </header>

      <nav className="interview-tabs">
        <button className={activeTab === "test" ? "active" : ""} onClick={() => switchTab("test")}>
          Technical Test
        </button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => switchTab("history")}>
          Performance Dashboard
        </button>
        <button className={activeTab === "hr" ? "active" : ""} onClick={() => switchTab("hr")}>
          HR Practice
        </button>
      </nav>

      {activeTab === "test" && !started && !finished && (
        <section className="interview-card">
          <div className="section-heading">
            <span className="section-icon">📚</span>
            <div>
              <h2>Configure Your Interview</h2>
              <p>Choose your preferred role and difficulty level.</p>
            </div>
          </div>

          <div className="interview-form-grid">
            <div className="form-field">
              <label>Job Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                {Object.keys(questionBank).map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Difficulty Level</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option>All</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          <div className="test-info-grid">
            <div className="info-box">
              <span>⏱</span>
              <strong>15 Minutes</strong>
              <small>Test duration</small>
            </div>
            <div className="info-box">
              <span>📝</span>
              <strong>{questionBank[role].filter(q => difficulty === "All" || q.d === difficulty).length}</strong>
              <small>Questions available</small>
            </div>
            <div className="info-box">
              <span>🎯</span>
              <strong>{difficulty}</strong>
              <small>Difficulty</small>
            </div>
          </div>

          <button className="primary-button" onClick={startTest}>
            Start Interview Test →
          </button>
        </section>
      )}

      {activeTab === "test" && started && questions.length > 0 && (
        <section className="interview-card">
          <div className="test-topbar">
            <div>
              <span className="interview-eyebrow">{role.toUpperCase()} ASSESSMENT</span>
              <h2>Technical Interview</h2>
            </div>
            <div className={`timer ${timeLeft < 60 ? "timer-warning" : ""}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>

          <div className="question-progress">
            <div className="progress-label">
              <span>Question {current + 1} of {questions.length}</span>
              <span>{Math.round((current + 1) / questions.length * 100)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(current + 1) / questions.length * 100}%` }} />
            </div>
          </div>

          <div className="question-area">
            <span className="difficulty-tag">{questions[current].d}</span>
            <h3>{questions[current].q}</h3>

            <div className="answer-options">
              {questions[current].o.map((option, index) => (
                <button
                  key={option}
                  className={`answer-option ${answers[current] === option ? "selected" : ""}`}
                  onClick={() => setAnswers(prev => ({ ...prev, [current]: option }))}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  {option}
                  {answers[current] === option && <span className="selected-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="question-footer">
            <button className="secondary-button" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>
              ← Previous
            </button>

            <span className="answered-count">
              {Object.keys(answers).length} / {questions.length} answered
            </span>

            {current < questions.length - 1 ? (
              <button className="primary-button" onClick={() => setCurrent(c => c + 1)}>
                Next Question →
              </button>
            ) : (
              <button className="primary-button" onClick={submitTest}>
                Submit Test ✓
              </button>
            )}
          </div>

          <button className="finish-button" onClick={submitTest}>
            Finish Test Now
          </button>
        </section>
      )}

      {activeTab === "test" && finished && (
        <section className="interview-card">
          <div className="result-header">
            <span className="result-icon">🏆</span>
            <h2>Test Completed!</h2>
            <p>Your interview practice results</p>
            <div className="result-score">{percentage}%</div>
            <h3>{score} correct out of {questions.length}</h3>
            {saveError && (
              <p className="save-error" role="alert">{saveError}</p>
            )}
            {!saveError && (
              <p className="save-success">Your result has been saved to your account.</p>
            )}
            <p>
              {percentage >= 80
                ? "Excellent work! Keep practising."
                : percentage >= 50
                ? "Good effort. Review the explanations."
                : "Keep learning and try again."}
            </p>
          </div>

          <h2 className="review-title">Answer Review</h2>

          {questions.map((q, i) => (
            <div className="review-item" key={i}>
              <strong>{i + 1}. {q.q}</strong>
              <p>Your answer: {answers[i] || "Not answered"}</p>
              <p className="correct-answer">Correct answer: {q.a}</p>
              <p className="explanation">{q.e}</p>
            </div>
          ))}

          <button className="primary-button" onClick={resetTest}>
            Take Another Test
          </button>
          <button className="secondary-button" onClick={() => switchTab("history")}>
            View Performance
          </button>
        </section>
      )}

      {activeTab === "history" && (
        <section className="interview-card">
          <div className="section-heading">
            <span className="section-icon">📊</span>
            <div>
              <h2>Performance Dashboard</h2>
              <p>Monitor your interview preparation progress.</p>
            </div>
          </div>

          <div className="performance-grid">
            <div className="performance-card">
              <span>📝</span>
              <h2>{history.length}</h2>
              <p>Tests Taken</p>
            </div>
            <div className="performance-card">
              <span>📈</span>
              <h2>{history.length ? Math.round(history.reduce((s, h) => s + h.percentage, 0) / history.length) : 0}%</h2>
              <p>Average Score</p>
            </div>
            <div className="performance-card">
              <span>🏆</span>
              <h2>{history.length ? Math.max(...history.map(h => h.percentage)) : 0}%</h2>
              <p>Best Score</p>
            </div>
          </div>

          <h3 className="history-heading">Recent Test History</h3>

          {historyLoading ? (
            <div className="empty-state">
              <p>Loading your interview history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <span>📋</span>
              <h3>No test history yet</h3>
              <p>Complete a technical test to see your results here.</p>
            </div>
          ) : (
            history.map(item => (
              <div className="history-item" key={item.id}>
                <div>
                  <strong>{item.role}</strong>
                  <p>{item.difficulty} · {item.score}/{item.total} correct</p>
                  <small>{item.date}</small>
                </div>
                <div className="history-score">{item.percentage}%</div>
              </div>
            ))
          )}

          <p className="history-storage-note">
            Your interview results are saved to your NEXORA AI account.
          </p>
        </section>
      )}

      {activeTab === "hr" && (
        <section className="interview-card">
          <div className="section-heading">
            <span className="section-icon">🤝</span>
            <div>
              <h2>HR Interview Practice</h2>
              <p>Learn how to answer common HR interview questions.</p>
            </div>
          </div>

          <div className="hr-list">
            {hrQuestions.map((item, index) => (
              <div className="hr-item" key={index}>
                <button
                  className="hr-question"
                  onClick={() => setOpenHr(openHr === index ? -1 : index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item.q}
                  <b>{openHr === index ? "−" : "+"}</b>
                </button>

                {openHr === index && (
                  <div className="hr-answer">
                    <strong>Sample Answer</strong>
                    <p>{item.a}</p>
                    <small>Tip: Personalize this answer using your own experience.</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="interview-footer">
        <span>✦ NEXORA AI</span>
        <p>Practice today. Perform better tomorrow.</p>
      </footer>
    </div>
  );
}

export default InterviewPreparation;
