import React from 'react';
import './GlassIcon.css';

const GlassIcon = ({ type }) => {
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
                {type === 'logout' && (
                    <div className="icon-vector logout-vector">
                        <div className="logout-door"></div>
                        <div className="logout-arrow"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlassIcon;
