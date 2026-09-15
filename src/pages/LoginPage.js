import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, saveAuthData } from '../services/api'; // ✅ Updated import path
import { queryClient } from '../index';
import './LoginPage.css';

import res1 from './res1.jpg';
import res2 from './res2.jpg';
import res3 from './res3.jpg';
import logo from './logo.svg';

const SLIDES = [
  { img: res1, label: 'Smart Classrooms' },
  { img: res2, label: 'Campus Life' },
  { img: res3, label: 'Exam Halls' },
];

/* ---------- Crisp SVG icon set (replaces emojis) ---------- */
const Svg = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  />
);

const Icons = {
  admin: (
    <Svg>
      <path d="M12 3l7 3v5.2c0 4.3-2.9 8.3-7 9.8-4.1-1.5-7-5.5-7-9.8V6l7-3z" />
      <path d="M9.2 12.3l1.9 1.9 3.7-4.2" />
    </Svg>
  ),
  teacher: (
    <Svg>
      <path d="M2 4.5h6.5A3.5 3.5 0 0 1 12 8v12a3 3 0 0 0-3-3H2V4.5z" />
      <path d="M22 4.5h-6.5A3.5 3.5 0 0 0 12 8v12a3 3 0 0 1 3-3h7V4.5z" />
    </Svg>
  ),
  student: (
    <Svg>
      <path d="M22 9.5l-10-5-10 5 10 5 10-5z" />
      <path d="M6.5 11.8v4.4c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.4" />
      <path d="M22 9.5V14" />
    </Svg>
  ),
  school: (
    <Svg>
      <path d="M3 21h18" />
      <path d="M5 21V8l7-5 7 5v13" />
      <path d="M9.5 21v-4.5h5V21" />
      <path d="M9.5 10.5h.01M14.5 10.5h.01M9.5 14h.01M14.5 14h.01" />
    </Svg>
  ),
  user: (
    <Svg>
      <path d="M20 21v-1.8a4.2 4.2 0 0 0-4.2-4.2H8.2A4.2 4.2 0 0 0 4 19.2V21" />
      <circle cx="12" cy="8" r="4" />
    </Svg>
  ),
  lock: (
    <Svg>
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2.5" />
    </Svg>
  ),
  hash: (
    <Svg>
      <path d="M4.5 9.5h15M4.5 14.5h15M10 3.5L8 20.5M16 3.5l-2 17" />
    </Svg>
  ),
  shield: (
    <Svg>
      <path d="M12 3l7 3v5.2c0 4.3-2.9 8.3-7 9.8-4.1-1.5-7-5.5-7-9.8V6l7-3z" />
    </Svg>
  ),
  zap: (
    <Svg>
      <path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" />
    </Svg>
  ),
  users: (
    <Svg>
      <path d="M17 21v-1.8a4.2 4.2 0 0 0-4.2-4.2H6.2A4.2 4.2 0 0 0 2 19.2V21" />
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M22 21v-1.8a4.2 4.2 0 0 0-3.2-4.07" />
      <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8" />
    </Svg>
  ),
  alert: (
    <Svg>
      <path d="M12 3L2.5 19.5h19L12 3z" />
      <path d="M12 9.5V14" />
      <path d="M12 17h.01" />
    </Svg>
  ),
  eye: (
    <Svg width="18" height="18">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  eyeOff: (
    <Svg width="18" height="18">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </Svg>
  ),
  arrow: (
    <Svg width="18" height="18">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  ),
};

/* ---------- Extract subdomain (e.g., DAT2024001 from DAT2024001.yourapp.com) ---------- */
const getSubdomain = () => {
  const host = window.location.hostname;
  const parts = host.split('.');
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0].toUpperCase();
  }
  return null;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    admissionNumber: '',
    firstName: '',
  });

  const detectedSchoolCode = getSubdomain();
  const [schoolCode, setSchoolCode] = useState(detectedSchoolCode || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    { id: 'admin', label: 'Admin', icon: Icons.admin },
    { id: 'teacher', label: 'Teacher', icon: Icons.teacher },
    { id: 'student', label: 'Student', icon: Icons.student },
  ];
  const activeRole = roles.find((r) => r.id === selectedRole);
  const roleIndex = roles.findIndex((r) => r.id === selectedRole);

  /* ==================== SLIDESHOW ==================== */
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5500);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const goToSlide = (index) => setCurrentSlide(index);

  /* ==================== FORM ==================== */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;

      if (selectedRole === 'admin' || selectedRole === 'teacher') {
        if (!formData.username || !formData.password) {
          setError('Username and password are required');
          setLoading(false);
          return;
        }
        result = await authAPI.login({
          role: selectedRole,
          username: formData.username,
          password: formData.password,
          schoolCode: schoolCode,
        });
      } else if (selectedRole === 'student') {
        if (!formData.admissionNumber || !formData.firstName) {
          setError('Admission Number and First Name are required');
          setLoading(false);
          return;
        }
        result = await authAPI.loginStudent({
          admissionNumber: formData.admissionNumber,
          firstName: formData.firstName,
          schoolCode: schoolCode,
        });
      }

      if (result.success) {
        queryClient.clear();
        // ✅ result.user now automatically contains `lockedModules` from the backend
        saveAuthData(result.token, result.user);
        
        switch (result.user.role) {
          case 'admin': navigate('/admin'); break;
          case 'teacher': navigate('/teacher'); break;
          case 'student': navigate('/student'); break;
          default: navigate('/');
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const marqueeContent = (
    <>
      <span>BimTech Solutions — IoT Developers</span>
      <span className="mq-sep">◆</span>
      <span>BimTech Solutions — IoT Developers</span>
      <span className="mq-sep">◆</span>
      <span>BimTech Solutions — IoT Developers</span>
      <span className="mq-sep">◆</span>
      <span>BimTech Solutions — IoT Developers</span>
      <span className="mq-sep">◆</span>
    </>
  );

  return (
    <div className="login-page">
      {/* ======== Ambient background effects ======== */}
      <div className="bg-fx">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="noise" />
      </div>

      {/* ======== LEFT — Brand / Showcase panel ======== */}
      <aside className="brand-panel">
        <div className="brand-top">
          <div className="brand-mark">
            <img src={logo} alt="CBT System Logo" />
          </div>
          <div>
            <div className="brand-name">BimTech SaaS</div>
            <div className="brand-sub">CBT Platform</div>
          </div>
        </div>

        <h1 className="brand-headline">
          Smarter exams.
          <br />
          <span className="grad-text">Seamless learning.</span>
        </h1>
        <p className="brand-copy">
          One secure platform for administrators, teachers and students —
          run computer-based tests with total confidence.
        </p>

        {/* Showcase slideshow */}
        <div className="showcase">
          <div className="showcase-frame">
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`showcase-slide ${currentSlide === i ? 'active' : ''}`}
                style={{ backgroundImage: `url(${slide.img})` }}
              />
            ))}
            <div className="showcase-scrim" />
            <div className="showcase-caption">
              <span className="caption-index">0{currentSlide + 1}</span>
              <span className="caption-label">{SLIDES[currentSlide].label}</span>
            </div>
          </div>
          <div className="showcase-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                className={`dot ${currentSlide === i ? 'active' : ''}`}
                onClick={() => goToSlide(i)}
              />
            ))}
          </div>
        </div>

        <div className="brand-features">
          <span className="feature-chip">{Icons.shield} Secure &amp; Encrypted</span>
          <span className="feature-chip">{Icons.zap} Real-time Results</span>
          <span className="feature-chip">{Icons.users} Multi-role Access</span>
        </div>
      </aside>

      {/* ======== RIGHT — Form panel ======== */}
      <main className="form-panel">
        <div className="login-card">
          {/* Compact brand — only visible on mobile */}
          <div className="card-brand">
            <div className="brand-mark">
              <img src={logo} alt="CBT System Logo" />
            </div>
            <div>
              <div className="brand-name">BimTech SaaS</div>
              <div className="brand-sub">CBT Platform</div>
            </div>
          </div>

          <header className="card-header">
            <div className="card-badge">{Icons.lock}</div>
            <h2 className="card-title">Welcome back</h2>
            <p className="card-sub">Sign in to continue to your dashboard</p>
          </header>

          {/* Role switcher with sliding indicator */}
          <div className="role-switch" role="tablist" aria-label="Select role">
            <span
              className="role-glider"
              style={{ transform: `translateX(${roleIndex * 100}%)` }}
            />
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                role="tab"
                aria-selected={selectedRole === role.id}
                className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedRole(role.id);
                  setError('');
                }}
              >
                {role.icon}
                <span className="role-label">{role.label}</span>
              </button>
            ))}
          </div>

          {/* Detected school badge */}
          {detectedSchoolCode && (
            <div className="school-row">
              <span className="school-pill">
                <span className="pulse-dot" />
                {Icons.school}
                School: {detectedSchoolCode}
              </span>
            </div>
          )}

          {error && (
            <div className="alert-error" role="alert">
              {Icons.alert}
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* ---- Admin / Teacher fields ---- */}
            {(selectedRole === 'admin' || selectedRole === 'teacher') && (
              <>
                {!detectedSchoolCode && (
                  <div className="field">
                    <label className="field-label" htmlFor="schoolCode">
                      School Code
                    </label>
                    <span className="field-icon">{Icons.school}</span>
                    <input
                      id="schoolCode"
                      type="text"
                      className="field-control"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                      required={selectedRole === 'teacher'}
                      placeholder={selectedRole === 'admin' ? 'Leave blank if Super Admin' : 'e.g. DAT2024001'}
                      autoComplete="organization"
                    />
                  </div>
                )}

                <div className="field">
                  <label className="field-label" htmlFor="username">
                    Username
                  </label>
                  <span className="field-icon">{Icons.user}</span>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    className="field-control"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="password">
                    Password
                  </label>
                  <span className="field-icon">{Icons.lock}</span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="field-control has-toggle"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
              </>
            )}

            {/* ---- Student fields ---- */}
            {selectedRole === 'student' && (
              <>
                <div className="info-banner">
                  {Icons.student}
                  <span>Student access — no password needed, just verify your identity.</span>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="admissionNumber">
                    Admission Number
                  </label>
                  <span className="field-icon">{Icons.hash}</span>
                  <input
                    id="admissionNumber"
                    type="text"
                    name="admissionNumber"
                    className="field-control"
                    value={formData.admissionNumber}
                    onChange={handleChange}
                    placeholder="e.g. DIS/2025/001"
                    required
                    autoFocus
                  />
                </div>

                <div className="divider">
                  <span>verify identity</span>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="firstName">
                    First Name
                  </label>
                  <span className="field-icon">{Icons.user}</span>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    className="field-control"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in as {activeRole.label}
                  <span className="btn-arrow">{Icons.arrow}</span>
                </>
              )}
            </button>

            <p className="secure-note">
              {Icons.shield} Secured connection — credentials are encrypted end-to-end
            </p>
          </form>

          <footer className="card-footer">
            <span>© {new Date().getFullYear()} BimTech SaaS Solutions</span>
            <span className="footer-dot">•</span>
            <span>Secure Computer Based Testing System</span>
          </footer>
        </div>
      </main>

      {/* ======== Bottom marquee ======== */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {marqueeContent}
          {marqueeContent}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;