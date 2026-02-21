import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GlassIcon from './GlassIcon';
import './DefaultPage.css';
import GlobeIcon from './GlobeIcon';
import CrudModal from '../../components/CrudModal/CrudModal';
import CreatePostForm from '../PropertyPost/CreatePostForm';
import PropertyDetail from '../PropertyPost/PropertyDetail';
import EditPostForm from '../PropertyPost/EditPostForm';
import AlertModal from '../../components/AlertModal';
import { getAllListings } from '../../services/api';

// ── Nominatim rate limiter (module-level, shared across all callers) ───────
// Nominatim policy: max 1 request per second. Using a queue ensures that
// concurrent callers (e.g. React StrictMode double-invocation) still wait
// their turn instead of firing simultaneously.
let _lastNominatimAt = 0;
const NOMINATIM_GAP_MS = 1200; // 1.2 s — safely above the 1 s limit

// ── Geocode any query via Nominatim (OpenStreetMap, free) ─────────────────
const fetchGeocode = async (url) => {
    const wait = NOMINATIM_GAP_MS - (Date.now() - _lastNominatimAt);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    _lastNominatimAt = Date.now();

    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'NayYar-PropertyApp/1.0' } });
        if (!res.ok) return null;
        const data = await res.json();
        if (data && data[0]) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                boundingbox: data[0].boundingbox,
            };
        }
    } catch { }
    return null;
};

const COUNTRY_CODES = {
    Singapore: 'sg',
};

const getCountryCode = (country) => COUNTRY_CODES[country] || '';

const geocodeQuery = (query, countryCode = '') => {
    const params = new URLSearchParams({ format: 'json', limit: '1', q: query });
    if (countryCode) params.set('countrycodes', countryCode);
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    return fetchGeocode(url);
};

const geocodePostal = (postalCode, countryCode = '') => {
    const params = new URLSearchParams({ format: 'json', limit: '1', postalcode: postalCode });
    if (countryCode) params.set('countrycodes', countryCode);
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    return fetchGeocode(url);
};

const geocodePostalSG = async (postalCode) => {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(postalCode)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data && data.results && data.results[0]) {
            const first = data.results[0];
            return {
                lat: parseFloat(first.LATITUDE),
                lng: parseFloat(first.LONGITUDE),
            };
        }
    } catch { }
    return null;
};

// ── Lookup maps (static, matches XML data) ────────────────────────────────
const PT_NAMES = {
    PT001: 'House', PT002: 'Apartment', PT003: 'Room',
    PT004: 'Building', PT005: 'Studio', PT006: 'HDB', PT007: 'Condo',
};
const LT_LABELS = { LT001: 'Rent', LT002: 'Sale' };

// ── Custom house pin icon (created once, outside component) ───────────────
const PROPERTY_ICON = L.divIcon({
    html: `<div class="prop-pin"><span class="prop-pin-emoji">🏠</span></div>`,
    className: '',
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -56],
});

