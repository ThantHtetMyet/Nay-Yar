import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GlassIcon from './GlassIcon';
import './DefaultPage.css';
import CrudModal from '../../components/CrudModal/CrudModal';
import CreatePostForm from '../PropertyPost/CreatePostForm';
import PropertyDetail from '../PropertyPost/PropertyDetail';
import EditPostForm from '../PropertyPost/EditPostForm';
import UserPage from '../UserPage/UserPage';
import AlertModal from '../../components/AlertModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { getAllListings, submitFeedback, getFeedbacks, getLinkHits, trackLinkHit, getUsers, changePasswordRaw } from '../../services/api';

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
    PT001: 'HDB',
    PT002: 'Condo',
};
const LT_LABELS = { LT001: 'Rent', LT002: 'Sale' };

const MRT_STATIONS = [
    "Admiralty MRT", "Aljunied MRT", "Ang Mo Kio MRT", "Bartley MRT", "Bayfront MRT", "Beauty World MRT", "Bedok MRT", "Bedok North MRT", "Bedok Reservoir MRT", "Bencoolen MRT", "Bendemeer MRT", "Bishan MRT", "Boon Keng MRT", "Boon Lay MRT", "Botanic Gardens MRT", "Braddell MRT", "Bras Basah MRT", "Buangkok MRT", "Bugis MRT", "Bukit Batok MRT", "Bukit Brown MRT", "Bukit Gombak MRT", "Bukit Panjang MRT", "Buona Vista MRT", "Caldecott MRT", "Canberra MRT", "Cantonment MRT", "Cashew MRT", "Changi Airport MRT", "Chinatown MRT", "Chinese Garden MRT", "Choa Chu Kang MRT", "City Hall MRT", "Clementi MRT", "Commonwealth MRT", "Dakota MRT", "Dhoby Ghaut MRT", "Dover MRT", "Downtown MRT", "Esplanade MRT", "Eunos MRT", "Expo MRT", "Farrer Park MRT", "Farrer Road MRT", "Fort Canning MRT", "Geylang Bahru MRT", "Gul Circle MRT", "HarbourFront MRT", "Haw Par Villa MRT", "Hillview MRT", "Holland Village MRT", "Hougang MRT", "Jalan Besar MRT", "Joo Koon MRT", "Jurong East MRT", "Kaki Bukit MRT", "Kallang MRT", "Kembangan MRT", "Kent Ridge MRT", "Khatib MRT", "King Albert Park MRT", "Kovan MRT", "Kranji MRT", "Labrador Park MRT", "Lakeside MRT", "Lavender MRT", "Lorong Chuan MRT", "MacPherson MRT", "Marina Bay MRT", "Marina South Pier MRT", "Marsiling MRT", "Marymount MRT", "Mattar MRT", "Maxwell MRT", "Mountbatten MRT", "Newton MRT", "Nicoll Highway MRT", "Novena MRT", "one-north MRT", "Orchard MRT", "Outram Park MRT", "Pasir Panjang MRT", "Pasir Ris MRT", "Paya Lebar MRT", "Pioneer MRT", "Potong Pasir MRT", "Promenade MRT", "Punggol MRT", "Queenstown MRT", "Raffles Place MRT", "Redhill MRT", "Rochor MRT", "Sembawang MRT", "Sengkang MRT", "Serangoon MRT", "Shenton Way MRT", "Simei MRT", "Somerset MRT", "Stadium MRT", "Stevens MRT", "Tai Seng MRT", "Tampines MRT", "Tampines East MRT", "Tampines West MRT", "Tan Kah Kee MRT", "Tanah Merah MRT", "Tanjong Pagar MRT", "Telok Ayer MRT", "Telok Blangah MRT", "Tiong Bahru MRT", "Toa Payoh MRT", "Tuas Crescent MRT", "Tuas Link MRT", "Tuas West Road MRT", "Ubi MRT", "Upper Changi MRT", "Woodlands MRT", "Woodlands North MRT", "Woodlands South MRT", "Woodleigh MRT", "Yew Tee MRT", "Yio Chu Kang MRT", "Yishun MRT"
];

// ── Property type emoji map ───────────────────────────────────────────────
const PT_EMOJIS = {
    PT001: '🏘️', // HDB
    PT002: '🏙️', // Condo
};

// Build a Leaflet divIcon for a given property type (normal or nearby-highlighted)
const makePropertyIcon = (propertyType, isNear = false) => {
    const emoji = PT_EMOJIS[propertyType] || '🏠';
    return L.divIcon({
        html: `<div class="prop-pin${isNear ? ' prop-pin-near' : ''}"><span class="prop-pin-emoji">${emoji}</span></div>`,
        className: '',
        iconSize: [44, 54],
        iconAnchor: [22, 54],
        popupAnchor: [0, -56],
    });
};

// Fallback default icon (used for reset)
const PROPERTY_ICON = makePropertyIcon('PT001');

