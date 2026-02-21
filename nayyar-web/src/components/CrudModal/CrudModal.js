import React from 'react';
import './CrudModal.css';

const CrudModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="crud-modal-overlay" onClick={onClose}>
            <div className="crud-modal-card" onClick={e => e.stopPropagation()}>
                <div className="crud-modal-header">
                    <h2>{title}</h2>
                    <button className="crud-modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="crud-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CrudModal;
