import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = ({ initialMode = 'login' }) => {
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
    const [loading, setLoading] = useState(false);

    // Login State
    const [loginData, setLoginData] = useState({ userID: '', password: '' });

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
    const [signupError, setSignupError] = useState('');
    const [tilt, setTilt] = useState({ x: 0, y: 0 }); // Added for 3D interaction

    const navigate = useNavigate();
    const location = useLocation();

    // Check if the route is deliberately /signup and trigger it directly
    useEffect(() => {
        setIsSignUp(location.pathname === '/signup');
    }, [location.pathname]);

    const roles = [
        { id: '1', roleName: 'Landlord' },
        { id: '2', roleName: 'Tenant' },
    ];

    // --- Handlers ---
    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    const handleSignupChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
        setSignupError('');
    };

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        // Perfecting 3D rotation sensitivity!
        const rotateX = ((y - centerY) / centerY) * -25;
        const rotateY = ((x - centerX) / centerX) * 25;
        setTilt({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert('Login successful! UserID: ' + loginData.userID);
            // navigate('/');
        }, 1000);
    };

    const handleSignupSubmit = (e) => {
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

        setTimeout(() => {
            setLoading(false);
            alert('Account created successfully! Please login.');
            setIsSignUp(false);
            navigate('/');
        }, 1500);
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
                                <select className="auth-select" name="userRoleID" value={signupData.userRoleID} onChange={handleSignupChange} required>
                                    <option value="" disabled hidden></option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                                </select>
                                <label className="auth-label">Role</label>
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
                        <div
                            className="auth-overlay-panel auth-overlay-right"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{ perspective: '1200px' }}
                        >
                            <div
                                className="floating-container"
                                style={{
                                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                                    transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.5s ease-out' : 'transform 0.1s ease-out',
                                    transformStyle: 'preserve-3d',
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                <img
                                    src={require('../../assets/new_cute_3d_house_transparent.png')}
                                    alt="Cute 3D House"
                                    className="overlay-graphic"
                                    style={{
                                        transform: tilt.x !== 0 || tilt.y !== 0 ? 'translateZ(50px) scale(1.1)' : 'translateZ(0) scale(1)',
                                        transition: 'transform 0.2s ease-out',
                                        filter: tilt.x !== 0 || tilt.y !== 0 ? `drop-shadow(${-tilt.y}px ${-tilt.x}px 25px rgba(0,0,0,0.5))` : 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.3))'
                                    }}
                                />
                            </div>
                            <h1 className="auth-title" style={{ transform: 'translateZ(20px)', zIndex: 5 }}>Hello, Friend!</h1>
                            <p className="auth-text" style={{ transform: 'translateZ(10px)', zIndex: 5 }}>Nay-Yar is for everyone.</p>
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
        </div>
    );
};

export default AuthPage;
