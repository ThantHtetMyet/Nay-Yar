import React, { useState, useEffect } from 'react';
import { getMyListings, markListingClosed, reopenListing, getAllLookups } from '../../services/api';
import './UserPage.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import AlertModal from '../../components/AlertModal';
import UserPropertyDetail from './UserPropertyDetail';

const UserPage = ({ user, onClose, onRefreshMap }) => {
    const [myListings, setMyListings] = useState([]);
    const [lookups, setLookups] = useState({ pt: [], lt: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmCloseId, setConfirmCloseId] = useState(null);
    const [activeDetailId, setActiveDetailId] = useState(null);
    const [appAlert, setAppAlert] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        const loadDocs = async () => {
            setIsLoading(true);
            try {
                // Fetch user listings
                const res = await getMyListings(user?.UserID || 'Guest');
                if (res.success) {
                    setMyListings(Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []));
                }

                // Fetch lookups
                const lookupRes = await getAllLookups();
                setLookups({
                    pt: lookupRes.ptData.success ? lookupRes.ptData.data : [],
                    lt: lookupRes.ltData.success ? lookupRes.ltData.data : [],
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadDocs();
    }, [user]);

    const handleCloseListing = (listingId) => {
        setConfirmCloseId(listingId);
    };

    const handleConfirmClose = async (listingIdOverride) => {
        const listingId = listingIdOverride || confirmCloseId;
        setConfirmCloseId(null);
        try {
            const res = await markListingClosed(listingId);
            if (res.success) {
                // Update local state instantly
                setMyListings(prev => prev.map(l => l.PropertyID === listingId ? { ...l, IsClosed: 'true' } : l));
                setAppAlert({
                    isOpen: true,
                    type: 'success',
                    title: 'Deal Closed',
                    message: 'Listing successfully marked as closed and removed from map.'
                });
                // Signal map to refresh
                if (onRefreshMap) onRefreshMap();
            } else {
                setAppAlert({
                    isOpen: true,
                    type: 'error',
                    title: 'Action Failed',
                    message: res.error || 'Failed to mark as closed.'
                });
            }
        } catch (err) {
            console.error('Error closing listing', err);
            setAppAlert({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'A server error occurred while closing the listing.'
            });
        }
    };

    const handleReopenListing = async (listingId) => {
        try {
            const res = await reopenListing(listingId);
            if (res.success) {
                setMyListings(prev => prev.map(l => l.PropertyID === listingId ? { ...l, IsClosed: 'false' } : l));
                setAppAlert({
                    isOpen: true,
                    type: 'success',
                    title: 'Listing Reopened',
                    message: 'Your property is now active again and visible on the map.'
                });
                if (onRefreshMap) onRefreshMap();
            } else {
                setAppAlert({
                    isOpen: true,
                    type: 'error',
                    title: 'Failed to Restore',
                    message: res.error || 'Could not reopen the listing.'
                });
            }
        } catch (err) {
            console.error('Error reopening listing', err);
            setAppAlert({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'An unexpected error occurred while reopening the listing.'
            });
        }
    };

    const getPTName = (id) => lookups.pt.find(p => p.TypeID === id)?.TypeName || id || '—';
    const getLTName = (id) => lookups.lt.find(l => l.TypeID === id)?.TypeName || id || '—';

    // Format room string 
    const getRoomsDisplay = (item) => {
        if (!item.PropertySubType) return 'Whole Unit';
        try {
            const parsed = JSON.parse(item.PropertySubType);
            if (!Array.isArray(parsed) || parsed.length === 0) return 'Whole Unit';
            if (parsed[0].SubTypeID === 'RST001') return 'Whole Unit';
            // Count unique keys roughly
            return `${parsed.length} Room(s)`;
        } catch { return 'Whole Unit'; }
    };

    if (isLoading) {
        return <div className="user-page-loading">Loading your listings...</div>;
    }

    if (error) {
        return <div className="user-page-error">Error: {error}</div>;
    }

    // Split into Active and Closed
    const activeListings = myListings.filter(l => String(l.IsClosed).toLowerCase() !== 'true');
    const closedListings = myListings.filter(l => String(l.IsClosed).toLowerCase() === 'true');

    // Detail View Switch
    if (activeDetailId) {
        return (
            <UserPropertyDetail
                propertyID={activeDetailId}
                onBack={() => setActiveDetailId(null)}
                onClosedListing={handleConfirmClose}
                onReopenListing={handleReopenListing}
            />
        );
    }

    return (
        <div className="user-page-container">
            <h2 className="user-page-title">My Properties</h2>

            <div className="user-page-section">
                <h3>Active Listings ({activeListings.length})</h3>
                {activeListings.length === 0 ? (
                    <p className="no-data">No active listings.</p>
                ) : (
                    <div className="user-listing-grid">
                        {activeListings.map(item => (
                            <div key={item.PropertyID} className="user-listing-card" onClick={() => setActiveDetailId(item.PropertyID)} style={{ cursor: 'pointer' }}>
                                <div className="user-listing-header">
                                    <span className="user-listing-badge">{getPTName(item.PropertyType)}</span>
                                    <span className="user-listing-r-badge">{getLTName(item.ListingType)}</span>
                                </div>
                                <div className="user-listing-body">
                                    <p className="user-listing-location">📍 {item.Address || item.City}</p>
                                    <p className="user-listing-rooms">🏠 {getRoomsDisplay(item)}</p>
                                </div>
                                <div className="user-listing-footer">
                                    <button
                                        className="btn-view"
                                        onClick={() => setActiveDetailId(item.PropertyID)}
                                    >
                                        View
                                    </button>
                                    <button
                                        className="btn-mark-closed"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloseListing(item.PropertyID);
                                        }}
                                    >
                                        Mark as Closed
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="user-page-section mt-4">
                <h3>Closed/Deals ({closedListings.length})</h3>
                {closedListings.length === 0 ? (
                    <p className="no-data">No closed listings yet.</p>
                ) : (
                    <div className="user-listing-grid">
                        {closedListings.map(item => (
                            <div key={item.PropertyID} className="user-listing-card closed" onClick={() => setActiveDetailId(item.PropertyID)} style={{ cursor: 'pointer' }}>
                                <div className="user-listing-header">
                                    <span className="user-listing-badge closed">{getPTName(item.PropertyType)}</span>
                                    <span className="user-listing-badge closed">{getLTName(item.ListingType)}</span>
                                </div>
                                <div className="user-listing-body">
                                    <p className="user-listing-location">📍 {item.Address || item.City}</p>
                                    <p className="user-listing-status">✅ Deal Closed</p>
                                </div>
                                <div className="user-listing-footer">
                                    <button
                                        className="btn-view"
                                        onClick={() => setActiveDetailId(item.PropertyID)}
                                    >
                                        View
                                    </button>
                                    <button
                                        className="btn-reopen"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReopenListing(item.PropertyID);
                                        }}
                                    >
                                        Restore
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {confirmCloseId && (
                <ConfirmModal
                    title="Confirm Deal Closure"
                    message="Are you sure you want to mark this listing as closed/deal? It will be removed from the map entirely."
                    confirmText="Close Listing"
                    onConfirm={handleConfirmClose}
                    onCancel={() => setConfirmCloseId(null)}
                />
            )}

            <AlertModal
                isOpen={appAlert.isOpen}
                type={appAlert.type}
                title={appAlert.title}
                message={appAlert.message}
                onClose={() => setAppAlert(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default UserPage;
