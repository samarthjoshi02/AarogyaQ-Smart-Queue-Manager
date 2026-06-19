import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import io from 'socket.io-client';
import { 
  Activity, 
  Users, 
  Clock, 
  Settings, 
  TrendingUp, 
  Trophy, 
  ShieldAlert, 
  LogOut, 
  Tv, 
  ChevronRight, 
  Bell, 
  Heart,
  Database,
  Download,
  Mail,
  Phone,
  ShieldCheck,
  HeartPulse,
  User,
  HeartCrack,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Component imports
import StatsCard from './components/StatsCard';
import AddPatientForm from './components/AddPatientForm';
import QueueTable from './components/QueueTable';
import QueueControls from './components/QueueControls';
import ConsultationSettings from './components/ConsultationSettings';
import DailyAnalytics from './components/DailyAnalytics';
import WaitingRoomHeader, { AarogyaQLogo } from './components/WaitingRoomHeader';
import NowServingCard from './components/NowServingCard';
import TokenLookup from './components/TokenLookup';
import LiveNotification from './components/LiveNotification';

// Connect to backend port 5000 dynamically
const SOCKET_URL = window.location.protocol + '//' + window.location.hostname + ':5000';
let socket;

// -------------------------------------------------------------
// Component: SaasFooter (Shared Footer)
// -------------------------------------------------------------
function SaasFooter() {
  return (
    <footer className="saas-footer">
      <div className="saas-footer-grid">
        <div className="saas-footer-col">
          <h5 style={{ color: '#38BDF8', fontWeight: 800, fontSize: '18px' }}>AarogyaQ</h5>
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#94A3B8' }}>
            Know Your Turn. Value Your Time.<br />
            Revolutionizing paper-token hospital waiting systems with real-time queues, simulated logins, and direct Excel synchronization.
          </p>
        </div>
        <div className="saas-footer-col">
          <h5>Patient Portals</h5>
          <ul className="saas-footer-links">
            <li><Link to="/waiting-room">Live TV Waiting Room</Link></li>
            <li><Link to="/patient-portal">My Token Status</Link></li>
            <li><Link to="/">Sign In / OTP Portal</Link></li>
          </ul>
        </div>
        <div className="saas-footer-col">
          <h5 style={{ color: '#F87171' }}>Emergency Helpline</h5>
          <ul className="saas-footer-links" style={{ color: '#F87171', fontWeight: 600 }}>
            <li>🚑 Ambulance Desk: 108 / 102</li>
            <li>📞 Emergency Hotline: +91 98765 00000</li>
            <li>🏥 Blood Bank Desk: +91 98765 99999</li>
          </ul>
        </div>
        <div className="saas-footer-col">
          <h5>Contact Desk</h5>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>
            Email: <a href="mailto:support@aarogyaq.com" style={{ color: '#38BDF8' }}>support@aarogyaq.com</a><br />
            Phone: +91 98765 43210<br />
            Address: Health Plaza, Sector 15, Pune, MH, India
          </p>
        </div>
      </div>
      <div className="saas-footer-bottom">
        <div>© 2026 AarogyaQ Systems Private Limited. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Security</a>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const [isConnected, setIsConnected] = useState(false);
  const [queue, setQueue] = useState([]);
  const [activeQueue, setActiveQueue] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [avgConsultationTime, setAvgConsultationTime] = useState(7);
  const [currentToken, setCurrentToken] = useState('');
  
  const [selectedToken, setSelectedToken] = useState(null);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Session state for Patient Portal
  const [patientUser, setPatientUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aarogyaq_patient_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to server.');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected from server.');
    });

    // Listen to queue updates from server
    socket.on('queueUpdated', (data) => {
      setQueue(data.queue);
      setActiveQueue(data.active);
      setAnalytics(data.analytics);
      setAvgConsultationTime(data.averageConsultationTime);
      setCurrentToken(data.currentToken);
    });

    // Listen for new patient notifications
    socket.on('tokenCalled', (data) => {
      setCurrentNotification(data);
      // Clear announcement banner after 5.8s (corresponds to CSS animation duration)
      const timer = setTimeout(() => {
        setCurrentNotification(null);
      }, 5800);
      return () => clearTimeout(timer);
    });

    // Listen for consultation time updates (redundancy check)
    socket.on('consultationTimeUpdated', (data) => {
      setAvgConsultationTime(data.minutes);
    });

    // Handle toast confirmations when patient gets added
    socket.on('patientAdded', (res) => {
      if (res.success) {
        addToast({
          id: Date.now(),
          type: 'success',
          message: `Patient Added Successfully! Token Generated: ${res.patient.tokenNumber}`
        });

        // Link patient token dynamically if matched by mobile number
        setPatientUser((prev) => {
          if (prev && prev.mobile === res.patient.mobile) {
            const updated = { ...prev, tokenNumber: res.patient.tokenNumber };
            localStorage.setItem('aarogyaq_patient_user', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      } else {
        addToast({
          id: Date.now(),
          type: 'error',
          message: `Error adding patient: ${res.error}`
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Toast Helper
  const addToast = (toastObj) => {
    setToasts((prev) => [...prev, toastObj]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastObj.id));
    }, 4000);
  };

  // Actions
  const handleAddPatient = (patientData) => {
    socket.emit('addPatient', patientData);
  };

  const handleCallNext = () => {
    socket.emit('callNext');
    setSelectedToken(null);
  };

  const handleCancelToken = (tokenNumber) => {
    socket.emit('cancelToken', { tokenNumber });
    setSelectedToken(null);
    
    // Clear token links from the logged-in patient if they cancelled their own token
    setPatientUser((prev) => {
      if (prev && prev.tokenNumber === tokenNumber) {
        const updated = { ...prev, tokenNumber: null };
        localStorage.setItem('aarogyaq_patient_user', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    addToast({
      id: Date.now(),
      type: 'success',
      message: `Token ${tokenNumber} Cancelled Successfully.`
    });
  };

  const handleSaveConsultationTime = (minutes) => {
    socket.emit('updateConsultationTime', { minutes });
  };

  const handleResetConsultationTime = () => {
    socket.emit('updateConsultationTime', { minutes: 7 });
  };

  const handleResetQueue = () => {
    if (window.confirm('WARNING: Are you sure you want to delete and reset the entire queue for today? This cannot be undone.')) {
      socket.emit('resetQueue');
      setSelectedToken(null);
      addToast({
        id: Date.now(),
        type: 'success',
        message: 'Queue reset successfully.'
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/download-excel`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AarogyaQ_Queue_Data.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast({
        id: Date.now(),
        type: 'success',
        message: 'Excel report downloaded successfully.'
      });
    } catch (error) {
      console.error('[Export Excel] Error:', error);
      addToast({
        id: Date.now(),
        type: 'error',
        message: 'Failed to download Excel report.'
      });
    }
  };

  const nextWaitingToken = activeQueue.find(p => p.status === 'waiting')?.tokenNumber || '';

  return (
    <>
      {/* Toast Manager */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : ''}`}>
            <Bell size={20} color={t.type === 'error' ? 'var(--error)' : 'var(--success)'} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>
                {t.type === 'success' ? 'Success' : 'Error'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.message}</div>
            </div>
          </div>
        ))}
      </div>

      <Routes>
        {/* LANDING PAGE / LOGIN PORTAL */}
        <Route path="/" element={<LandingPage patientUser={patientUser} setPatientUser={setPatientUser} />} />

        {/* RECEPTIONIST PORTAL */}
        <Route path="/receptionist" element={
          <ReceptionistPortal
            queue={queue}
            activeQueue={activeQueue}
            analytics={analytics}
            avgConsultationTime={avgConsultationTime}
            currentToken={currentToken}
            selectedToken={selectedToken}
            setSelectedToken={setSelectedToken}
            nextWaitingToken={nextWaitingToken}
            handleAddPatient={handleAddPatient}
            handleCallNext={handleCallNext}
            handleCancelToken={handleCancelToken}
            handleSaveConsultationTime={handleSaveConsultationTime}
            handleResetConsultationTime={handleResetConsultationTime}
            handleResetQueue={handleResetQueue}
            handleExportExcel={handleExportExcel}
            isConnected={isConnected}
          />
        } />

        {/* PATIENT WAITING ROOM */}
        <Route path="/waiting-room" element={
          <PatientWaitingRoom
            queue={queue}
            activeQueue={activeQueue}
            averageConsultationTime={avgConsultationTime}
            currentToken={currentToken}
            currentNotification={currentNotification}
          />
        } />

        {/* PATIENT PERSONAL ACCOUNT DASHBOARD */}
        <Route path="/patient-portal" element={
          <PatientPortalDashboard
            activeQueue={activeQueue}
            allPatients={queue}
            averageConsultationTime={avgConsultationTime}
            currentToken={currentToken}
            patientUser={patientUser}
            setPatientUser={setPatientUser}
            onJoinQueue={handleAddPatient}
            onCancelToken={handleCancelToken}
          />
        } />
      </Routes>
    </>
  );
}

// -------------------------------------------------------------
// Component: LandingPage
// -------------------------------------------------------------
function LandingPage({ patientUser, setPatientUser }) {
  const navigate = useNavigate();
  
  // Tab control: 'patient' or 'receptionist'
  const [loginTab, setLoginTab] = useState('patient');
  
  // Receptionist credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [receptionistError, setReceptionistError] = useState('');

  // Patient simulated credentials
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [otpMobile, setOtpMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSentCode, setOtpSentCode] = useState('');
  const [otpInputs, setOtpInputs] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [showSmsToast, setShowSmsToast] = useState(false);

  // Focus effect for OTP digit input shifting
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // OTP Countdown timer effect
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Receptionist sign in check
  const handleReceptionistLogin = (e) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === 'admin' && password === 'admin123') {
      navigate('/receptionist');
    } else {
      setReceptionistError('Invalid credentials. Use admin / admin123');
    }
  };

  // Google OAuth simulator action
  const handleGoogleLogin = (mockEmail, mockName) => {
    setShowGoogleModal(false);
    
    // Create profile structure matching DB requirements
    const profile = {
      name: mockName,
      email: mockEmail,
      mobile: mockEmail === 'guest.patient@gmail.com' ? '' : '9876543210',
      age: mockEmail === 'guest.patient@gmail.com' ? '' : '28',
      gender: 'Male',
      bloodGroup: 'O+',
      conditions: 'None',
      tokenNumber: null
    };

    setPatientUser(profile);
    localStorage.setItem('aarogyaq_patient_user', JSON.stringify(profile));
    navigate('/patient-portal');
  };

  // OTP Mobile send action
  const handleSendOtp = (e) => {
    e.preventDefault();
    setOtpError('');
    
    if (!/^\d{10}$/.test(otpMobile.trim())) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Generate random 4-digit code
    const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    setOtpSentCode(generatedCode);
    setOtpSent(true);
    setOtpTimer(45); // Countdown 45s
    setShowSmsToast(true);

    // Auto focus first OTP input box after DOM updates
    setTimeout(() => {
      if (otpRefs[0].current) otpRefs[0].current.focus();
    }, 100);

    // Hide SMS simulation box after 8 seconds
    setTimeout(() => {
      setShowSmsToast(false);
    }, 8000);
  };

  // Handle input changes on OTP boxes (auto shifts focus)
  const handleOtpInputChange = (index, value) => {
    if (isNaN(value)) return;
    const newInputs = [...otpInputs];
    newInputs[index] = value.slice(-1); // store single digit
    setOtpInputs(newInputs);

    // Shift to next box
    if (value && index < 3 && otpRefs[index + 1].current) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace: shift focus back
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0 && otpRefs[index - 1].current) {
      otpRefs[index - 1].current.focus();
    }
  };

  // Verify OTP submission
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setOtpError('');

    const enteredCode = otpInputs.join('');
    if (enteredCode.length < 4) {
      setOtpError('Please input all 4 digits.');
      return;
    }

    if (enteredCode === otpSentCode) {
      // Login successful!
      const profile = {
        name: 'Patient (Mobile Login)',
        email: '',
        mobile: otpMobile,
        age: '',
        gender: 'Male',
        bloodGroup: 'B+',
        conditions: '',
        tokenNumber: null
      };

      setPatientUser(profile);
      localStorage.setItem('aarogyaq_patient_user', JSON.stringify(profile));
      navigate('/patient-portal');
    } else {
      setOtpError('Incorrect OTP code. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Simulated SMS popup at top-right */}
      {showSmsToast && (
        <div className="sms-simulation-toast">
          <div style={{ fontSize: '24px' }}>💬</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#38BDF8' }}>SMS from AarogyaQ</div>
            <p style={{ fontSize: '12px', marginTop: '4px', lineHeight: 1.4 }}>
              Your verification code is <strong style={{ color: '#FFFFFF', fontSize: '14px', borderBottom: '1px dashed #38BDF8' }}>{otpSentCode}</strong>. Valid for 5 minutes.
            </p>
          </div>
        </div>
      )}

      <div className="portal-selection-container" style={{ flexGrow: 1 }}>
        <div className="portal-card" style={{ padding: '36px 32px' }}>
          <AarogyaQLogo size={64} showText={true} />

          {/* Toggle Tabs */}
          <div className="login-tabs" style={{ marginTop: '24px' }}>
            <div 
              className={`login-tab ${loginTab === 'patient' ? 'active' : ''}`}
              onClick={() => setLoginTab('patient')}
            >
              Patient Login
            </div>
            <div 
              className={`login-tab ${loginTab === 'receptionist' ? 'active' : ''}`}
              onClick={() => setLoginTab('receptionist')}
            >
              Clinic Admin
            </div>
          </div>

          {/* TAB 1: PATIENT SIGN IN PORTAL */}
          {loginTab === 'patient' && (
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
                Access your medical dashboard, update profile details, and book queue tokens.
              </p>

              {/* Google Sign In option */}
              <button 
                type="button" 
                className="google-btn"
                onClick={() => setShowGoogleModal(true)}
              >
                {/* Custom inline Google colorful logo G */}
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.35 0-4.33-1.59-5.05-3.73H.95v2.3C2.43 15.98 5.48 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.95 10.72c-.18-.54-.28-1.12-.28-1.72s.1-1.18.28-1.72V5H.95C.35 6.2.01 7.56.01 9s.34 2.8.94 4v-2.28z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.99 11.43 0 9 0 5.48 0 2.43 2.02.95 5.02l3 2.3c.72-2.14 2.7-3.74 5.05-3.74z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
                <span style={{ background: 'var(--card-bg)', padding: '0 12px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, position: 'relative', zIndex: 2 }}>
                  OR MOBILE OTP
                </span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)', zIndex: 1 }} />
              </div>

              {/* Phone OTP Login Option */}
              {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                  {otpError && (
                    <div style={{ padding: '8px 12px', background: 'var(--error-light)', color: 'var(--error)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
                      {otpError}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="Enter 10-digit number"
                      value={otpMobile}
                      onChange={(e) => setOtpMobile(e.target.value)}
                      maxLength={10}
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Send Verification Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  {otpError && (
                    <div style={{ padding: '8px 12px', background: 'var(--error-light)', color: 'var(--error)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
                      {otpError}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      We sent a 4-digit code to <strong>{otpMobile}</strong>
                    </span>
                  </div>

                  {/* Digit Input boxes */}
                  <div className="otp-input-container">
                    {otpInputs.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        className="otp-digit"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        required
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '20px' }}>
                    <span 
                      style={{ color: 'var(--primary)', cursor: otpTimer === 0 ? 'pointer' : 'not-allowed', fontWeight: 700 }}
                      onClick={() => otpTimer === 0 && handleSendOtp({ preventDefault: () => {} })}
                    >
                      Resend Code
                    </span>
                    {otpTimer > 0 && <span style={{ color: 'var(--text-muted)' }}>in {otpTimer}s</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOtpSent(false)}>
                      Change Mobile
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                      Verify & Log In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: RECEPTIONIST DASHBOARD SIGN IN */}
          {loginTab === 'receptionist' && (
            <form onSubmit={handleReceptionistLogin} style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
                Clinic administrator workspace. Verify credentials to manage queues.
              </p>

              {receptionistError && (
                <div style={{ padding: '8px 12px', background: 'var(--error-light)', color: 'var(--error)', borderRadius: '6px', fontSize: '12px', marginBottom: '16px', fontWeight: 600 }}>
                  {receptionistError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter 'admin'"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter 'admin123'"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Sign In to Dashboard
              </button>
            </form>
          )}

          <div style={{ position: 'relative', margin: '30px 0 10px', textAlign: 'center' }}>
            <span style={{ background: 'var(--card-bg)', padding: '0 12px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, position: 'relative', zIndex: 2 }}>
              OR PUBLIC DISPLAY
            </span>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)', zIndex: 1 }} />
          </div>

          {/* Public TV Room link */}
          <button 
            type="button"
            onClick={() => navigate('/waiting-room')}
            className="portal-btn"
            style={{ width: '100%', background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,0.15)', color: 'var(--primary)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
              <Tv size={20} />
              Open Waiting Room TV Screen
            </span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Simulated Google OAuth Account Chooser Modal */}
      {showGoogleModal && (
        <div className="modal-overlay" onClick={() => setShowGoogleModal(false)}>
          <div className="modal-content google-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              {/* Google colorful logo */}
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.74 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.68-5.17 3.68-8.82z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.57H1.21C.44 8.2.01 10 .01 12s.43 3.8 1.2 5.43l4.06-3.14z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.71l4.06 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
            </div>
            
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Sign in with Google</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>to continue to **AarogyaQ**</p>

            <div className="google-account-list">
              <div 
                className="google-account-item"
                onClick={() => handleGoogleLogin('rahul.sharma@gmail.com', 'Rahul Sharma')}
              >
                <div className="google-avatar">RS</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Rahul Sharma</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>rahul.sharma@gmail.com</div>
                </div>
              </div>

              <div 
                className="google-account-item"
                onClick={() => handleGoogleLogin('sakshi.patil@gmail.com', 'Sakshi Patil')}
              >
                <div className="google-avatar">SP</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Sakshi Patil</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>sakshi.patil@gmail.com</div>
                </div>
              </div>

              <div 
                className="google-account-item"
                onClick={() => handleGoogleLogin('guest.patient@gmail.com', 'Guest Patient')}
              >
                <div className="google-avatar">GP</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Guest Patient</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>guest.patient@gmail.com</div>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '24px', lineHeight: 1.5, textAlign: 'left' }}>
              To create a mock patient profile dynamically, click on any account above. Google credentials are simulated.
            </p>
          </div>
        </div>
      )}

      <SaasFooter />
    </div>
  );
}

// -------------------------------------------------------------
// Component: PatientPortalDashboard
// -------------------------------------------------------------
function PatientPortalDashboard({
  activeQueue,
  allPatients,
  averageConsultationTime,
  currentToken,
  patientUser,
  setPatientUser,
  onJoinQueue,
  onCancelToken
}) {
  const navigate = useNavigate();

  // Profile Form States
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [conditions, setConditions] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load patient values
  useEffect(() => {
    if (!patientUser) {
      navigate('/');
      return;
    }
    setName(patientUser.name || '');
    setMobile(patientUser.mobile || '');
    setAge(patientUser.age || '');
    setEmail(patientUser.email || '');
    setGender(patientUser.gender || 'Male');
    setBloodGroup(patientUser.bloodGroup || 'O+');
    setConditions(patientUser.conditions || '');
  }, [patientUser, navigate]);

  if (!patientUser) return null;

  // Search if patient has an active token in the live waiting/serving list
  // We can search by matching mobile numbers!
  const myActiveToken = activeQueue.find(p => p.mobile === patientUser.mobile);
  const myHistoricalRecords = allPatients.filter(p => p.mobile === patientUser.mobile && p.status !== 'waiting' && p.status !== 'serving');

  // Compute live position stats if in queue
  let waitStats = null;
  if (myActiveToken) {
    const waitingList = activeQueue.filter(p => p.status === 'waiting');
    const totalWaiting = waitingList.length;

    let tokensAhead = 0;
    let queuePosition = 1;

    if (myActiveToken.status === 'serving') {
      tokensAhead = 0;
      queuePosition = 1;
    } else {
      const waitIndex = waitingList.findIndex(p => p.tokenNumber === myActiveToken.tokenNumber);
      tokensAhead = waitIndex >= 0 ? waitIndex : 0;
      queuePosition = tokensAhead + 1;
    }

    const estimatedWait = tokensAhead * averageConsultationTime;
    const progressPercent = Math.max(0, Math.min(100, Math.round(((totalWaiting - tokensAhead) / Math.max(totalWaiting, 1)) * 100)));
    const asciiBar = '█'.repeat(Math.round(progressPercent / 10)) + '░'.repeat(10 - Math.round(progressPercent / 10));

    waitStats = {
      tokensAhead,
      estimatedWait,
      queuePosition,
      totalWaiting,
      progressPercent,
      asciiBar
    };
  }

  // Handle saving profile changes
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedProfile = {
      ...patientUser,
      name,
      mobile,
      age,
      email,
      gender,
      bloodGroup,
      conditions
    };

    setPatientUser(updatedProfile);
    localStorage.setItem('aarogyaq_patient_user', JSON.stringify(updatedProfile));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Trigger self queue register
  const handleBookToken = () => {
    if (!name.trim() || !mobile.trim()) {
      alert('Please fill out your Name and Mobile Number in the profile section first.');
      return;
    }
    
    // Call registration emit
    onJoinQueue({
      name: name.trim(),
      mobile: mobile.trim(),
      age: age ? parseInt(age, 10) : null
    });
  };

  const handleLogout = () => {
    setPatientUser(null);
    localStorage.removeItem('aarogyaq_patient_user');
    navigate('/');
  };

  return (
    <div className="patient-layout">
      {/* Patient Header */}
      <header className="patient-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AarogyaQLogo size={40} showText={false} />
          <h2 style={{ fontSize: '20px' }}>Patient Personal Portal</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="google-avatar" style={{ background: 'var(--primary)', color: 'white' }}>
              {name ? name.substring(0,2).toUpperCase() : 'PT'}
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>{name || 'Patient'}</span>
          </div>

          <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid: Left Profile, Right Token Status */}
      <main className="patient-main">
        {/* Left Side: Profile Form */}
        <div className="dashboard-panel">
          <div className="panel-title">
            <User size={20} className="text-primary" />
            My Medical Profile Details
          </div>

          <form onSubmit={handleSaveProfile}>
            {saveSuccess && (
              <div style={{ padding: '8px 12px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                Profile details saved successfully!
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input type="tel" className="form-input" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" className="form-input" value={age} onChange={(e) => setAge(e.target.value)} min={1} max={125} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" style={{ padding: '10px' }} value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-input" style={{ padding: '10px' }} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  <option>O+</option>
                  <option>O-</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Existing Medical Conditions (Optional)</label>
              <textarea 
                className="form-input" 
                style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                placeholder="e.g. Hypertension, Diabetes, Penicillin Allergy"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Right Side: Active Queue status or call-to-join token */}
        <div>
          {myActiveToken ? (
            // Case 1: Currently registered in active queue
            <div className="dashboard-panel" style={{ border: '2px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary)', color: 'white', padding: '4px 16px', fontSize: '11px', fontWeight: 800, borderRadius: '0 0 0 12px' }}>
                ACTIVE LIVE TOKEN
              </div>

              <div className="panel-title" style={{ color: 'var(--primary)', fontSize: '20px' }}>
                <HeartPulse size={20} />
                My Waitlist Token
              </div>

              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>YOUR TICKET</div>
                <div style={{ fontSize: '56px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.02em', textShadow: '0px 2px 10px rgba(0,0,0,0.05)', margin: '8px 0' }}>
                  {myActiveToken.tokenNumber}
                </div>
                
                <div style={{ margin: '12px 0' }}>
                  <span className={`status-badge ${myActiveToken.status}`} style={{ fontSize: '13px', padding: '6px 16px' }}>
                    {myActiveToken.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {waitStats && (
                <div style={{ background: 'var(--background)', borderRadius: '12px', padding: '20px', margin: '16px 0', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
                    <div style={{ borderRight: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Tokens Ahead</span>
                      <strong style={{ fontSize: '24px', color: waitStats.tokensAhead === 0 ? 'var(--success)' : 'var(--warning)' }}>
                        {waitStats.tokensAhead}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Est. Wait Time</span>
                      <strong style={{ fontSize: '24px', color: 'var(--primary)' }}>
                        {waitStats.estimatedWait} mins
                      </strong>
                    </div>
                  </div>

                  {myActiveToken.status !== 'serving' && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        <span>Queue Position</span>
                        <span style={{ color: 'var(--text-muted)' }}>{waitStats.queuePosition} of {waitStats.totalWaiting} waiting</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '6px' }}>
                        <span>Progress Bar:</span>
                        <span style={{ color: 'var(--primary)' }}>{waitStats.asciiBar}</span>
                      </div>
                      <div className="progress-bar-container" style={{ background: 'rgba(0,0,0,0.06)' }}>
                        <div className="progress-bar-fill" style={{ width: `${waitStats.progressPercent}%` }}></div>
                      </div>
                    </div>
                  )}

                  {myActiveToken.status === 'serving' && (
                    <div style={{ background: 'var(--success-light)', border: '1px solid rgba(34,197,94,0.2)', padding: '12px', borderRadius: '8px', color: 'var(--success)', fontWeight: 700, fontSize: '14px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      🔔 Your turn is active! Please proceed to the Doctor's Room.
                    </div>
                  )}
                </div>
              )}

              <button 
                type="button" 
                className="btn btn-danger" 
                style={{ width: '100%', marginTop: '8px' }} 
                onClick={() => onCancelToken(myActiveToken.tokenNumber)}
              >
                Cancel My Queue Token
              </button>
            </div>
          ) : (
            // Case 2: Not in queue, button to register self
            <div className="patient-token-box">
              <HeartPulse size={56} className="text-primary" style={{ animation: 'stat-pulse 1.5s infinite', opacity: 0.8 }} />
              
              <h3 style={{ fontSize: '22px', marginTop: '20px' }}>Join Clinic Waitlist</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '12px 0 28px', maxWidth: '320px', lineHeight: 1.6 }}>
                Pre-book your slot now. Your profile details will automatically be submitted to generating your queue token.
              </p>

              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ width: '80%', padding: '16px', fontSize: '16px' }}
                onClick={handleBookToken}
              >
                Join Queue / Get Token
              </button>

              {/* Show previous records if any */}
              {myHistoricalRecords.length > 0 && (
                <div style={{ marginTop: '32px', width: '100%', borderTop: '1px solid var(--border)', paddingTop: '20px', textAlign: 'left' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Recent Activity</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {myHistoricalRecords.slice(0, 2).map(r => (
                      <div key={r.tokenNumber} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'var(--background)', padding: '8px 12px', borderRadius: '6px' }}>
                        <span>Token: <strong>{r.tokenNumber}</strong></span>
                        <span className={`status-badge ${r.status}`} style={{ fontSize: '10px' }}>{r.status.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SaasFooter />
    </div>
  );
}

// -------------------------------------------------------------
// Component: ReceptionistPortal
// -------------------------------------------------------------
function ReceptionistPortal({
  queue,
  activeQueue,
  analytics,
  avgConsultationTime,
  currentToken,
  selectedToken,
  setSelectedToken,
  nextWaitingToken,
  handleAddPatient,
  handleCallNext,
  handleCancelToken,
  handleSaveConsultationTime,
  handleResetConsultationTime,
  handleResetQueue,
  handleExportExcel,
  isConnected
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [receptionTime, setReceptionTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setReceptionTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalWaiting = activeQueue.filter(p => p.status === 'waiting').length;

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div>
          <div className="sidebar-logo">
            <AarogyaQLogo size={40} showText={false} />
            <span style={{ fontSize: '20px', fontWeight: 800 }}>Aarogya<span style={{ color: 'var(--primary)' }}>Q</span></span>
          </div>
          
          <nav className="sidebar-nav">
            <div 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Users size={18} />
              Dashboard
            </div>
            <div 
              className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('queue')}
            >
              <Database size={18} />
              Queue Management
            </div>
            <div 
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <TrendingUp size={18} />
              Daily Analytics
            </div>
            <div 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              Settings
            </div>
          </nav>
        </div>

        <div>
          {/* Diagnostic Stats */}
          <div style={{ 
            background: isConnected ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: '1px solid ' + (isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'),
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: isConnected ? 'var(--success)' : 'var(--error)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? 'var(--success)' : 'var(--error)', display: 'inline-block' }}></span>
              {isConnected ? 'Server Connected' : 'Disconnected'}
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Real-time Sync Active</p>
          </div>

          <div 
            className="nav-item" 
            onClick={() => navigate('/')} 
            style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', borderRadius: 0 }}
          >
            <LogOut size={18} />
            Logout
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '0' }}>
        <div style={{ flexGrow: 1 }}>
          <header className="dashboard-header">
            <div>
              <h2 style={{ fontSize: '26px' }}>Clinic Queue Dashboard</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                Manage registrations, call patients, and review service analytics.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Quick Link to Download Excel Logs */}
              <button 
                onClick={handleExportExcel} 
                className="btn btn-outline"
                style={{ fontSize: '13px', padding: '8px 16px', height: '38px' }}
                title="Download Excel Sheet logs of OS"
              >
                <Download size={15} />
                Export Excel
              </button>
              
              <div className="header-time">
                {receptionTime.toLocaleDateString([], { month: 'short', day: 'numeric' })} &nbsp;•&nbsp; {receptionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </header>

          {/* Tab 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <>
              {/* Statistics Cards */}
              <div className="stats-grid">
                <StatsCard 
                  title="Now Serving" 
                  value={currentToken || 'AQ-000'} 
                  icon={Activity} 
                  type="now-serving" 
                />
                <StatsCard 
                  title="Patients Waiting" 
                  value={totalWaiting} 
                  icon={Users} 
                  type="waiting" 
                />
                <StatsCard 
                  title="Served Today" 
                  value={analytics.patientsServedToday || 0} 
                  icon={Trophy} 
                  type="served" 
                />
                <StatsCard 
                  title="Avg Consultation" 
                  value={`${avgConsultationTime} mins`} 
                  icon={Clock} 
                  type="avg-time" 
                />
              </div>

              {/* Split controls and entry form */}
              <div className="dashboard-grid">
                <div className="dashboard-panel">
                  <div className="panel-title">
                    <Heart size={20} className="text-primary" />
                    Add New Patient
                  </div>
                  <AddPatientForm onAddPatient={handleAddPatient} />
                </div>

                <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="panel-title">
                    <Activity size={20} className="text-primary" />
                    Queue Control Station
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Use these quick triggers to pull waiting patients to the consultation room or handle cancellations.
                  </p>

                  <QueueControls
                    selectedToken={selectedToken}
                    isQueueEmpty={totalWaiting === 0}
                    onCallNext={handleCallNext}
                    onCancelToken={handleCancelToken}
                    onRefreshQueue={() => window.location.reload()}
                    nextWaitingToken={nextWaitingToken}
                  />

                  <div style={{ 
                    marginTop: 'auto',
                    background: 'var(--background)',
                    border: '1px dashed var(--border)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5
                  }}>
                    <strong>Quick Operating Instructions:</strong>
                    <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                      <li>To cancel, select a row inside the <strong>Queue Management</strong> tab and click cancel.</li>
                      <li>Call next automatically completes the currently serving token.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Queue Management */}
          {activeTab === 'queue' && (
            <div className="dashboard-panel">
              <div className="panel-title" style={{ justifyContent: 'space-between', display: 'flex' }}>
                <span>Live Waitlist Records</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Selected Token: <strong>{selectedToken || 'None'}</strong>
                </span>
              </div>
              
              <QueueControls
                selectedToken={selectedToken}
                isQueueEmpty={totalWaiting === 0}
                onCallNext={handleCallNext}
                onCancelToken={handleCancelToken}
                onRefreshQueue={() => window.location.reload()}
                nextWaitingToken={nextWaitingToken}
              />
              
              <div style={{ marginTop: '20px' }}>
                <QueueTable 
                  queue={queue} 
                  selectedToken={selectedToken} 
                  onSelectToken={setSelectedToken} 
                />
              </div>
            </div>
          )}

          {/* Tab 3: Daily Analytics */}
          {activeTab === 'analytics' && (
            <div className="dashboard-panel" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
              <DailyAnalytics analytics={analytics} />
            </div>
          )}

          {/* Tab 4: Settings */}
          {activeTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
              <ConsultationSettings
                currentValue={avgConsultationTime}
                onSave={handleSaveConsultationTime}
                onReset={handleResetConsultationTime}
              />

              <div className="dashboard-panel" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                <div className="panel-title" style={{ color: 'var(--error)' }}>
                  <ShieldAlert size={20} />
                  Danger Zone
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                  These operations affect the entire live clinical datastore. Performing queue reset deletes all patient logs, logs them out from the waiting displays, and sets token counts back to zero.
                </p>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleResetQueue}
                  style={{ width: '100%', padding: '14px' }}
                >
                  Reset Daily Queue Database
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Minimal admin footer */}
        <div style={{ 
          marginTop: '40px', 
          borderTop: '1px solid var(--border)', 
          padding: '16px 0', 
          fontSize: '12px', 
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>AarogyaQ Clinic Portal v1.2.0 • Real-time DB and Excel Auto-Sync</span>
          <span>Helpline: +91 98765 43210</span>
        </div>
      </main>
    </div>
  );
}

// -------------------------------------------------------------
// Component: PatientWaitingRoom (TV display screen)
// -------------------------------------------------------------
function PatientWaitingRoom({ queue, activeQueue, averageConsultationTime, currentToken, currentNotification }) {
  const waitingPatients = activeQueue.filter(p => p.status === 'waiting');
  
  // Find current serving patient object (to show patient name)
  const currentServingPatient = activeQueue.find(p => p.status === 'serving');
  const servingName = currentServingPatient ? currentServingPatient.patientName : '';

  // Next upcoming tokens list (excluding the one serving)
  const upcomingTokens = waitingPatients.slice(0, 5);

  return (
    <div className="tv-layout">
      {/* Sound announcement manager */}
      <LiveNotification notification={currentNotification} />

      <WaitingRoomHeader />

      <div className="tv-main-grid">
        {/* Left Side: Large Now Serving display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <NowServingCard 
            currentToken={currentToken} 
            patientName={servingName} 
          />

          {/* Patient Search and Lookup console */}
          <TokenLookup 
            activeQueue={activeQueue} 
            allPatients={queue} 
            averageConsultationTime={averageConsultationTime} 
          />
        </div>

        {/* Right Side: Upcoming tokens list */}
        <div className="tv-upcoming-panel">
          <div className="tv-panel-title">UPCOMING TOKENS</div>
          
          {waitingPatients.length === 0 ? (
            <div className="tv-empty-state">
              <div className="tv-empty-icon">📢</div>
              <div className="tv-empty-title">No Patients Waiting</div>
              <div className="tv-empty-sub">
                The queue is currently empty. Reception will announce new tokens shortly.
              </div>
            </div>
          ) : (
            <div className="tv-upcoming-list">
              {upcomingTokens.map((p, index) => (
                <div key={p.tokenNumber} className="tv-upcoming-item">
                  <span style={{ fontFamily: 'monospace', fontSize: '28px' }}>
                    {p.tokenNumber}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', color: '#94A3B8' }}>
                      {p.patientName}
                    </span>
                    <span className="tv-upcoming-badge waiting">
                      Wait: {index * averageConsultationTime}m
                    </span>
                  </div>
                </div>
              ))}
              
              {waitingPatients.length > 5 && (
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: '16px', 
                  color: '#64748B', 
                  fontWeight: 700, 
                  marginTop: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '8px',
                  borderRadius: '8px'
                }}>
                  + {waitingPatients.length - 5} more patients in queue
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scrolling Emergency Ticker Footer */}
      <div className="tv-ticker-footer">
        <div className="tv-ticker-wrap">
          <div className="tv-ticker-content">
            <span className="tv-ticker-item"><span className="tv-ticker-bullet">🚑</span> EMERGENCY NUMBERS: Ambulance: 108 / 102</span>
            <span className="tv-ticker-item"><span className="tv-ticker-bullet">📞</span> CLINIC DIRECT HELPLINE: +91 98765 43210</span>
            <span className="tv-ticker-item"><span className="tv-ticker-bullet">📧</span> SUPPORT EMAIL: support@aarogyaq.com</span>
            <span className="tv-ticker-item"><span className="tv-ticker-bullet">🏥</span> LOCATION: Health Plaza, Sector 15, Pune, MH, India</span>
            <span className="tv-ticker-item"><span className="tv-ticker-bullet">📢</span> NOTICE: For severe chest pains or accident trauma, please alert the front receptionist desk immediately.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap application content in Router
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
