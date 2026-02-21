import React from 'react';
import './AlertModal.css';

const AlertModal = ({ isOpen, type = 'info', title, message, onClose }) => {
    if (!isOpen) return null;

    // Determine icon based on type
    let icon = 'ℹ️';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'success') icon = '✅';

    return (
        <div className="alert-modal-overlay">
            <div className={`alert-modal-content alert-type-${type}`}>
                <div className="alert-modal-header">
                    <div className="alert-modal-title">
                        <span className="alert-icon">{icon}</span>
                        <h2>{title}</h2>
                    </div>
                    <button className="alert-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="alert-modal-body">
                    <p>{message}</p>
                </div>
                <div className="alert-modal-footer">
                    <button className={`alert-btn alert-btn-${type}`} onClick={onClose}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
