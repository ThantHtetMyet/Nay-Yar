import React from 'react';
import ReactDOM from 'react-dom';
import './AlertModal.css';

const AlertModal = ({ isOpen, type = 'info', title, message, onClose, actionText, onAction, cancelText, onCancel, showConfirm = true, confirmText = 'Confirm' }) => {
    if (!isOpen) return null;

    // Determine icon based on type
    let icon = 'ℹ️';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'success') icon = '✅';

    return ReactDOM.createPortal(
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
                    {actionText ? (
                        <button className="alert-btn alert-btn-action" onClick={onAction}>
                            {actionText}
                        </button>
                    ) : null}
                    {cancelText ? (
                        <button className="alert-btn alert-btn-cancel" onClick={onCancel}>
                            {cancelText}
                        </button>
                    ) : null}
                    {showConfirm ? (
                        <button className={`alert-btn alert-btn-${type}`} onClick={onClose}>
                            {confirmText}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AlertModal;
