
import { useState } from 'react'
import './App.css'
import Login from './pages/Login'

function App() {
  const [showLogin, setShowLogin] = useState(false)

  // Show Login and Sign Up page
  if (showLogin) {
    return <Login />
  }

  return (
    <div className="website">

      {/* Navigation */}
      <nav className="navbar">
        <a href="#home" className="logo">
          NEXORA<span> AI</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="nav-buttons">
          <button
            className="login-btn"
            onClick={() => setShowLogin(true)}
          >
            Login
          </button>

          <button
            className="signup-btn"
            onClick={() => setShowLogin(true)}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">

        <div className="hero-content">
          <span className="tag">
            AI-POWERED CAREER INTELLIGENCE PLATFORM
          </span>

          <h1>
            Discover Opportunities.
            <span>Build Your Future.</span>
          </h1>

          <p>
            Find the right jobs, create professional resumes,
            identify skill gaps and prepare for interviews
            with your intelligent career assistant.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() => setShowLogin(true)}
            >
              Explore Nexora AI →
            </button>

            <a href="#features" className="demo-btn">
              ▶ Watch Demo
            </a>
          </div>

          <div className="stats">
            <div>
              <h2>AI</h2>
              <p>Resume Intelligence</p>
            </div>

            <div>
              <h2>24/7</h2>
              <p>Career Assistance</p>
            </div>

            <div>
              <h2>1 Platform</h2>
              <p>Your Career Journey</p>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="dashboard">
          <div className="dashboard-header">
            <strong>Career Overview</strong>
            <span>● Live Preview</span>
          </div>

          <div className="welcome">
            <small>WELCOME TO NEXORA AI</small>
            <h2>Your next opportunity starts here.</h2>
            <p>Build skills. Improve your resume. Get job-ready.</p>
          </div>

          <div className="metrics">
            <div>
              <p>Resume Score</p>
              <h2>85%</h2>
            </div>

            <div>
              <p>Job Matches</p>
              <h2>24</h2>
            </div>
          </div>

          <div className="job">
            <div>
              <strong>Python Developer</strong>
              <p>AI Job Match</p>
            </div>
            <strong className="score">92%</strong>
          </div>

          <div className="job">
            <div>
              <strong>Junior Data Analyst</strong>
              <p>AI Job Match</p>
            </div>
            <strong className="score">85%</strong>
          </div>
        </div>

      </section>

      {/* Features */}
      <section className="features" id="features">

        <div className="section-heading">
          <span>OUR FEATURES</span>
          <h2>Everything you need to grow your career</h2>
          <p>One intelligent platform for your professional journey.</p>
        </div>

        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>AI Resume Builder</h3>
            <p>
              Create professional ATS-friendly resumes with PDF download.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Smart Job Matching</h3>
            <p>
              Find job opportunities based on your skills and interests.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Skill Gap Analysis</h3>
            <p>
              Discover missing skills and get personalized recommendations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Career AI Chatbot</h3>
            <p>
              Get career guidance and interview preparation assistance.
            </p>
          </div>

        </div>
      </section>

      {/* About */}
      <section className="about" id="about">
        <div>
          <span>ABOUT NEXORA AI</span>
          <h2>Connecting talent with opportunity.</h2>
        </div>

        <p>
          Nexora AI helps candidates build better resumes,
          discover suitable jobs and prepare for interviews.
          Recruiters can find and manage suitable candidates
          through one intelligent platform.
        </p>
      </section>

      {/* Contact */}
      <section className="contact" id="contact">
        <span>CONTACT US</span>
        <h2>Let's connect and grow together.</h2>
        <p>Founder: Abhinav Sai Panda</p>
        <p>Email: abhipanda2004@gmail.com</p>
        <p>Phone: +91 9059198071</p>
      </section>

      {/* Footer */}
      <footer>
        <strong>NEXORA AI</strong>
        <p>© 2026 Nexora AI. All rights reserved.</p>
      </footer>

    </div>
  )
}

export default App
