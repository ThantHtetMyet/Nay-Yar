import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Building3D from '../../components/Building3D';
import AlertModal from '../../components/AlertModal';
import './AuthPage.css';
import { loginRaw, signupRaw, trackLinkHit } from '../../services/api';

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
            const { res, data } = await loginRaw(loginData);
            setLoading(false);

            if (!res.ok) {
                showModal('error', 'Login Failed', data.error || 'Invalid credentials.');
                return;
            }

            // Store user in session so it survives refreshes
            sessionStorage.setItem('user', JSON.stringify(data.user));

            // Navigate instantly upon successful login
            navigate('/', { state: { user: data.user } });

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
            const { res, data } = await signupRaw(signupData);
            setLoading(false);

            if (!res.ok) {
                // Determine if it was a Conflict (409) or general error
                const type = res.status === 409 ? 'warning' : 'error';
                showModal(type, res.status === 409 ? 'Account Exists' : 'Registration Failed', data.message || data.error);
                return;
            }

            trackLinkHit('signup-success', window.location.href).catch(() => { });
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
            <div className="auth-card-container auth-single-column">
                <button type="button" className="auth-close-button" data-label="Back to Map" aria-label="Back to Map" onClick={() => navigate('/')}>×</button>
                <div className="auth-header-section">
                    <div className="auth-hero">
                        <Building3D />
                        <h1 className="auth-brand-title">Nay-Yar</h1>
                    </div>
                    {/* SVG Wave Shape to transition between header and body */}
                    <div className="auth-wave-container">
                        <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="auth-wave-svg">
                            <path d="M-0.00,49.85 C150.00,149.60 349.20,-49.85 500.00,49.85 L500.00,149.60 L-0.00,149.60 Z" className="auth-wave-path"></path>
                        </svg>
                    </div>
                </div>

                <div className="auth-form-section">
                    <h1 className="auth-form-title">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
                    {isSignUp ? (
                        <div className="auth-form-container auth-single-form">
                            <form className="auth-form" onSubmit={handleSignupSubmit} autoComplete="off">
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
                                    <input className="auth-input" type="email" name="email" placeholder=" " value={signupData.email} onChange={handleSignupChange} />
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

                                <div className="auth-action-row">
                                    <button className="auth-button auth-submit" type="submit" disabled={loading}>
                                        {loading ? 'Creating account...' : 'Create Account'}
                                    </button>
                                </div>
                                <div className="auth-footer-links auth-footer-center">
                                    <button className="auth-link auth-link-button" type="button" onClick={() => { setIsSignUp(false); navigate('/signin'); }}>
                                        Back to Sign In
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="auth-form-container auth-single-form">
                            <form className="auth-form" onSubmit={handleLoginSubmit} autoComplete="off">
                                <div className="auth-form-group">
                                    <input className="auth-input" type="text" name="userID" placeholder=" " value={loginData.userID} onChange={handleLoginChange} required />
                                    <label className="auth-label">UserID</label>
                                </div>
                                <div className="auth-form-group">
                                    <input className="auth-input" type="password" name="password" placeholder=" " value={loginData.password} onChange={handleLoginChange} required />
                                    <label className="auth-label">Password</label>
                                </div>

                                <button className="auth-button auth-signin-btn" type="submit" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>

                                <div className="auth-footer-links">
                                    <a className="auth-link cursor-pointer" onClick={() => { setIsSignUp(true); navigate('/signup'); }}>Sign Up</a>
                                    <Link to="/forgot-password" id="forgot-password-link" className="auth-link">Forgot Password?</Link>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

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