// ── Main Page ──────────────────────────────────────────────────────────────
const DefaultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user] = useState(() => {
        const stateUser = location.state?.user;
        if (stateUser) return stateUser;
        const sessionUser = sessionStorage.getItem('user');
        return sessionUser ? JSON.parse(sessionUser) : { FullName: 'Guest' };
    });

    // Country selection modal — shown only once per session
    const [isModalOpen, setIsModalOpen] = useState(
        () => !sessionStorage.getItem('nayYarRegionSet')
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(
        () => sessionStorage.getItem('nayYarCountry') || 'Singapore'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [locating, setLocating] = useState(false);

    // CRUD modal
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [modalView, setModalView] = useState('create');
    const [activePropertyId, setActivePropertyId] = useState(null);

    // Map state
    const [countryGeo, setCountryGeo] = useState(null); // geocoded result for selected country
    const [markerListings, setMarkerListings] = useState([]);   // listings with {lat, lng}
    const [markersVersion, setMarkersVersion] = useState(0);    // bump to reload markers
    const [focusPropertyId, setFocusPropertyId] = useState(null);

    // Success Alert state — focusId is set here so the map refresh and the
    // focus step don't interfere with each other.
    const [alert, setAlert] = useState({ isOpen: false, type: 'success', title: '', message: '', focusId: null });

    // Refs — Leaflet operates on the real DOM
    const mapDivRef = useRef(null);
    const leafletMapRef = useRef(null);
    const markersRef = useRef([]);
    const geocacheRef = useRef({});  // postal-code → {lat,lng}

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
    const filteredCountries = countries.filter(c =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── 1. Initialize Leaflet map ────────────────────────────────────────
    useEffect(() => {
        if (!mapDivRef.current || leafletMapRef.current) return;

        const map = L.map(mapDivRef.current, {
            center: [15, 100],   // center on Southeast Asia
            zoom: 4,
            zoomControl: true,
        });

        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
            }
        ).addTo(map);

        leafletMapRef.current = map;

        return () => {
            map.remove();
            leafletMapRef.current = null;
        };
    }, []);

    // ── 2. Fly to country when countryGeo changes ────────────────────────
    useEffect(() => {
        if (!countryGeo || !leafletMapRef.current) return;
        const bb = countryGeo.boundingbox; // [minLat, maxLat, minLon, maxLon]
        if (bb) {
            leafletMapRef.current.flyToBounds(
                [[parseFloat(bb[0]), parseFloat(bb[2])],
                [parseFloat(bb[1]), parseFloat(bb[3])]],
                { padding: [50, 50], maxZoom: 13, duration: 1.5 }
            );
        }
    }, [countryGeo]);

    // ── 2b. Restore saved region on page refresh (skip modal, fly immediately)
    useEffect(() => {
        const saved = sessionStorage.getItem('nayYarCountryGeo');
        if (saved) {
            try { setCountryGeo(JSON.parse(saved)); } catch { }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── 3. Invalidate map size after the overlay closes ──────────────────
    useEffect(() => {
        if (!isModalOpen && leafletMapRef.current) {
            setTimeout(() => leafletMapRef.current?.invalidateSize(), 150);
        }
    }, [isModalOpen]);

    // ── 4. Load listings from API and geocode postal codes ───────────────
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await getAllListings();
                if (cancelled || !res.success) return;

                const listings = Array.isArray(res.data)
                    ? res.data
                    : (res.data ? [res.data] : []);

                const withLocationInfo = listings.filter(l => (l.PostalCode || l.Address) && l.Country);

                // Prioritize the listing that was just created/edited (if any)
                const currentFocusId = alert.focusId;
                if (currentFocusId) {
                    const idx = withLocationInfo.findIndex(l => l.PropertyID === currentFocusId);
                    if (idx > -1) {
                        const [focused] = withLocationInfo.splice(idx, 1);
                        withLocationInfo.unshift(focused);
                    }
                }

                const results = [];

                for (let i = 0; i < withLocationInfo.length; i++) {
                    if (cancelled) return;
                    const l = withLocationInfo[i];
                    const countryCode = getCountryCode(l.Country);

                    const postalKey = l.PostalCode && l.Country ? `${l.PostalCode}|${l.Country}` : null;
                    const locKey = postalKey || [l.Address, l.City, l.Country].filter(Boolean).join('|');

                    let geo = geocacheRef.current[locKey];
                    if (!geo && postalKey) geo = geocacheRef.current[postalKey];
                    if (!geo) {
                        const fullQuery = [l.Address, l.PostalCode, l.City, l.Country].filter(Boolean).join(', ');
                        if (countryCode === 'sg' && l.PostalCode) {
                            geo = await geocodePostalSG(l.PostalCode);
                        }
                        if (!geo) geo = postalKey ? await geocodePostal(l.PostalCode, countryCode) : null;
                        if (!geo) geo = await geocodeQuery(fullQuery, countryCode);
                        if (geo) {
                            geocacheRef.current[locKey] = geo;
                            if (postalKey) geocacheRef.current[postalKey] = geo;
                        }
                    }

                    if (cancelled) return;

                    // Fallback so pins don't vanish if geocoding fails
                    const finalGeo = geo || countryGeo || { lat: 1.3521, lng: 103.8198 };

                    // Apply coordinate offset based on index (i) to ensure they never stack perfectly
                    const jitterLat = (i % 10) * 0.0004;
                    const jitterLng = (Math.floor(i / 10) % 10) * 0.0004;

                    const markerObj = {
                        ...l,
                        _geoKey: locKey,
                        lat: Number(finalGeo.lat) + jitterLat,
                        lng: Number(finalGeo.lng) + jitterLng,
                    };
                    results.push(markerObj);

                    // Immediate Update for the prioritized listing, etc.
                    if (l.PropertyID === currentFocusId && results.length === 1) {
                        setMarkerListings([...results]);
                    } else if (results.length % 10 === 0) {
                        setMarkerListings([...results]);
                    }
                }

                if (!cancelled) setMarkerListings([...results]);
            } catch (err) {
                if (!cancelled) console.error('[NayYar] Failed to load map listings:', err);
            }
        };

        load();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markersVersion, alert.focusId, countryGeo]);

    // ── 5. Sync Leaflet markers whenever markerListings changes ──────────
    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        // Remove old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        markerListings.forEach(listing => {
            const marker = L.marker([listing.lat, listing.lng], { icon: PROPERTY_ICON });

            const ltLabel = LT_LABELS[listing.ListingType] || '';
            const ptName = PT_NAMES[listing.PropertyType] || listing.PropertyType || '';
            const isRoomRent = listing.PropertyType === 'PT003' && listing.ListingType === 'LT001';

            // Build popup DOM manually so onClick reaches React state setters
            const card = document.createElement('div');
            card.className = 'prop-popup-card';

            // ── Header: badge + property type ──
            const header = document.createElement('div');
            header.className = 'prop-popup-header';
            const badge = document.createElement('span');
            badge.className = `prop-popup-badge ${ltLabel.toLowerCase()}`;
            badge.textContent = ltLabel;
            const proptype = document.createElement('span');
            proptype.className = 'prop-popup-proptype';
            proptype.textContent = ptName;
            header.appendChild(badge);
            header.appendChild(proptype);
            card.appendChild(header);

            // ── Price section ──
            if (isRoomRent && listing.PropertySubType) {
                try {
                    const rooms = JSON.parse(listing.PropertySubType);
                    if (rooms.length) {
                        const roomsDiv = document.createElement('div');
                        roomsDiv.className = 'prop-popup-rooms';
                        rooms.forEach(r => {
                            const row = document.createElement('div');
                            row.className = 'prop-popup-room-row';
                            const lbl = document.createElement('span');
                            lbl.className = 'prop-popup-room-label';
                            lbl.textContent = r.Label || '';
                            const priceEl = document.createElement('span');
                            priceEl.className = 'prop-popup-room-price';
                            const p = parseFloat(r.Price);
                            priceEl.textContent = isFinite(p) && p > 0 ? `$${p.toLocaleString()}/mo` : 'Inquire';
                            row.appendChild(lbl);
                            row.appendChild(priceEl);
                            roomsDiv.appendChild(row);
                        });
                        card.appendChild(roomsDiv);
                    }
                } catch { /* ignore parse error */ }
            } else {
                const priceEl = document.createElement('div');
                priceEl.className = 'prop-popup-price';
                const price = parseFloat(listing.Price);
                const suffix = listing.ListingType === 'LT001' ? '/mo' : '';
                priceEl.textContent = price > 0 ? `$${price.toLocaleString()}${suffix}` : 'Inquire';
                card.appendChild(priceEl);
            }

            // ── View Details button ──
            const btn = document.createElement('button');
            btn.className = 'prop-popup-btn';
            btn.textContent = 'View Details';
            btn.onclick = () => {
                setActivePropertyId(listing.PropertyID);
                setModalView('detail');
                setIsCreatePostOpen(true);
                map.closePopup();
            };
            card.appendChild(btn);

            marker.bindPopup(card, { maxWidth: 260, className: 'prop-popup' });
            marker.listingID = listing.PropertyID; // Store ID for focusing later
            marker.addTo(map);
            markersRef.current.push(marker);
        });

        if (markerListings.length > 1) {
            const bounds = L.latLngBounds(markerListings.map(l => [l.lat, l.lng]));
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
        }
    }, [markerListings]);

    // ── 6. Auto-focus on a specific property after success ───────────────
    useEffect(() => {
        if (!focusPropertyId || markerListings.length === 0 || !leafletMapRef.current) return;

        const targetMarker = markersRef.current.find(m => m.listingID === focusPropertyId);
        if (targetMarker) {
            leafletMapRef.current.flyTo(targetMarker.getLatLng(), 16, { duration: 1.5 });
            targetMarker.openPopup();
            setFocusPropertyId(null); // clear after focusing
        }
    }, [markerListings, focusPropertyId]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleLocate = async () => {
        setLocating(true);
        const geo = await geocodeQuery(selectedCountry, getCountryCode(selectedCountry));
        if (geo) {
            setCountryGeo(geo);
            // Persist so the modal is skipped and position is restored on refresh
            sessionStorage.setItem('nayYarRegionSet', '1');
            sessionStorage.setItem('nayYarCountry', selectedCountry);
            sessionStorage.setItem('nayYarCountryGeo', JSON.stringify(geo));
        }
        setLocating(false);
        setIsModalOpen(false);
    };

    const handleSelectDropdown = (c) => {
        setSelectedCountry(c);
        setIsDropdownOpen(false);
        setSearchQuery('');
    };

    const openCreate = () => {
        setModalView('create');
        setActivePropertyId(null);
        setIsCreatePostOpen(true);
    };

    const closeModal = () => {
        setIsCreatePostOpen(false);
        setActivePropertyId(null);
        setModalView('create');
    };

    const handleCreateSuccess = (propertyId) => {
        closeModal();
        setMarkersVersion(v => v + 1); // refresh map markers
        setAlert({
            isOpen: true,
            type: 'success',
            title: 'Created Successfully',
            message: 'Your property listing has been posted! Click OK to see it on the map.',
            focusId: propertyId,
        });
    };

    const handleEditClick = (propertyId) => { setActivePropertyId(propertyId); setModalView('edit'); };
    const handleEditSuccess = (propertyId) => {
        closeModal();
        setMarkersVersion(v => v + 1); // refresh map markers with updated data
        setAlert({
            isOpen: true,
            type: 'success',
            title: 'Updated Successfully',
            message: 'Changes saved! Click OK to see your listing on the map.',
            focusId: propertyId,
        });
    };

    const handleLogout = () => {
        setModalView('logout');
        setIsCreatePostOpen(true);
    };

    const confirmLogout = () => {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('nayYarRegionSet');
        sessionStorage.removeItem('nayYarCountry');
        sessionStorage.removeItem('nayYarCountryGeo');
        navigate('/');
    };

    const modalTitle = modalView === 'create' ? 'Create Property Listing'
        : modalView === 'edit' ? 'Edit Listing'
            : modalView === 'logout' ? 'Confirm Logout'
                : 'Listing Details';

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="default-page-root">

            {/* ── Country Selection Modal ── */}
            {isModalOpen && (
                <div className="country-modal-overlay">
                    <div className="country-modal-card">
                        <GlobeIcon />
                        <h2>Select Region</h2>
                        <p>Which country do you want to explore?</p>

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
                                        {filteredCountries.length > 0
                                            ? filteredCountries.map(c => (
                                                <li
                                                    key={c}
                                                    className={c === selectedCountry ? 'active' : ''}
                                                    onClick={() => handleSelectDropdown(c)}
                                                >{c}</li>
                                            ))
                                            : <li className="no-results">No countries found</li>
                                        }
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button className="locate-btn" onClick={handleLocate} disabled={locating}>
                            {locating ? 'Locating…' : 'Locate'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Header ── */}
            <div className="dashboard-header">
                <div className="header-brand">Nay-Yar</div>

                <div className="header-menu">
                    <div className="menu-item-group" onClick={openCreate}>
                        <GlassIcon type="create" />
                        <span className="menu-label">Create Post</span>
                    </div>
                    <div className="menu-item-group">
                        <GlassIcon type="search" />
                        <span className="menu-label">Search</span>
                    </div>
                    <div className="menu-item-group" onClick={handleLogout}>
                        <GlassIcon type="logout" />
                        <span className="menu-label">Logout</span>
                    </div>
                </div>

                <div className="header-user">
                    <div className="user-avatar">{user.FullName.charAt(0).toUpperCase()}</div>
                    <span className="user-name">{user.FullName}</span>
                </div>
            </div>

            {/* ── Leaflet Map ── */}
            <div className="map-container">
                <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
            </div>

            {/* ── CRUD Modal ── */}
            <CrudModal isOpen={isCreatePostOpen} onClose={closeModal} title={modalTitle}>
                {modalView === 'create' && (
                    <CreatePostForm user={user} onSuccess={handleCreateSuccess} onCancel={closeModal} />
                )}
                {modalView === 'detail' && activePropertyId && (
                    <PropertyDetail
                        propertyID={activePropertyId}
                        user={user}
                        onEdit={handleEditClick}
                        onBack={closeModal}
                        onDeleted={closeModal}
                    />
                )}
                {modalView === 'edit' && activePropertyId && (
                    <EditPostForm
                        propertyID={activePropertyId}
                        user={user}
                        onSuccess={handleEditSuccess}
                        onCancel={() => setModalView('detail')}
                    />
                )}
                {modalView === 'logout' && (
                    <div className="logout-confirm-view">
                        <div className="logout-icon-large">👋</div>
                        <h3>Oh no! You're leaving...</h3>
                        <p>Are you sure you want to log out of Nay-Yar?</p>
                        <div className="logout-modal-actions">
                            <button className="logout-btn-no" onClick={closeModal}>Stay here</button>
                            <button className="logout-btn-yes" onClick={confirmLogout}>Log Out</button>
                        </div>
                    </div>
                )}
            </CrudModal>

            <AlertModal
                isOpen={alert.isOpen}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => {
                    const fid = alert.focusId;
                    setAlert(a => ({ ...a, isOpen: false, focusId: null }));
                    if (fid) setFocusPropertyId(fid);
                }}
            />

        </div>
    );
};

export default DefaultPage;
