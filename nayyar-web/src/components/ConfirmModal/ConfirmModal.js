import React from 'react';
import './ConfirmModal.css';

/**
 * ConfirmModal — Styled replacement for browser confirm().
 */
const ConfirmModal = ({
    message,
    onConfirm,
    onCancel,
    onClose,
    onNeutral,
    title = 'Are you sure?',
    confirmText = 'Yes, Proceed',
    cancelText = 'Cancel',
    neutralText = '',
    type = 'danger'
}) => (
    <div className="conf-overlay" onClick={onClose || onCancel}>
        <div className="conf-card" onClick={e => e.stopPropagation()}>
            <div className={`conf-icon-wrap wrap-${type}`}>
                <span className="conf-icon">{type === 'danger' ? '❓' : 'ℹ️'}</span>
            </div>
            <h3 className="conf-title">{title}</h3>
            <p className="conf-message">{message}</p>
            <div className="conf-actions">
                <button className="conf-cancel-btn" onClick={onCancel}>{cancelText}</button>
                {neutralText ? (
                    <button className="conf-neutral-btn" onClick={onNeutral || onClose || onCancel}>
                        {neutralText}
                    </button>
                ) : null}
                <button className={`conf-confirm-btn btn-${type}`} onClick={onConfirm}>
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmModal;
