import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Building3D from '../../components/Building3D';
import AlertModal from '../../components/AlertModal';
import './AuthPage.css';

const AuthPage = ({ initialMode = 'login' }) => {
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
    const [loading, setLoading] = useState(false);

    // Login State
    const [loginData, setLoginData] = useState({ userID: '', password: '' });

    // Signup State (Matching Database Schema)
    const [signupData, setSignupData] = useState({
        userID: '',
        fullName: '',
        email: '',
        mobileNo: '',
        loginPassword: '',
        confirmPassword: '',
    });

    // Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

    const closeModal = () => {
        if (modalConfig.onConfirm) modalConfig.onConfirm();
        setModalConfig({ ...modalConfig, isOpen: false, onConfirm: null });
    };

    const showModal = (type, title, message, onConfirm = null) => {
        setModalConfig({ isOpen: true, type, title, message, onConfirm });
    };

    const navigate = useNavigate();
    const location = useLocation();

    // Check if the route is deliberately /signup and trigger it directly
    useEffect(() => {
        setIsSignUp(location.pathname === '/signup');
    }, [location.pathname]);



    // --- Handlers ---
    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    const handleSignupChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            const data = await res.json();
            setLoading(false);

            if (!res.ok) {
                showModal('error', 'Login Failed', data.error || 'Invalid credentials.');
                return;
            }

            // Navigate instantly upon successful login
            navigate('/default', { state: { user: data.user } });

        } catch (err) {
            setLoading(false);
            showModal('error', 'Connection Error', 'Could not connect to the backend server.');
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (signupData.loginPassword !== signupData.confirmPassword) {
            setLoading(false);
            showModal('error', 'Validation Error', 'Passwords do not match. Please verify your password.');
            return;
        }

        if (signupData.loginPassword.length < 6) {
            setLoading(false);
            showModal('error', 'Weak Password', 'For your security, your password must be at least 6 characters long.');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupData)
            });

            const data = await res.json();
            setLoading(false);

            if (!res.ok) {
                // Determine if it was a Conflict (409) or general error
                const type = res.status === 409 ? 'warning' : 'error';
                showModal(type, res.status === 409 ? 'Account Exists' : 'Registration Failed', data.message || data.error);
                return;
            }

            showModal('success', 'Account Created', 'Your account has been successfully created! You can now log in.', () => {
                setIsSignUp(false); // Switch to login view
            });

        } catch (err) {
            setLoading(false);
            showModal('error', 'Connection Error', 'Could not connect to the backend server.');
        }
    };

    // --- Template ---
    return (
        <div className="auth-root">

            {/* The right-panel-active class here does the magic sliding */}
            <div className={`auth-card-container ${isSignUp ? 'right-panel-active' : ''}`} id="container">

                {/* --- Sign Up Container (Slides left, becomes visible) --- */}
                <div className="auth-form-container auth-sign-up-container">
                    <form className="auth-form" onSubmit={handleSignupSubmit} autoComplete="off">
                        <h1 className="auth-title">Create Account</h1>

                        <div className="auth-form-row">
                            <div className="auth-form-group">
                                <input className="auth-input" type="text" name="userID" placeholder=" " value={signupData.userID} onChange={handleSignupChange} required />
                                <label className="auth-label">UserID</label>
                            </div>
                            <div className="auth-form-group">
                                <input className="auth-input" type="text" name="fullName" placeholder=" " value={signupData.fullName} onChange={handleSignupChange} required />
                                <label className="auth-label">Full Name</label>
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <input className="auth-input" type="email" name="email" placeholder=" " value={signupData.email} onChange={handleSignupChange} required />
                            <label className="auth-label">Email</label>
                        </div>

                        <div className="auth-form-group">
                            <input className="auth-input" type="tel" name="mobileNo" placeholder=" " value={signupData.mobileNo} onChange={handleSignupChange} required />
                            <label className="auth-label">Mobile No</label>
                        </div>

                        <div className="auth-form-group">
                            <input className="auth-input" type="password" name="loginPassword" placeholder=" " value={signupData.loginPassword} onChange={handleSignupChange} required />
                            <label className="auth-label">Password</label>
                        </div>
                        <div className="auth-form-group">
                            <input className="auth-input" type="password" name="confirmPassword" placeholder=" " value={signupData.confirmPassword} onChange={handleSignupChange} required />
                            <label className="auth-label">Confirm Password</label>
                        </div>

                        <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</button>

                        {/* Mobile Fallback */}
                        <div className="auth-switch-mobile" style={{ marginTop: '20px', display: 'none' }}>
                            <span style={{ color: 'var(--clr-muted)', fontSize: 13 }}>Already have an account? </span>
                            <span className="auth-link" style={{ cursor: 'pointer' }} onClick={() => { setIsSignUp(false); navigate('/'); }}>Sign In</span>
                        </div>
                    </form>
                </div>

                {/* --- Sign In Container (Slides right, becomes invisible) --- */}
                <div className="auth-form-container auth-sign-in-container">
                    <form className="auth-form" onSubmit={handleLoginSubmit} autoComplete="off">
                        <h1 className="auth-title">Sign in</h1>

                        <div className="auth-form-group">
                            <input className="auth-input" type="text" name="userID" placeholder=" " value={loginData.userID} onChange={handleLoginChange} required />
                            <label className="auth-label">UserID</label>
                        </div>
                        <div className="auth-form-group">
                            <input className="auth-input" type="password" name="password" placeholder=" " value={loginData.password} onChange={handleLoginChange} required />
                            <label className="auth-label">Password</label>
                        </div>

                        <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>

                        <div className="auth-footer-links">
                            <a className="auth-link cursor-pointer" onClick={() => { setIsSignUp(true); navigate('/signup'); }}>Sign Up</a>
                            <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
                        </div>

                        {/* Mobile Fallback purely just to ensure logic translates if sliding door is disabled via CSS */}
                        <div className="auth-switch-mobile" style={{ marginTop: '20px', display: 'none' }}>
                            <span style={{ color: 'var(--clr-muted)', fontSize: 13 }}>Don't have an account? </span>
                            <span className="auth-link cursor-pointer" onClick={() => { setIsSignUp(true); navigate('/signup'); }}>Sign Up</span>
                        </div>

                    </form>
                </div>

                {/* --- The Sliding Overlay Container --- */}
                <div className="auth-overlay-container">
                    <div className="auth-overlay">
                        {/* Overlay Left Content (Visible when Sign Up active) */}
                        <div className="auth-overlay-panel auth-overlay-left">
                            <h1 className="auth-title">Welcome Back!</h1>
                            <p className="auth-text">To keep booking rooms smoothly, please log in with your details.</p>
                            <button className="auth-button ghost" onClick={() => { setIsSignUp(false); navigate('/'); }}>Sign In</button>
                        </div>

                        {/* Overlay Right Content (Visible when Sign In active) */}
                        <div className="auth-overlay-panel auth-overlay-right">
                            <Building3D />
                            <h1 className="auth-title">Hello, Friend!</h1>
                            <p className="auth-text">Nay-Yar is for everyone.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Injected style for mobile fallback visibility */}
            <style>
                {`
                @media (max-width: 768px) {
                    .auth-switch-mobile { display: block !important; }
                }
                `}
            </style>

            <AlertModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={closeModal}
            />
        </div>
    );
};

export default AuthPage;
