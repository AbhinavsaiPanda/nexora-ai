
import { useState } from 'react';
import './CareerChatbot.css';

function CareerChatbot({ user }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.name || 'there'}! Welcome to NEXORA AI. Ask me about programming, resumes, interviews, jobs or career guidance!`
    }
  ]);

  const [input, setInput] = useState('');

  const getBotResponse = (question) => {
    const q = question.toLowerCase();

    if (/^(hi|hello|hey)\b/.test(q)) {
      return 'Hello! 👋 How can I help you today?';
    }

    if (q.includes('python')) {
      return 'Python is a beginner-friendly programming language. Important topics include variables, data types, loops, functions, OOP, exception handling, file handling and modules. Would you like Python interview questions or a coding example?';
    }

    if (q.includes('java')) {
      return 'Java is an object-oriented programming language. Learn variables, data types, loops, arrays, classes, inheritance, polymorphism, interfaces and exception handling.';
    }

    if (q.includes('sql') || q.includes('mysql')) {
      return 'SQL is used to manage relational databases. Start with SELECT, INSERT, UPDATE, DELETE, WHERE, GROUP BY, ORDER BY, JOIN, subqueries and aggregate functions.';
    }

    if (q.includes('react')) {
      return 'React is a JavaScript library for building user interfaces. Important concepts include components, JSX, props, state, hooks, useEffect, useState and React Router.';
    }

    if (q.includes('resume') || q.includes('cv')) {
      return 'A good resume should contain contact details, professional summary, technical skills, education, projects, internships and certifications. Use clear formatting and measurable achievements.';
    }

    if (q.includes('interview')) {
      return 'Prepare your self-introduction, technical fundamentals, project explanations, coding questions and HR questions. Practice explaining your projects clearly.';
    }

    if (q.includes('job') || q.includes('career')) {
      return 'For fresher jobs, prepare a role-specific resume, build practical projects, improve technical skills and apply consistently. Explore the Find Jobs section in NEXORA AI.';
    }

    if (q.includes('data analyst')) {
      return 'For Data Analyst roles, focus on Excel, SQL, Python, Pandas, statistics, Power BI, Tableau and data visualization. Build projects using real datasets.';
    }

    if (q.includes('html') || q.includes('css')) {
      return 'HTML creates webpage structure, while CSS controls appearance and layout. Learn semantic HTML, selectors, box model, Flexbox, Grid and responsive design.';
    }

    if (q.includes('javascript')) {
      return 'JavaScript makes websites interactive. Learn variables, functions, arrays, objects, loops, DOM, promises, async/await and ES6 features.';
    }

    if (q.includes('salary')) {
      return 'Fresher salaries vary by company, location, skills and role. Compare the complete offer, including in-hand salary, benefits, work conditions and learning opportunities.';
    }

    if (q.includes('skill') || q.includes('learn')) {
      return 'Choose a target job role, identify its required skills, compare them with your current knowledge and follow a learning roadmap. Explore the Skill Gap Analysis and Learning Hub.';
    }

    if (q.includes('thank')) {
      return 'You are welcome! Keep learning and growing. All the best for your career! 🚀';
    }

    if (q.includes('help') || q.includes('what can you do')) {
      return 'I can help you with Python, Java, SQL, React, HTML, CSS, JavaScript, resume preparation, interview practice, job searching and career guidance. Ask me a question!';
    }

    return 'I am the NEXORA AI free career chatbot. I currently support common questions about programming, resumes, interviews, jobs and career preparation. Try asking a more specific question!';
  };

  const sendMessage = () => {
    const question = input.trim();

    if (!question) return;

    setMessages(previous => [
      ...previous,
      { sender: 'user', text: question },
      { sender: 'bot', text: getBotResponse(question) }
    ]);

    setInput('');
  };

  return (
    <div className="career-chatbot-page">

      <div className="chatbot-header">
        <div>
          <h2>NEXORA AI Assistant</h2>
          <p>Your free career guidance companion</p>
        </div>

        <span className="chatbot-status">
          <span className="status-dot"></span>
          Online
        </span>
      </div>

      <div className="chatbot-messages">

        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.sender}`}
          >
            <div className="message-avatar">
              {message.sender === 'bot' ? 'AI' : 'You'}
            </div>

            <div className="message-content">
              {message.text}
            </div>
          </div>
        ))}

      </div>

      <div className="quick-questions">
        <p>Try asking:</p>

        <div className="quick-question-list">
          {[
            'What is Python?',
            'Give me interview tips',
            'How can I improve my resume?',
            'What is SQL?'
          ].map((question, index) => (
            <button
              key={index}
              onClick={() => setInput(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="chatbot-input-area">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') sendMessage();
          }}
          placeholder="Ask NEXORA AI..."
        />

        <button onClick={sendMessage}>
          Send
        </button>
      </div>

      <p className="chatbot-note">
        NEXORA AI · Free Rule-Based Assistant
      </p>

    </div>
  );
}

export default CareerChatbot;
