import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate async request
        setTimeout(() => {
            setLoading(false);
            setSent(true);
        }, 1500);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {sent ? (
                    /* ── Success state ── */
                    <div className="success-state">
                        <div className="success-icon">✅</div>
                        <div className="auth-header">
                            <h2>Check your inbox!</h2>
                            <p>
                                We've sent a password reset link to <br />
                                <strong style={{ color: 'var(--clr-orange)' }}>{email}</strong>
                            </p>
                        </div>

                        <Link to="/">
                            <button type="button" className="btn-submit">
                                Back to Sign In
                            </button>
                        </Link>
                    </div>
                ) : (
                    /* ── Form state ── */
                    <>
                        <div className="auth-header">
                            <h2>Forgot password?</h2>
                            <p>
                                No worries! Enter your email and we'll send you
                                a reset link right away.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
                            <div className="form-group floating-label">
                                <input
                                    type="email"
                                    id="fp-email"
                                    name="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder=" "
                                    required
                                />
                                <label htmlFor="fp-email">Email Address</label>
                            </div>

                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <Link to="/" className="back-link">
                                ← Back to Sign In
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
