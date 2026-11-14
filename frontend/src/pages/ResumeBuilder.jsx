
import { useState } from 'react'
import { jsPDF } from 'jspdf'
import './ResumeBuilder.css'

function ResumeBuilder({ user }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    summary: '',
    education: '',
    college: '',
    graduation: '',
    cgpa: '',
    skills: '',
    projects: '',
    experience: '',
    certifications: ''
  })

  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const downloadResume = () => {
    if (!form.name || !form.email || !form.skills) {
      setMessage('Please fill your name, email and skills.')
      return
    }

    const doc = new jsPDF()
    let y = 20

    const addText = (text, size = 11, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(size)

      const lines = doc.splitTextToSize(text || '', 175)

      if (y + lines.length * 6 > 275) {
        doc.addPage()
        y = 20
      }

      doc.text(lines, 17, y)
      y += lines.length * 6 + 4
    }

    const addSection = (heading, content) => {
      if (!content.trim()) return

      y += 3
      addText(heading.toUpperCase(), 13, true)

      doc.setDrawColor(120, 85, 220)
      doc.line(17, y - 2, 193, y - 2)

      addText(content, 10)
    }

    // NAME
    doc.setTextColor(55, 35, 110)
    addText(form.name, 22, true)

    doc.setTextColor(70, 70, 70)

    // CONTACT DETAILS
    const contact = [
      form.email,
      form.phone,
      form.location
    ].filter(Boolean).join(' | ')

    addText(contact, 9)

    if (form.linkedin) addText(`LinkedIn: ${form.linkedin}`, 9)
    if (form.github) addText(`GitHub: ${form.github}`, 9)

    // RESUME SECTIONS
    addSection('Professional Summary', form.summary)

    addSection(
      'Education',
      [
        form.education,
        form.college,
        form.graduation,
        form.cgpa ? `CGPA: ${form.cgpa}` : ''
      ].filter(Boolean).join('\n')
    )

    addSection('Technical Skills', form.skills)

    addSection('Projects', form.projects)

    addSection('Work Experience', form.experience)

    addSection('Certifications', form.certifications)

    doc.save(`${form.name.replace(/\s+/g, '_')}_Resume.pdf`)

    setMessage('Your resume PDF has been downloaded successfully!')
  }

  return (
    <div className="resume-builder-page">

      <header className="resume-builder-header">
        <div>
          <h1>NEXORA <span>AI</span></h1>
          <p>AI-Powered Career Intelligence Platform</p>
        </div>

        <a href="/">← Home</a>
      </header>

      <div className="resume-builder-container">

        <section className="resume-builder-intro">
          <span>CAREER DEVELOPMENT TOOL</span>
          <h2>Build Your Professional Resume</h2>
          <p>
            Create a professional, ATS-friendly resume
            and download it as a PDF.
          </p>
        </section>

        {message && (
          <div className="resume-builder-message">
            {message}
          </div>
        )}

        <form
          className="resume-builder-form"
          onSubmit={(e) => e.preventDefault()}
        >

          <section className="resume-form-section">
            <h2>01. Personal Information</h2>

            <div className="resume-form-grid">

              <div>
                <label>Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label>Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="City, State"
                />
              </div>

              <div>
                <label>LinkedIn Profile</label>
                <input
                  name="linkedin"
                  value={form.linkedin}
                  onChange={handleChange}
                  placeholder="LinkedIn URL"
                />
              </div>

              <div>
                <label>GitHub Profile</label>
                <input
                  name="github"
                  value={form.github}
                  onChange={handleChange}
                  placeholder="GitHub URL"
                />
              </div>

            </div>
          </section>

          <section className="resume-form-section">
            <h2>02. Professional Summary</h2>

            <label>Career Objective / Summary</label>
            <textarea
              name="summary"
              value={form.summary}
              onChange={handleChange}
              placeholder="Write a short professional summary..."
              rows="4"
            />
          </section>

          <section className="resume-form-section">
            <h2>03. Education</h2>

            <div className="resume-form-grid">

              <div>
                <label>Degree</label>
                <input
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="B.Tech - Computer Science"
                />
              </div>

              <div>
                <label>College / University</label>
                <input
                  name="college"
                  value={form.college}
                  onChange={handleChange}
                  placeholder="College name"
                />
              </div>

              <div>
                <label>Graduation Year</label>
                <input
                  name="graduation"
                  value={form.graduation}
                  onChange={handleChange}
                  placeholder="2026"
                />
              </div>

              <div>
                <label>CGPA / Percentage</label>
                <input
                  name="cgpa"
                  value={form.cgpa}
                  onChange={handleChange}
                  placeholder="Example: 7.9 CGPA"
                />
              </div>

            </div>
          </section>

          <section className="resume-form-section">
            <h2>04. Technical Skills</h2>

            <label>Skills *</label>
            <textarea
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="Python, Java, SQL, React, Flask, HTML, CSS..."
              rows="3"
              required
            />
          </section>

          <section className="resume-form-section">
            <h2>05. Projects</h2>

            <label>Project Details</label>
            <textarea
              name="projects"
              value={form.projects}
              onChange={handleChange}
              placeholder="Project name, technologies used and project description..."
              rows="5"
            />
          </section>

          <section className="resume-form-section">
            <h2>06. Work Experience / Internship</h2>

            <label>Experience Details</label>
            <textarea
              name="experience"
              value={form.experience}
              onChange={handleChange}
              placeholder="Company name, role, duration and responsibilities..."
              rows="4"
            />
          </section>

          <section className="resume-form-section">
            <h2>07. Certifications</h2>

            <label>Certifications</label>
            <textarea
              name="certifications"
              value={form.certifications}
              onChange={handleChange}
              placeholder="Enter your certifications..."
              rows="3"
            />
          </section>

          <button
            type="button"
            className="resume-download-button"
            onClick={downloadResume}
          >
            Download My Resume PDF
          </button>

        </form>

      </div>

      <footer className="resume-builder-footer">
        © 2026 NEXORA AI. All rights reserved.
      </footer>

    </div>
  )
}

export default ResumeBuilder
