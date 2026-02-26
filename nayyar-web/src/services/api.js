/**
 * Nay-Yar API Service Layer
 * ─────────────────────────────────────────────────────────────
 * All HTTP calls to the backend are defined here.
 * Components should import these functions instead of calling fetch() directly.
 *
 * Usage:
 *   import { getPropertyTypes, createListing } from '../../services/api';
 */

const hostName = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalhost = hostName === 'localhost' || hostName === '127.0.0.1';
const DEFAULT_REMOTE_URL = 'https://nay-yar.onrender.com/api';
const BASE_URL = process.env.REACT_APP_API_BASE || (isLocalhost ? 'http://localhost:5010/api' : DEFAULT_REMOTE_URL);

// ── Utility ────────────────────────────────────────────────────
const post = async (endpoint, body) => {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
};

const get = async (endpoint) => {
    const res = await fetch(`${BASE_URL}/${endpoint}`, { cache: 'no-store' });
    return res.json();
};

// ── Auth ───────────────────────────────────────────────────────
export const login = (credentials) => post('login', credentials);
export const signup = (userData) => post('signup', userData);

/**
 * Raw auth variants — returns { res, data } so callers can inspect
 * res.ok and res.status for fine-grained error handling.
 */
export const loginRaw = async (credentials) => {
    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    const data = await res.json();
    return { res, data };
};

export const signupRaw = async (userData) => {
    const res = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    const data = await res.json();
    return { res, data };
};

// ── Lookup Dropdowns ───────────────────────────────────────────
export const getPropertyTypes = () => get('property-types');
export const getListingTypes = () => get('listing-types');
export const getPropertySubTypes = () => get('property-subtypes');

/** Fetch all three dropdowns in parallel */
export const getAllLookups = async () => {
    const [ptData, ltData, pstData] = await Promise.all([
        getPropertyTypes(),
        getListingTypes(),
        getPropertySubTypes(),
    ]);
    return { ptData, ltData, pstData };
};

// ── Listings ───────────────────────────────────────────────────
export const createListing = (payload) => post('listings', payload);

export const getAllListings = () => get('listings');
export const getMyListings = (createdBy) => get(`listings?createdBy=${encodeURIComponent(createdBy)}`);
export const getListingById = (id) => get(`listings/${id}`);

export const updateListing = async (id, payload) => {
    const res = await fetch(`${BASE_URL}/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
};

export const deleteListing = async (id) => {
    const res = await fetch(`${BASE_URL}/listings/${id}`, { method: 'DELETE' });
    return res.json();
};

export const markListingClosed = async (id) => {
    const res = await fetch(`${BASE_URL}/listings/${id}/close`, { method: 'PATCH' });
    return res.json();
};

export const reopenListing = async (id) => {
    const res = await fetch(`${BASE_URL}/listings/${id}/reopen`, { method: 'PATCH' });
    return res.json();
};

export const submitFeedback = (payload) => post('feedback', payload);
