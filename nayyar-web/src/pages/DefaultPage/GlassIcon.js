import React from 'react';
import './GlassIcon.css';

const GlassIcon = ({ type, initial }) => {
    return (
        <div className={`glass-icon-wrapper ${type}`}>
            <div className="glass-base"></div>
            <div className="glass-overlay">
                {type === 'create' && (
                    <div className="icon-vector create-vector">
                        <div className="line short"></div>
                        <div className="line long"></div>
                        <div className="line long"></div>
                    </div>
                )}
                {type === 'search' && (
                    <div className="icon-vector search-vector">
                        <div className="search-circle"></div>
                        <div className="search-handle"></div>
                    </div>
                )}
                {type === 'user' && (
                    <div className="icon-vector user-vector">
                        <span className="glass-user-initial">{initial}</span>
                    </div>
                )}
                {type === 'logout' && (
                    <div className="icon-vector logout-vector">
                        <div className="logout-door"></div>
                        <div className="logout-arrow"></div>
                    </div>
                )}
                {type === 'feedback' && (
                    <div className="icon-vector feedback-vector">
                        <div className="feedback-bubble">
                            <div className="feedback-line line-1"></div>
                            <div className="feedback-line line-2"></div>
                        </div>
                        <div className="feedback-tail"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlassIcon;
