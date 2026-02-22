import React from 'react';
import './ErrorModal.css';

/**
 * ErrorModal — drop-in replacement for browser alert().
 *
 * Usage:
 *   const [errorMsg, setErrorMsg] = useState(null);
 *   ...
 *   setErrorMsg('Something went wrong.');
 *   ...
 *   {errorMsg && <ErrorModal message={errorMsg} onClose={() => setErrorMsg(null)} />}
 */
const ErrorModal = ({ message, onClose, title = 'Something went wrong' }) => (
    <div className="err-overlay" onClick={onClose}>
        <div className="err-card" onClick={e => e.stopPropagation()}>
            <div className="err-icon-wrap">
                <span className="err-icon">⚠️</span>
            </div>
            <h3 className="err-title">{title}</h3>
            <p className="err-message">{message}</p>
            <button className="err-ok-btn" onClick={onClose}>OK, Got it</button>
        </div>
    </div>
);

export default ErrorModal;
