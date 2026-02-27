import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertModal from '../../components/AlertModal';
import { resetPasswordRaw } from '../../services/api';
import './ForgotPassword.css';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        userID: '',
        phone: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const closeModal = () => {
        if (modalConfig.onConfirm) modalConfig.onConfirm();
        setModalConfig({ ...modalConfig, isOpen: false, onConfirm: null });
    };

    const showModal = (type, title, message, onConfirm = null) => {
        setModalConfig({ isOpen: true, type, title, message, onConfirm });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.newPassword !== formData.confirmPassword) {
            setLoading(false);
            showModal('error', 'Validation Error', 'Passwords do not match.');
            return;
        }

        if (formData.newPassword.length < 6) {
            setLoading(false);
            showModal('error', 'Weak Password', 'Password must be at least 6 characters long.');
            return;
        }

        try {
            const { res, data } = await resetPasswordRaw({
                userID: formData.userID,
                phone: formData.phone,
                newPassword: formData.newPassword,
            });
            setLoading(false);

            if (!res.ok) {
                if (res.status === 404) {
                    showModal('error', 'Reset Failed', 'UserID and MobileNo are mismatched. please enter correct UserID and MobileNo.');
                    return;
                }
                showModal('error', 'Reset Failed', data.error || 'Unable to reset password.');
                return;
            }

            showModal('success', 'Password Reset', 'Your password has been successfully updated.', () => {
                navigate('/signin');
            });
        } catch {
            setLoading(false);
            showModal('error', 'Connection Error', 'Could not connect to the backend server.');
        }
    };

    return (
        <div className="fp-container">
            <div className="fp-card">
                <button type="button" className="fp-close-button" data-label="Back to Map" aria-label="Back to Map" onClick={() => navigate('/')}>×</button>
                <div className="fp-wave">
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="fp-wave-svg">
                        <path d="M-0.00,49.85 C150.00,149.60 349.20,-49.85 500.00,49.85 L500.00,149.60 L-0.00,149.60 Z" className="fp-wave-path"></path>
                    </svg>
                </div>
                <div className="fp-header">
                    <h2>Reset password</h2>
                    <p>UserID need to match with phone number that used to create that account.</p>
                </div>

                <form onSubmit={handleSubmit} className="fp-form" autoComplete="off">
                    <div className="fp-form-group fp-floating-label">
                        <input
                            type="text"
                            id="fp-userid"
                            name="userID"
                            value={formData.userID}
                            onChange={handleChange}
                            placeholder=" "
                            required
                        />
                        <label htmlFor="fp-userid">UserID</label>
                    </div>
                    <div className="fp-form-group fp-floating-label">
                        <input
                            type="tel"
                            id="fp-phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder=" "
                            required
                        />
                        <label htmlFor="fp-phone">Phone Number</label>
                    </div>
                    <div className="fp-form-group fp-floating-label">
                        <input
                            type="password"
                            id="fp-password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder=" "
                            required
                        />
                        <label htmlFor="fp-password">New Password</label>
                    </div>
                    <div className="fp-form-group fp-floating-label">
                        <input
                            type="password"
                            id="fp-confirm"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder=" "
                            required
                        />
                        <label htmlFor="fp-confirm">Confirm Password</label>
                    </div>

                    <button
                        type="submit"
                        className="fp-submit"
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="fp-footer">
                    <button className="fp-back-link" type="button" onClick={() => navigate('/signin')}>
                        Back to Sign In
                    </button>
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
}
