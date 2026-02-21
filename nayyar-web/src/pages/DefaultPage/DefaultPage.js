import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import GlassIcon from './GlassIcon';
import './DefaultPage.css';
import GlobeIcon from './GlobeIcon';
import CrudModal from '../../components/CrudModal/CrudModal';
import CreatePostForm from './CreatePostForm';

const DefaultPage = () => {
    const location = useLocation();
    const user = location.state?.user || { FullName: 'Guest' }; // Fallback if reloaded manually

    const [isModalOpen, setIsModalOpen] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('Singapore');
    const [searchQuery, setSearchQuery] = useState('');
    const [mapUrl, setMapUrl] = useState('');

    // Create Post Modal State
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

    const countries = [
        "Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan",
        "Brunei", "Cambodia", "China", "Cyprus", "Georgia", "India", "Indonesia",
        "Iran", "Iraq", "Israel", "Japan", "Jordan", "Kazakhstan", "Kuwait",
        "Kyrgyzstan", "Laos", "Lebanon", "Malaysia", "Maldives", "Mongolia",
        "Myanmar", "Nepal", "North Korea", "Oman", "Pakistan", "Palestine",
        "Philippines", "Qatar", "Russia", "Saudi Arabia", "Singapore", "South Korea",
        "Sri Lanka", "Syria", "Taiwan", "Tajikistan", "Thailand", "Timor-Leste",
        "Turkey", "Turkmenistan", "United Arab Emirates", "Uzbekistan", "Vietnam", "Yemen"
    ];

    const filteredCountries = countries.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleLocate = () => {
        const encodedCountry = encodeURIComponent(selectedCountry);
        const url = `https://maps.google.com/maps?q=${encodedCountry}&t=&z=6&ie=UTF8&iwloc=&output=embed`;
        setMapUrl(url);
        setIsModalOpen(false);
    };

    const handleSelectDropdown = (c) => {
        setSelectedCountry(c);
        setIsDropdownOpen(false);
        setSearchQuery(''); // Reset search when picked
    };

    const handleCreateSuccess = (propertyId) => {
        setIsCreatePostOpen(false);
        alert(`Property Listing Published Successfully!\nSystem ID: ${propertyId}`);
    };

    return (
        <div className="default-page-root">

            {/* --- COUNTRY MODAL GATEWAY --- */}
            {isModalOpen && (
                <div className="country-modal-overlay">
                    <div className="country-modal-card">
                        <GlobeIcon />
                        <h2>Select Region</h2>
                        <p>Which country do you want to use for this platform?</p>

                        <div className="custom-dropdown-container">
                            <div className="dropdown-selected" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                {selectedCountry}
                                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                            </div>

                            {isDropdownOpen && (
                                <div className="dropdown-list-wrapper">
                                    <div className="dropdown-search-box">
                                        <input
                                            type="text"
                                            placeholder="Search country..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <ul className="dropdown-list">
                                        {filteredCountries.length > 0 ? (
                                            filteredCountries.map(c => (
                                                <li
                                                    key={c}
                                                    className={c === selectedCountry ? 'active' : ''}
                                                    onClick={() => handleSelectDropdown(c)}
                                                >
                                                    {c}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="no-results">No countries found</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button className="locate-btn" onClick={handleLocate}>
                            Locate
                        </button>
                    </div>
                </div>
            )}


            {/* --- MAIN DASHBOARD --- */}
            <div className="dashboard-header">
                {/* Brand Left */}
                <div className="header-brand">
                    Nay-Yar
                </div>

                {/* Operations Center */}
                <div className="header-menu">
                    <div className="menu-item-group" onClick={() => setIsCreatePostOpen(true)} style={{ cursor: 'pointer' }}>
                        <GlassIcon type="create" />
                        <span className="menu-label">Create Post</span>
                    </div>

                    <div className="menu-item-group">
                        <GlassIcon type="search" />
                        <span className="menu-label">Search</span>
                    </div>
                </div>

                {/* User Right */}
                <div className="header-user">
                    <div className="user-avatar">
                        {user.FullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="user-name">{user.FullName}</span>
                </div>
            </div>

            {/* Google Map Container */}
            <div className="map-container">
                {mapUrl ? (
                    <iframe
                        title="Region Map"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapUrl}
                        className="live-map-frame"
                    ></iframe>
                ) : (
                    <div className="map-placeholder">
                        <span>Awaiting Region Selection...</span>
                    </div>
                )}
            </div>

            {/* --- CREATE POST MODAL --- */}
            <CrudModal
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
                title="Create Property Listing"
            >
                <CreatePostForm
                    user={user}
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setIsCreatePostOpen(false)}
                />
            </CrudModal>

        </div>
    );
};

export default DefaultPage;
