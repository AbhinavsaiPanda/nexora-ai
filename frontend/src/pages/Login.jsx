
import { useState } from 'react'
import api from '../api'
import './Login.css'
import CandidateDashboard from './CandidateDashboard'
import RecruiterDashboard from './RecruiterDashboard'

function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState('candidate')
  const [dashboardRole, setDashboardRole] = useState('')
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    setLoading(true)

    try {
      const endpoint = isLogin ? '/login' : '/register'

      const payload = isLogin
        ? {
            email: formData.email,
            password: formData.password
          }
        : {
            name: formData.name,
            company: formData.company,
            email: formData.email,
            password: formData.password,
            role
          }

      const response = await api.post(endpoint, payload)

      if (isLogin) {
        const user = response.data.user
        const token = response.data.access_token

        if (!token) {
          throw new Error('Login succeeded but no authentication token was received.')
        }

        localStorage.setItem('nexora_token', token)

        setLoggedInUser(user)
        setDashboardRole(user.role)

      } else {
        alert('Registration successful! Please login.')

        setIsLogin(true)

        setFormData({
          name: '',
          company: '',
          email: formData.email,
          password: '',
          confirmPassword: ''
        })
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to the server. Check whether Flask is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Candidate Dashboard
  if (dashboardRole === 'candidate' && loggedInUser) {
    return <CandidateDashboard user={loggedInUser} />
  }

  // Recruiter Dashboard
  if (dashboardRole === 'recruiter' && loggedInUser) {
    return <RecruiterDashboard user={loggedInUser} />
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <a href="/" className="auth-logo">
          NEXORA <span>AI</span>
        </a>

        <h1>
          {isLogin ? 'Welcome Back!' : 'Create Your Account'}
        </h1>

        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to continue your career journey.'
            : 'Join Nexora AI and build your future.'}
        </p>

        <div className="role-select">
          <button
            type="button"
            className={role === 'candidate' ? 'active' : ''}
            onClick={() => setRole('candidate')}
          >
            Candidate
          </button>

          <button
            type="button"
            className={role === 'recruiter' ? 'active' : ''}
            onClick={() => setRole('recruiter')}
          >
            Recruiter
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <>
              <label>Full Name</label>

              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              {role === 'recruiter' && (
                <>
                  <label>Company Name</label>

                  <input
                    type="text"
                    name="company"
                    placeholder="Enter company name"
                    value={formData.company}
                    onChange={handleChange}
                    required
                  />
                </>
              )}
            </>
          )}

          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {!isLogin && (
            <>
              <label>Confirm Password</label>

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </>
          )}

          {error && (
            <p style={{ color: '#ff6b6b' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? 'Login to Account'
                : 'Create Account'}
          </button>

        </form>

        <p className="auth-switch">
          {isLogin
            ? "Don't have an account?"
            : 'Already have an account?'}

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>

        <a href="/" className="back-home">
          ← Back to Home
        </a>

      </div>
    </div>
  )
}

export default Login
