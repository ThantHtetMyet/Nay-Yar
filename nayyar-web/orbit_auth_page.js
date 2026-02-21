import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import Modal from '../../components/Modal';
import FloatingSquares from '../../components/FloatingSquares';
import './AuthPage.css';

const AuthPage = ({ initialMode = 'login' }) => {
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, type: 'info', message: '', title: '' });

    // Login State
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const { login, isAuthenticated } = useAuth();

    // Signup State
    const [signupData, setSignupData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobileNo: '',
        loginPassword: '',
        confirmPassword: '',
        userRoleID: '',
    });
    const [roles, setRoles] = useState([]);
    const [signupError, setSignupError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setIsSignUp(initialMode === 'signup');
    }, [initialMode]);

    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    useEffect(() => {
        if (isSignUp) {
            fetchRoles();
        }
    }, [isSignUp]);

    const fetchRoles = async () => {
        try {
            const data = await roleService.getAll();
            setRoles(data);
            const userRole = data.find(r => r.roleName === 'User');
            if (userRole) {
                setSignupData(prev => ({ ...prev, userRoleID: userRole.id }));
            }
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        }
    };

    // --- Idle Timer Logic ---
    const [isIdle, setIsIdle] = useState(false);
    useEffect(() => {
        let timeout;
        const resetTimer = () => {
            setIsIdle(false);
            clearTimeout(timeout);
            timeout = setTimeout(() => setIsIdle(true), 10000); // 20 seconds
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        window.addEventListener('click', resetTimer);

        resetTimer(); // Start timer

        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            window.removeEventListener('click', resetTimer);
            clearTimeout(timeout);
        };
    }, []);

    // --- Handlers ---

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleSignupChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
        setSignupError('');
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authService.login(loginData.email, loginData.password);
            if (response && response.token) {
                login(response.user, response.token);
                // Navigation handled by auth context/effect usually, but doing explicit here just in case
            }
        } catch (err) {
            let message = 'Login failed. Please try again.';
            if (err.response) {
                message = err.response.data?.message || err.response.data || message;
            }
            setModal({ isOpen: true, type: 'error', message, title: 'Login Failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSignupError('');

        if (signupData.loginPassword !== signupData.confirmPassword) {
            setSignupError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (signupData.loginPassword.length < 6) {
            setSignupError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...userData } = signupData;
            userData.isActive = true;

            await userService.create(userData);
            setModal({
                isOpen: true,
                type: 'success',
                message: 'Account created successfully! Please login.',
                title: 'Success'
            });
            // Delay switch to login to let user read
            setTimeout(() => {
                setIsSignUp(false);
                setModal(prev => ({ ...prev, isOpen: false }));
            }, 2000);

        } catch (err) {
            setSignupError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setModal({ isOpen: false, type: 'info', message: '', title: '' });
    };

    return (
        <div className="auth-root">
            <Modal
                isOpen={modal.isOpen}
                onClose={handleModalClose}
                type={modal.type}
                message={modal.message}
                title={modal.title}
            />

            {/* Interactive Floating Squares Background */}
            <FloatingSquares count={15} />

            <div className={`auth-card-container ${isSignUp ? 'right-panel-active' : ''} ${isIdle ? 'container-idle' : ''}`} id="container">

                {/* Screensaver Overlay */}
                <div className={`auth-screensaver ${isIdle ? 'active' : ''}`}>
                    <h1>OrbitNET</h1>
                </div>

                {/* Sign Up Container */}
                <div className="auth-form-container auth-sign-up-container">
                    <form className="auth-form" onSubmit={handleSignupSubmit}>
                        <h1 className="auth-title">Create Account</h1>

                        {signupError && <div className="alert-text">{signupError}</div>}

                        <div className="auth-form-row">
                            <div className="auth-form-group">
                                <input className="auth-input" type="text" name="firstName" placeholder=" " value={signupData.firstName} onChange={handleSignupChange} required />
                                <label className="auth-label">First Name</label>
                            </div>
                            <div className="auth-form-group">
                                <input className="auth-input" type="text" name="lastName" placeholder=" " value={signupData.lastName} onChange={handleSignupChange} required />
                                <label className="auth-label">Last Name</label>
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <input className="auth-input" type="email" name="email" placeholder=" " value={signupData.email} onChange={handleSignupChange} required />
                            <label className="auth-label">Email</label>
                        </div>

                        <div className="auth-form-row">
                            <div className="auth-form-group">
                                <input className="auth-input" type="tel" name="mobileNo" placeholder=" " value={signupData.mobileNo} onChange={handleSignupChange} required />
                                <label className="auth-label">Mobile No</label>
                            </div>
                            <div className="auth-form-group">
                                <div className="select-wrapper">
                                    <select className="auth-select" name="userRoleID" value={signupData.userRoleID} onChange={handleSignupChange} required>
                                        <option value=""></option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                                    </select>
                                    <label className="auth-label">Role</label>
                                </div>
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <input className="auth-input" type="password" name="loginPassword" placeholder=" " value={signupData.loginPassword} onChange={handleSignupChange} required />
                            <label className="auth-label">Password</label>
                        </div>
                        <div className="auth-form-group">
                            <input className="auth-input" type="password" name="confirmPassword" placeholder=" " value={signupData.confirmPassword} onChange={handleSignupChange} required />
                            <label className="auth-label">Confirm Password</label>
                        </div>

                        <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Sign Up' : 'Sign Up'}</button>
                    </form>
                </div>

                {/* Sign In Container */}
                <div className="auth-form-container auth-sign-in-container">
                    <form className="auth-form" onSubmit={handleLoginSubmit}>
                        <h1 className="auth-title">Sign in</h1>

                        <div className="auth-social-container">
                            {/* Icons removed from here */}
                        </div>

                        <div className="auth-form-group">
                            <input className="auth-input" type="email" name="email" placeholder=" " value={loginData.email} onChange={handleLoginChange} required />
                            <label className="auth-label">Email</label>
                        </div>
                        <div className="auth-form-group">
                            <input className="auth-input" type="password" name="password" placeholder=" " value={loginData.password} onChange={handleLoginChange} required />
                            <label className="auth-label">Password</label>
                        </div>

                        <Link to="/forgot-password" className="auth-link">Forgot your password?</Link>
                        <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
                    </form>
                </div>

                {/* Overlay Container */}
                <div className="auth-overlay-container">
                    <div className="auth-overlay">
                        <div className="auth-overlay-panel auth-overlay-left">
                            <div className="orbit-icon">
                                <div className="orbit-center"></div>
                                <div className="orbit-ring ring-2">
                                    <div className="orbit-dot dot-2"></div>
                                </div>
                            </div>
                            <h1 className="auth-title">Welcome Back!</h1>
                            <p className="auth-text">To keep connected with us please login with your personal info</p>
                            <button className="auth-button ghost" onClick={() => setIsSignUp(false)}>Sign In</button>
                        </div>
                        <div className="auth-overlay-panel auth-overlay-right">
                            <div className="orbit-icon">
                                <div className="orbit-center"></div>
                                <div className="orbit-ring ring-2">
                                    <div className="orbit-dot dot-2"></div>
                                </div>
                            </div>
                            <h1 className="auth-title">Orbit-NET</h1>
                            <p className="auth-text">Sign in with your details and continue your journey with us.</p>
                            <button className="auth-button ghost" onClick={() => setIsSignUp(true)}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