// ── Main Page ──────────────────────────────────────────────────────────────
const DefaultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const stateUser = location.state?.user;
        if (stateUser) return stateUser;
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) return null;
        try {
            return JSON.parse(sessionUser);
        } catch {
            return null;
        }
    });
    const isLoggedIn = !!user;
    const isFeedbackAdmin = user?.UserID === 'Thant';
    const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

    const [isLocatingUser, setIsLocatingUser] = useState(false);

    // CRUD modal
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [modalView, setModalView] = useState('create');
    const [activePropertyId, setActivePropertyId] = useState(null);
    const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({
        rating: 3,
        message: '',
        name: '',
        phone: '',
    });
    const [feedbackList, setFeedbackList] = useState([]);
    const [feedbackListError, setFeedbackListError] = useState('');
    const [isFeedbackListLoading, setIsFeedbackListLoading] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [adminTab, setAdminTab] = useState('hits');
    const [linkHits, setLinkHits] = useState([]);
    const [linkHitsError, setLinkHitsError] = useState('');
    const [isLinkHitsLoading, setIsLinkHitsLoading] = useState(false);
    const [userList, setUserList] = useState([]);
    const [userListError, setUserListError] = useState('');
    const [isUserListLoading, setIsUserListLoading] = useState(false);
    const [changePasswordForm, setChangePasswordForm] = useState({ newPassword: '', confirmPassword: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [copyToast, setCopyToast] = useState({ isOpen: false, message: '' });
    const copyToastTimerRef = useRef(null);
    const defaultHitTrackedRef = useRef(false);

    // Map state
    const [countryGeo, setCountryGeo] = useState(null); // geocoded result for selected country
    const [markerListings, setMarkerListings] = useState([]);   // listings with {lat, lng}
    const [markersVersion, setMarkersVersion] = useState(0);    // bump to reload markers
    const [focusPropertyId, setFocusPropertyId] = useState(null);

    // Success Alert state — focusId is set here so the map refresh and the
    // focus step don't interfere with each other.
    const [appAlert, setAppAlert] = useState({ isOpen: false, type: 'success', title: '', message: '', focusId: null, actionText: '', onAction: null, cancelText: '', onCancel: null, showConfirm: true });

    // Refs — Leaflet operates on the real DOM
    const mapDivRef = useRef(null);
    const leafletMapRef = useRef(null);
    const markersRef = useRef([]);
    const geocacheRef = useRef({});  // postal-code → {lat,lng}
    const mrtMarkerRef = useRef(null);
    const userLocationMarkerRef = useRef(null);
    const nearbyHighlightedRef = useRef([]);

    // MRT search state
    const [mrtQuery, setMrtQuery] = useState('');
    const [isMrtDropdownOpen, setIsMrtDropdownOpen] = useState(false);
    const [selectedMrt, setSelectedMrt] = useState('Select MRT Station');

    const filteredMrtStations = MRT_STATIONS.filter(s =>
        s.toLowerCase().includes(mrtQuery.toLowerCase())
    );

    const showCopyToast = (message) => {
        setCopyToast({ isOpen: true, message });
        if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
        copyToastTimerRef.current = setTimeout(() => {
            setCopyToast({ isOpen: false, message: '' });
        }, 2000);
    };

    const copyTextToClipboard = async (text) => {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    };

    useEffect(() => () => {
        if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    }, []);

    useEffect(() => {
        if (defaultHitTrackedRef.current) return;
        defaultHitTrackedRef.current = true;
        trackLinkHit('default-page', window.location.href).catch(() => { });
    }, []);

    useEffect(() => {
        const propertyFromSearch = new URLSearchParams(location.search).get('property');
        const pathMatch = location.pathname.match(/^\/property(?:=|\/)(.+)$/);
        const propertyFromPath = pathMatch ? decodeURIComponent(pathMatch[1] || '') : null;
        const locationHashMatch = (location.hash || '').match(/#\/?property(?:=|\/)([^&]+)/);
        const propertyFromLocationHash = locationHashMatch ? decodeURIComponent(locationHashMatch[1] || '') : null;
        const windowHashMatch = window.location.hash.match(/#\/?property(?:=|\/)([^&]+)/);
        const propertyFromWindowHash = windowHashMatch ? decodeURIComponent(windowHashMatch[1] || '') : null;
        const plainHashMatch = window.location.hash.match(/^#property=([^&]+)/);
        const propertyFromPlainHash = plainHashMatch ? decodeURIComponent(plainHashMatch[1] || '') : null;
        const propertyId = propertyFromSearch || propertyFromPath || propertyFromLocationHash || propertyFromWindowHash || propertyFromPlainHash;
        if (!propertyId) return;
        setActivePropertyId(propertyId);
        setModalView('detail');
        setIsCreatePostOpen(true);
        setFocusPropertyId(propertyId);
    }, [location.pathname, location.search, location.hash]);

    // ── 1. Initialize Leaflet map ────────────────────────────────────────
    useEffect(() => {
        if (!mapDivRef.current || leafletMapRef.current) return;

        const map = L.map(mapDivRef.current, {
            center: [1.3521, 103.8198],
            zoom: 12,
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
        const savedCountry = sessionStorage.getItem('nayYarCountry');
        if (savedCountry && savedCountry.toLowerCase() === 'singapore') {
            leafletMapRef.current.flyTo([1.3521, 103.8198], 12, { duration: 1.5 });
            return;
        }
        if (bb) {
            leafletMapRef.current.flyToBounds(
                [[parseFloat(bb[0]), parseFloat(bb[2])],
                [parseFloat(bb[1]), parseFloat(bb[3])]],
                { padding: [60, 60], maxZoom: 12, duration: 1.5 }
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

    useEffect(() => {
        if (sessionStorage.getItem('nayYarCountryGeo')) return;
        const run = async () => {
            const geo = await geocodeQuery('Singapore', 'sg');
            if (geo) {
                setCountryGeo(geo);
                sessionStorage.setItem('nayYarCountry', 'Singapore');
                sessionStorage.setItem('nayYarCountryGeo', JSON.stringify(geo));
            }
        };
        run();
    }, []);

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
    }, [markersVersion, appAlert.focusId, countryGeo]);

    // ── 5. Sync Leaflet markers whenever markerListings changes ──────────
    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        // Remove old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        markerListings.forEach(listing => {
            const icon = makePropertyIcon(listing.PropertyType);
            const marker = L.marker([listing.lat, listing.lng], { icon });
            marker.propertyType = listing.PropertyType; // store for icon reset

            const ltLabel = LT_LABELS[listing.ListingType] || '';
            const ptName = PT_NAMES[listing.PropertyType] || listing.PropertyType || '';
            const isRoomRent = (() => {
                if (!listing.PropertySubType) return false;
                try {
                    const parsed = JSON.parse(listing.PropertySubType);
                    // Check if it's NOT a Whole Unit (RST001) and has items
                    return Array.isArray(parsed) && parsed.length > 0 && parsed[0].SubTypeID !== 'RST001';
                } catch { return false; }
            })();

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

                        // Group rooms by label AND price to show counts accurately
                        const grouped = {};
                        rooms.forEach(r => {
                            const key = `${r.Label || 'Room'}-${r.Price}`;
                            if (!grouped[key]) {
                                grouped[key] = { label: r.Label || 'Room', price: r.Price, count: 0 };
                            }
                            grouped[key].count++;
                        });

                        Object.values(grouped).forEach(item => {
                            const row = document.createElement('div');
                            row.className = 'prop-popup-room-row';
                            const lblEl = document.createElement('span');
                            lblEl.className = 'prop-popup-room-label';

                            const p = parseFloat(item.price);
                            const priceText = isFinite(p) && p > 0 ? `$${p.toLocaleString()}/mo` : 'Inquire';
                            const countText = item.count > 1 ? ` (${item.count})` : '';

                            lblEl.textContent = `${item.label}${countText} - ${priceText}`;

                            row.appendChild(lblEl);
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

            const shareBtn = document.createElement('button');
            shareBtn.className = 'prop-popup-btn prop-popup-share';
            shareBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a2.5 2.5 0 0 0 0-1.39l7.05-4.11A2.99 2.99 0 1 0 15 5a3 3 0 0 0 .09.7L8.04 9.81A2.99 2.99 0 1 0 6 15a2.99 2.99 0 0 0 2.04-.81l7.12 4.16a2.79 2.79 0 1 0 .84-2.27Z"/>
                </svg>
                <span>Share</span>
            `;
            shareBtn.onclick = async () => {
                const propertyLink = `${window.location.origin}${window.location.pathname}${window.location.search}#/property/${listing.PropertyID}`;
                try {
                    const success = await copyTextToClipboard(propertyLink);
                    showCopyToast(success ? 'Copied link' : 'Unable to copy');
                } catch {
                    showCopyToast('Unable to copy');
                }
            };
            card.appendChild(shareBtn);

            marker.bindPopup(card, { maxWidth: 260, className: 'prop-popup' });
            marker.listingID = listing.PropertyID;
            marker.propertyType = listing.PropertyType;
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
            setFocusPropertyId(null);
        }
    }, [markerListings, focusPropertyId]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const openCreate = () => {
        setModalView('create');
        setActivePropertyId(null);
        setIsCreatePostOpen(true);
    };

    const openCreateWithAuthCheck = () => {
        if (!isLoggedIn) {
            setIsAuthPromptOpen(true);
            return;
        }
        openCreate();
    };

    const closeModal = () => {
        setIsCreatePostOpen(false);
        setActivePropertyId(null);
        setModalView('create');
        setSelectedFeedback(null);
    };

    const openMyProfile = () => {
        setModalView('user');
        setIsCreatePostOpen(true);
    };

    const openChangePassword = () => {
        setChangePasswordForm({ newPassword: '', confirmPassword: '' });
        setModalView('change-password');
        setIsCreatePostOpen(true);
    };

    const handleUserUpdate = (nextUser) => {
        setUser(nextUser);
        sessionStorage.setItem('user', JSON.stringify(nextUser));
    };

    const handleDeleteSuccess = () => {
        closeModal();
        setMarkersVersion(v => v + 1);
    };

    const openSearch = () => {
        setModalView('search');
        setActivePropertyId(null);
        setIsCreatePostOpen(true);
    };

    const openFeedback = () => {
        setFeedbackForm({
            rating: 3,
            message: '',
            name: user?.FullName || '',
            phone: '',
        });
        setModalView('feedback');
        setActivePropertyId(null);
        setIsCreatePostOpen(true);
    };

    const openAdmin = () => {
        if (!isFeedbackAdmin) return;
        setModalView('admin');
        setActivePropertyId(null);
        setSelectedFeedback(null);
        setAdminTab('hits');
        setIsCreatePostOpen(true);
    };

    useEffect(() => {
        if (modalView !== 'admin' || !isFeedbackAdmin) return;
        let isMounted = true;
        setIsFeedbackListLoading(true);
        setFeedbackListError('');
        setIsLinkHitsLoading(true);
        setLinkHitsError('');
        setIsUserListLoading(true);
        setUserListError('');
        Promise.all([
            getFeedbacks(user?.UserID || ''),
            getLinkHits(user?.UserID || ''),
            getUsers(user?.UserID || ''),
        ])
            .then(([feedbackRes, hitsRes, usersRes]) => {
                if (!isMounted) return;
                if (feedbackRes?.success) {
                    setFeedbackList(feedbackRes.data || []);
                } else {
                    setFeedbackListError(feedbackRes?.error || 'Unable to load feedback.');
                }
                if (hitsRes?.success) {
                    setLinkHits(hitsRes.data || []);
                } else {
                    setLinkHitsError(hitsRes?.error || 'Unable to load link hits.');
                }
                if (usersRes?.success) {
                    setUserList(usersRes.data || []);
                } else {
                    setUserListError(usersRes?.error || 'Unable to load users.');
                }
            })
            .catch(() => {
                if (!isMounted) return;
                setFeedbackListError('Unable to load feedback.');
                setLinkHitsError('Unable to load link hits.');
                setUserListError('Unable to load users.');
            })
            .finally(() => {
                if (!isMounted) return;
                setIsFeedbackListLoading(false);
                setIsLinkHitsLoading(false);
                setIsUserListLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, [modalView, isFeedbackAdmin, user?.UserID]);

    // Reset MRT highlights and clear station marker
    const clearMrtSearch = () => {
        nearbyHighlightedRef.current.forEach(marker => {
            marker.setIcon(makePropertyIcon(marker.propertyType));
        });
        nearbyHighlightedRef.current = [];
        if (mrtMarkerRef.current) {
            mrtMarkerRef.current.remove();
            mrtMarkerRef.current = null;
        }
        setSelectedMrt('Select MRT Station');
    };

    const handleSearchMrt = async () => {
        if (selectedMrt === 'Select MRT Station') return;
        const geo = await geocodeQuery(selectedMrt + ', Singapore', 'sg');

        closeModal();

        setTimeout(() => {
            if (geo && leafletMapRef.current) {
                // Force leaflet to recalculate its dimensions now that the modal is gone
                leafletMapRef.current.invalidateSize();

                // Haversine distance in km
                const haversine = (lat1, lng1, lat2, lng2) => {
                    const R = 6371;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLng = (lng2 - lng1) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) ** 2 +
                        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                        Math.sin(dLng / 2) ** 2;
                    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                };

                // Reset previously highlighted icons back to default per-type icons
                nearbyHighlightedRef.current.forEach(marker => {
                    marker.setIcon(makePropertyIcon(marker.propertyType));
                });
                nearbyHighlightedRef.current = [];

                // Remove old MRT station marker
                if (mrtMarkerRef.current) {
                    mrtMarkerRef.current.remove();
                }

                // Place MRT station marker
                mrtMarkerRef.current = L.circleMarker([geo.lat, geo.lng], {
                    radius: 10,
                    fillColor: '#ef4444',
                    color: '#fff',
                    weight: 2.5,
                    opacity: 1,
                    fillOpacity: 0.95
                }).addTo(leafletMapRef.current).bindPopup(`<b>🚇 ${selectedMrt}</b>`)
                    .on('popupclose', () => {
                        clearMrtSearch();
                    })
                    .openPopup();

                // Fly to MRT station
                leafletMapRef.current.flyTo([geo.lat, geo.lng], 15, { duration: 1.5 });

                // Use markersRef directly — avoids stale closure on markerListings state
                const RADIUS_KM = 2.0;
                markersRef.current.forEach(marker => {
                    const latlng = marker.getLatLng();
                    const dist = haversine(geo.lat, geo.lng, latlng.lat, latlng.lng);
                    if (dist <= RADIUS_KM) {
                        marker.setIcon(makePropertyIcon(marker.propertyType, true));
                        nearbyHighlightedRef.current.push(marker);
                    }
                });
            }
        }, 150); // Small delay to let the modal disappear from the DOM
    };

    const handleCreateSuccess = (propertyId) => {
        closeModal();
        trackLinkHit('create-post', window.location.href).catch(() => { });
        setMarkersVersion(v => v + 1); // refresh map markers
        setAppAlert({
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
        setAppAlert({
            isOpen: true,
            type: 'success',
            title: 'Updated Successfully',
            message: 'Changes saved! Click OK to see your listing on the map.',
            focusId: propertyId,
        });
    };

    const handleGetUserLocation = () => {
        if (!navigator.geolocation) {
            setAppAlert({
                isOpen: true,
                type: 'error',
                title: 'Location Unavailable',
                message: 'Geolocation is not supported by your browser.',
                focusId: null,
            });
            return;
        }

        setIsLocatingUser(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const map = leafletMapRef.current;
                if (!map) return;

                // Remove existing marker if any
                if (userLocationMarkerRef.current) {
                    userLocationMarkerRef.current.remove();
                }

                // Create custom pulse marker
                const userIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: `
                        <div class="user-loc-dot">
                            <div class="user-loc-pulse"></div>
                        </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                userLocationMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
                    .addTo(map)
                    .bindPopup("<b>You are here</b>")
                    .openPopup();

                map.flyTo([latitude, longitude], 16, { duration: 1.5 });
                setIsLocatingUser(false);
            },
            (err) => {
                // console.error('Geolocation error:', err);
                const isBlocked = err.code === 1;
                const title = isBlocked ? 'Location Access Denied' : 'Location Error';
                const message = isBlocked 
                    ? 'Location access is blocked. Please enable it in your browser settings (click the 🔒 or ⓘ icon in the address bar).' 
                    : 'Unable to retrieve your location. Check browser permissions.';
                
                setAppAlert({
                    isOpen: true,
                    type: 'error',
                    title: title,
                    message: message,
                    focusId: null,
                    actionText: 'ALLOW LOCATION',
                    onAction: () => {
                        setAppAlert(a => ({ ...a, isOpen: false, actionText: '', onAction: null, cancelText: '', onCancel: null, showConfirm: true }));
                        handleGetUserLocation();
                    },
                    cancelText: 'Cancel',
                    onCancel: () => {
                        setAppAlert(a => ({ ...a, isOpen: false, actionText: '', onAction: null, cancelText: '', onCancel: null, showConfirm: true }));
                        navigate('/');
                    },
                    showConfirm: false,
                });
                setIsLocatingUser(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleLogout = () => {
        setModalView('logout');
        setIsCreatePostOpen(true);
    };

    const handleChangePasswordInput = (event) => {
        const { name, value } = event.target;
        setChangePasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handleChangePasswordSubmit = async (event) => {
        event.preventDefault();
        if (isChangingPassword) return;
        const newPassword = String(changePasswordForm.newPassword || '');
        const confirmPassword = String(changePasswordForm.confirmPassword || '');
        if (!newPassword || !confirmPassword) {
            setAppAlert({
                isOpen: true,
                type: 'error',
                title: 'Missing Password',
                message: 'Please fill in both password fields.',
                focusId: null,
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            setAppAlert({
                isOpen: true,
                type: 'error',
                title: 'Password Mismatch',
                message: 'New Password and Confirm Password do not match.',
                focusId: null,
            });
            return;
        }
        if (newPassword.length < 6) {
            setAppAlert({
                isOpen: true,
                type: 'error',
                title: 'Weak Password',
                message: 'Password must be at least 6 characters long.',
                focusId: null,
            });
            return;
        }
        setIsChangingPassword(true);
        try {
            const { res, data } = await changePasswordRaw({
                userID: user?.UserID || '',
                newPassword,
            });
            if (!res.ok) {
                setAppAlert({
                    isOpen: true,
                    type: 'error',
                    title: 'Reset Failed',
                    message: data?.error || 'Unable to update password.',
                    focusId: null,
                });
                return;
            }
            setChangePasswordForm({ newPassword: '', confirmPassword: '' });
            setModalView('user');
            setAppAlert({
                isOpen: true,
                type: 'success',
                title: 'Password Updated',
                message: 'Your password has been updated successfully.',
                focusId: null,
            });
        } catch {
            setAppAlert({
                isOpen: true,
                type: 'error',
                title: 'Connection Error',
                message: 'Unable to update password right now.',
                focusId: null,
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const confirmLogout = () => {
        sessionStorage.removeItem('user');
        setUser(null);
        closeModal();
        navigate('/');
    };

    const handleLoginNavigate = () => {
        setIsAuthPromptOpen(false);
        navigate('/signin');
    };

    const handleSignupNavigate = () => {
        setIsAuthPromptOpen(false);
        navigate('/signup');
    };

    const handleFeedbackSubmit = async (event) => {
        event.preventDefault();
        if (isSubmittingFeedback) return;
        setIsSubmittingFeedback(true);
        const payload = {
            rating: feedbackForm.rating,
            message: feedbackForm.message,
            name: feedbackForm.name,
            phone: feedbackForm.phone,
            userID: user?.UserID || '',
            fullName: user?.FullName || '',
            email: user?.Email || '',
        };
        try {
            const res = await submitFeedback(payload);
            if (res?.success) {
                setIsCreatePostOpen(false);
                setActivePropertyId(null);
                setModalView('create');
                setAppAlert({
                    isOpen: true,
                    type: 'success',
                    title: 'Thank you!',
                    message: 'Your feedback has been received.',
                    focusId: null,
                });
            } else {
                setAppAlert({
                    isOpen: true,
                    type: 'error',
                    title: 'Feedback Failed',
                    message: res?.error || 'Unable to send feedback. Please try again.',
                    focusId: null,
                });
            }
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const formatFeedbackDate = (value) => {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString();
    };

    const linkHitLabels = {
        'default-page': 'Default Page',
        'signup-success': 'Signup Success',
        'create-post': 'Create Post',
    };
    const maxLinkHit = linkHits.reduce((max, item) => Math.max(max, Number(item.count || 0)), 0);

    const modalTitle = modalView === 'create' ? 'Create Property Listing'
        : modalView === 'edit' ? 'Edit Listing'
            : modalView === 'logout' ? 'Confirm Logout'
                : modalView === 'search' ? 'Search Area'
                    : modalView === 'feedback' ? 'Feedback'
                        : modalView === 'admin' ? 'Admin'
                            : modalView === 'user' ? 'My Account'
                                : modalView === 'change-password' ? 'Change Password'
                                    : 'Listing Details';

    const handleQuickMenuAction = (action) => () => {
        setIsQuickMenuOpen(false);
        action();
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="default-page-root">

            {isQuickMenuOpen && (
                <div className="quick-menu-overlay" onClick={() => setIsQuickMenuOpen(false)}>
                    <div className="quick-menu-panel" onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            className="quick-menu-close"
                            onClick={() => setIsQuickMenuOpen(false)}
                        >
                            ×
                        </button>
                        <div className="quick-menu-grid">
                            <button type="button" className="quick-menu-item" onClick={handleQuickMenuAction(openCreateWithAuthCheck)}>
                                <GlassIcon type="create" />
                                <span className="quick-menu-label">Create Post</span>
                            </button>
                            <button type="button" className="quick-menu-item" onClick={handleQuickMenuAction(openSearch)}>
                                <GlassIcon type="search" />
                                <span className="quick-menu-label">Search</span>
                            </button>
                            {isLoggedIn ? (
                                <>
                                    <button type="button" className="quick-menu-item" onClick={handleQuickMenuAction(openMyProfile)}>
                                        <GlassIcon type="user" initial={user.FullName.charAt(0).toUpperCase()} />
                                        <span className="quick-menu-label">Account</span>
                                    </button>
                                    <button type="button" className="quick-menu-item" onClick={handleQuickMenuAction(handleLogout)}>
                                        <GlassIcon type="logout" />
                                        <span className="quick-menu-label">Logout</span>
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="quick-menu-item" onClick={handleQuickMenuAction(handleLoginNavigate)}>
                                    <GlassIcon type="user" initial="S" />
                                    <span className="quick-menu-label">Sign-In</span>
                                </button>
                            )}
                            {isFeedbackAdmin && (
                                <button type="button" className="quick-menu-item" onClick={handleQuickMenuAction(openAdmin)}>
                                    <GlassIcon type="user" initial="A" />
                                    <span className="quick-menu-label">Admin</span>
                                </button>
                            )}
                            <button type="button" className="quick-menu-item" onClick={handleQuickMenuAction(openFeedback)}>
                                <GlassIcon type="feedback" />
                                <span className="quick-menu-label">Feedback</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {!isQuickMenuOpen && (
                <div className="quick-menu">
                    <button
                        type="button"
                        className="quick-menu-toggle"
                        onClick={() => setIsQuickMenuOpen((prev) => !prev)}
                    >
                        <span className="quick-menu-icon" />
                        <span className="quick-menu-text">Menu</span>
                    </button>
                </div>
            )}

            {/* ── Leaflet Map ── */}
            {/* ── Leaflet Map ── */}
            <div className="map-container">
                <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
                {copyToast.isOpen && (
                    <div className="copy-toast">
                        <span>{copyToast.message}</span>
                    </div>
                )}

                <div className="map-controls-group">
                    {isLocatingUser && (
                        <div className="loc-status-toast">
                            <div className="status-pulse-dot"></div>
                            Getting Location...
                        </div>
                    )}
                    <div className="loc-btn-wrapper">
                        <div className="loc-premium-tooltip">Show your location</div>
                        <button
                            className={`user-location-btn ${isLocatingUser ? 'locating' : ''}`}
                            onClick={handleGetUserLocation}
                        >
                            {isLocatingUser ? (
                                <div className="btn-spinner"></div>
                            ) : (
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── CRUD Modal ── */}
            <CrudModal isOpen={isCreatePostOpen} onClose={closeModal} title={modalTitle} overflowVisible={modalView === 'search'}>
                {modalView === 'create' && (
                    <CreatePostForm user={user} onSuccess={handleCreateSuccess} onCancel={closeModal} />
                )}
                {modalView === 'detail' && activePropertyId && (
                    <PropertyDetail
                        propertyID={activePropertyId}
                        user={user}
                        onEdit={handleEditClick}
                        onBack={closeModal}
                        onDeleted={handleDeleteSuccess}
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
                {modalView === 'user' && (
                    <UserPage
                        user={user}
                        onRefreshMap={() => setMarkersVersion(v => v + 1)}
                        onUserUpdate={handleUserUpdate}
                        onChangePassword={openChangePassword}
                    />
                )}
                {modalView === 'change-password' && (
                    <div className="change-password-view">
                        <form className="change-password-form" onSubmit={handleChangePasswordSubmit}>
                            <div className="change-password-row">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={changePasswordForm.newPassword}
                                    onChange={handleChangePasswordInput}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="change-password-row">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={changePasswordForm.confirmPassword}
                                    onChange={handleChangePasswordInput}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <div className="change-password-actions">
                                <button type="submit" className="btn-submit" disabled={isChangingPassword}>
                                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setModalView('user')} disabled={isChangingPassword}>
                                    Back
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                {modalView === 'admin' && isFeedbackAdmin && (
                    <div className="admin-panel">
                        <div className="admin-tabs">
                            <button
                                type="button"
                                className={`admin-tab ${adminTab === 'hits' ? 'active' : ''}`}
                                onClick={() => setAdminTab('hits')}
                            >
                                Link Hits
                            </button>
                            <button
                                type="button"
                                className={`admin-tab ${adminTab === 'feedback' ? 'active' : ''}`}
                                onClick={() => setAdminTab('feedback')}
                            >
                                Feedback
                            </button>
                            <button
                                type="button"
                                className={`admin-tab ${adminTab === 'users' ? 'active' : ''}`}
                                onClick={() => setAdminTab('users')}
                            >
                                Users
                            </button>
                        </div>

                        {adminTab === 'hits' && (
                            <div className="admin-hits">
                                {isLinkHitsLoading && (
                                    <div className="feedback-list-state">Loading link hits...</div>
                                )}
                                {!isLinkHitsLoading && linkHitsError && (
                                    <div className="feedback-list-state error">{linkHitsError}</div>
                                )}
                                {!isLinkHitsLoading && !linkHitsError && linkHits.length === 0 && (
                                    <div className="feedback-list-state">No link hits yet.</div>
                                )}
                                {!isLinkHitsLoading && !linkHitsError && linkHits.length > 0 && (
                                    <div className="link-hit-list">
                                        {linkHits.map((item) => {
                                            const width = maxLinkHit ? Math.round((Number(item.count || 0) / maxLinkHit) * 100) : 0;
                                            return (
                                                <div key={item.key} className="link-hit-row">
                                                    <div className="link-hit-info">
                                                        <span className="link-hit-id">{linkHitLabels[item.key] || item.key}</span>
                                                    </div>
                                                    <div className="link-hit-bar">
                                                        <div className="link-hit-bar-fill" style={{ width: `${width}%` }} />
                                                        <span className="link-hit-count">{item.count || 0}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {adminTab === 'feedback' && (
                            <div className="feedback-list-view">
                                {isFeedbackListLoading && (
                                    <div className="feedback-list-state">Loading feedback...</div>
                                )}
                                {!isFeedbackListLoading && feedbackListError && (
                                    <div className="feedback-list-state error">{feedbackListError}</div>
                                )}
                                {!isFeedbackListLoading && !feedbackListError && feedbackList.length === 0 && (
                                    <div className="feedback-list-state">No feedback yet.</div>
                                )}
                                {!isFeedbackListLoading && !feedbackListError && feedbackList.length > 0 && (
                                    <div className="feedback-list">
                                        {feedbackList.map((item) => (
                                            <button
                                                key={item.FeedbackID}
                                                type="button"
                                                className="feedback-list-item"
                                                onClick={() => {
                                                    setSelectedFeedback(item);
                                                }}
                                            >
                                                <div className="feedback-list-row">
                                                    <span className="feedback-list-name">
                                                        {item.Name || item.FullName || item.UserID || 'Anonymous'}
                                                    </span>
                                                    <span className="feedback-list-rating">Rating {item.Rating || '—'}</span>
                                                </div>
                                                <div className="feedback-list-message">
                                                    {item.Message && item.Message.length > 120 ? `${item.Message.slice(0, 120)}…` : (item.Message || 'No message')}
                                                </div>
                                                <div className="feedback-list-meta">
                                                    <span>{formatFeedbackDate(item.CreatedDate)}</span>
                                                    <span>{item.Email || ''}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedFeedback && (
                                    <div className="feedback-detail-view">
                                        <div className="feedback-detail-card">
                                            <div className="feedback-detail-row">
                                                <span>Name</span>
                                                <strong>{selectedFeedback.Name || selectedFeedback.FullName || selectedFeedback.UserID || 'Anonymous'}</strong>
                                            </div>
                                            <div className="feedback-detail-row">
                                                <span>Rating</span>
                                                <strong>{selectedFeedback.Rating || '—'}</strong>
                                            </div>
                                            <div className="feedback-detail-row">
                                                <span>Date</span>
                                                <strong>{formatFeedbackDate(selectedFeedback.CreatedDate)}</strong>
                                            </div>
                                            <div className="feedback-detail-row">
                                                <span>Email</span>
                                                <strong>{selectedFeedback.Email || '—'}</strong>
                                            </div>
                                            <div className="feedback-detail-row">
                                                <span>Phone</span>
                                                <strong>{selectedFeedback.Phone || '—'}</strong>
                                            </div>
                                            <div className="feedback-detail-message">
                                                {selectedFeedback.Message || 'No message'}
                                            </div>
                                        </div>
                                        <div className="feedback-detail-actions">
                                            <button
                                                type="button"
                                                className="btn-cancel"
                                                onClick={() => setSelectedFeedback(null)}
                                            >
                                                Hide detail
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {adminTab === 'users' && (
                            <div className="admin-users">
                                {isUserListLoading && (
                                    <div className="feedback-list-state">Loading users...</div>
                                )}
                                {!isUserListLoading && userListError && (
                                    <div className="feedback-list-state error">{userListError}</div>
                                )}
                                {!isUserListLoading && !userListError && userList.length === 0 && (
                                    <div className="feedback-list-state">No users found.</div>
                                )}
                                {!isUserListLoading && !userListError && userList.length > 0 && (
                                    <div className="user-list-table">
                                        <div className="user-list-row header">
                                            <span>UserID</span>
                                            <span>Phone</span>
                                            <span>Created</span>
                                        </div>
                                        {userList.map((u) => (
                                            <div key={`${u.UserID}-${u.MobileNo}`} className="user-list-row">
                                                <span>{u.UserID || '—'}</span>
                                                <span>{u.MobileNo || '—'}</span>
                                                <span>{formatFeedbackDate(u.CreatedDate)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {modalView === 'feedback' && (
                    <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                        <div className="form-section">
                            <p className="feedback-intro">Tell us how convenient this platform is and report any issues.</p>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Rating</label>
                                    <div className="feedback-rating">
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                className={`feedback-star ${feedbackForm.rating >= value ? 'active' : ''}`}
                                                onClick={() => setFeedbackForm(f => ({ ...f, rating: value }))}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <span className="feedback-rating-text">
                                        {feedbackForm.rating === 5 ? 'Very convenient'
                                            : feedbackForm.rating === 4 ? 'Convenient'
                                                : feedbackForm.rating === 3 ? 'Okay'
                                                    : feedbackForm.rating === 2 ? 'Hard to use'
                                                        : 'Not convenient'}
                                    </span>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={feedbackForm.name}
                                        onChange={(e) => setFeedbackForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Phone (optional)</label>
                                    <input
                                        type="tel"
                                        value={feedbackForm.phone}
                                        onChange={(e) => setFeedbackForm(f => ({ ...f, phone: e.target.value }))}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Feedback or issue details</label>
                                    <textarea
                                        rows="4"
                                        value={feedbackForm.message}
                                        onChange={(e) => setFeedbackForm(f => ({ ...f, message: e.target.value }))}
                                        placeholder="Share your experience or describe the issue..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="form-actions feedback-actions">
                            <button type="button" className="btn-cancel" onClick={closeModal} disabled={isSubmittingFeedback}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-submit" disabled={isSubmittingFeedback}>
                                {isSubmittingFeedback ? 'Sending...' : 'Send Feedback'}
                            </button>
                        </div>
                    </form>
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
                {modalView === 'search' && (
                    <div className="search-mrt-view" style={{ padding: '10px 10px 30px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.4rem', color: '#1c2433', fontWeight: 800 }}>Explore by Station</h2>
                            <p style={{ color: '#5c6880', fontSize: '0.9rem' }}>Select an MRT station to view nearby listings.</p>
                        </div>
                        <div className="custom-dropdown-container" style={{ marginBottom: '30px' }}>
                            <div className="dropdown-selected" onClick={() => setIsMrtDropdownOpen(!isMrtDropdownOpen)}>
                                {selectedMrt}
                                <span className={`dropdown-arrow ${isMrtDropdownOpen ? 'open' : ''}`}>▼</span>
                            </div>

                            {isMrtDropdownOpen && (
                                <div className="dropdown-list-wrapper dropdown-downward">
                                    <div className="dropdown-search-box">
                                        <input
                                            type="text"
                                            placeholder="Type station name..."
                                            value={mrtQuery}
                                            onChange={(e) => setMrtQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <ul className="dropdown-list">
                                        {filteredMrtStations.length > 0
                                            ? filteredMrtStations.map(s => (
                                                <li
                                                    key={s}
                                                    className={s === selectedMrt ? 'active' : ''}
                                                    onClick={() => {
                                                        setSelectedMrt(s);
                                                        setIsMrtDropdownOpen(false);
                                                        setMrtQuery('');
                                                    }}
                                                >{s}</li>
                                            ))
                                            : <li className="no-results">No stations found</li>
                                        }
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="logout-modal-actions">
                            <button className="logout-btn-no" onClick={() => { clearMrtSearch(); closeModal(); }}>Clear &amp; Close</button>
                            <button className="logout-btn-yes" style={{ background: 'rgba(78, 128, 240, 0.45)', color: '#1c2433', borderColor: 'rgba(255, 255, 255, 0.8)' }} onClick={handleSearchMrt}>Search Area</button>
                        </div>
                    </div>
                )}
            </CrudModal>

            <AlertModal
                isOpen={appAlert.isOpen}
                type={appAlert.type}
                title={appAlert.title}
                message={appAlert.message}
                actionText={appAlert.actionText}
                onAction={appAlert.onAction}
                cancelText={appAlert.cancelText}
                onCancel={appAlert.onCancel}
                showConfirm={appAlert.showConfirm}
                onClose={() => {
                    const fid = appAlert.focusId;
                    setAppAlert(a => ({ ...a, isOpen: false, focusId: null, actionText: '', onAction: null, cancelText: '', onCancel: null, showConfirm: true }));
                    if (fid) setFocusPropertyId(fid);
                }}
            />
            {isAuthPromptOpen && (
                <ConfirmModal
                    title="Login required to create a post"
                    message="Please sign in or sign up to continue. If you are not ready, choose Stay Here."
                    type="info"
                    confirmText="Sign In"
                    cancelText="Sign Up"
                    neutralText="Map"
                    onConfirm={handleLoginNavigate}
                    onCancel={handleSignupNavigate}
                    onNeutral={() => setIsAuthPromptOpen(false)}
                    onClose={() => setIsAuthPromptOpen(false)}
                />
            )}

        </div>
    );
};

export default DefaultPage;
