import React, { useState, useEffect } from 'react';
import { getMyListings, markListingClosed, reopenListing, getAllLookups, getUserProfile, updateUserProfileRaw } from '../../services/api';
import './UserPage.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import AlertModal from '../../components/AlertModal';
import UserPropertyDetail from './UserPropertyDetail';

const UserPage = ({ user, onClose, onRefreshMap, onUserUpdate, onChangePassword }) => {
    const [myListings, setMyListings] = useState([]);
    const [lookups, setLookups] = useState({ pt: [], lt: [] });
    const [isListingsLoading, setIsListingsLoading] = useState(true);
    const [listingError, setListingError] = useState(null);
    const [confirmCloseId, setConfirmCloseId] = useState(null);
    const [activeDetailId, setActiveDetailId] = useState(null);
    const [appAlert, setAppAlert] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const [activeTab, setActiveTab] = useState('account');
    const [profile, setProfile] = useState(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState({ userID: '', fullName: '', email: '', mobileNo: '' });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    useEffect(() => {
        const loadDocs = async () => {
            setIsListingsLoading(true);
            try {
                const res = await getMyListings(user?.UserID || 'Guest');
                if (res.success) {
                    setMyListings(Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []));
                }

                const lookupRes = await getAllLookups();
                setLookups({
                    pt: lookupRes.ptData.success ? lookupRes.ptData.data : [],
                    lt: lookupRes.ltData.success ? lookupRes.ltData.data : [],
                });
            } catch (err) {
                setListingError(err.message);
            } finally {
                setIsListingsLoading(false);
            }
        };

        loadDocs();
    }, [user?.UserID]);

    useEffect(() => {
        if (!user?.UserID) return;
        let isMounted = true;
        setIsProfileLoading(true);
        setProfileError('');
        getUserProfile(user.UserID)
            .then((res) => {
                if (!isMounted) return;
                if (res?.success) {
                    setProfile(res.data);
                } else {
                    setProfileError(res?.error || 'Unable to load account details.');
                }
            })
            .catch(() => {
                if (!isMounted) return;
                setProfileError('Unable to load account details.');
            })
            .finally(() => {
                if (!isMounted) return;
                setIsProfileLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, [user?.UserID]);

    useEffect(() => {
        if (!profile) return;
        setEditForm({
            userID: profile.UserID || '',
            fullName: profile.FullName || '',
            email: profile.Email || '',
            mobileNo: profile.MobileNo || '',
        });
    }, [profile]);

    const handleCloseListing = (listingId) => {
        setConfirmCloseId(listingId);
    };

    const handleConfirmClose = async (passedId) => {
        // Ensure we handle cases where an event object might be passed instead of an ID string
        const listingId = (typeof passedId === 'string') ? passedId : confirmCloseId;
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

    const handleReopenListing = async (passedId) => {
        const listingId = (typeof passedId === 'string') ? passedId : activeDetailId;
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

    const getRoomsDisplay = (item) => {
        if (!item.PropertySubType) return 'Whole Unit';
        try {
            const parsed = JSON.parse(item.PropertySubType);
            if (!Array.isArray(parsed) || parsed.length === 0) return 'Whole Unit';
            if (parsed[0].SubTypeID === 'RST001') return 'Whole Unit';
            return `${parsed.length} Room(s)`;
        } catch { return 'Whole Unit'; }
    };

    const formatDate = (value) => {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString();
    };

    // Split into Active and Closed
    const activeListings = myListings.filter(l => String(l.IsClosed).toLowerCase() !== 'true');
    const closedListings = myListings.filter(l => String(l.IsClosed).toLowerCase() === 'true');

    // Detail View Switch
    if (activeDetailId) {
        return (
            <UserPropertyDetail
                propertyID={activeDetailId}
                onBack={() => setActiveDetailId(null)}
                onClosedListing={(id) => handleConfirmClose(id)}
                onReopenListing={(id) => handleReopenListing(id)}
            />
        );
    }

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();
        if (isSavingProfile) return;
        const nextUserID = String(editForm.userID || '').trim();
        const nextFullName = String(editForm.fullName || '').trim();
        const nextEmail = String(editForm.email || '').trim();
        const nextMobileNo = String(editForm.mobileNo || '').trim();
        if (!nextUserID || !nextFullName) {
            setAppAlert({
                isOpen: true,
                type: 'error',
                title: 'Missing Details',
                message: 'UserID and Full Name are required.',
            });
            return;
        }
        setIsSavingProfile(true);
        try {
            const { res, data } = await updateUserProfileRaw(user?.UserID || '', {
                userID: nextUserID,
                fullName: nextFullName,
                email: nextEmail,
                mobileNo: nextMobileNo,
            });
            if (!res.ok) {
                const title = res.status === 409 ? 'UserID Exists' : 'Update Failed';
                setAppAlert({
                    isOpen: true,
                    type: res.status === 409 ? 'warning' : 'error',
                    title,
                    message: data?.error || data?.message || 'Unable to update your account.',
                });
                return;
            }
            setProfile(data.user);
            if (onUserUpdate) {
                onUserUpdate({
                    UserID: data.user.UserID,
                    FullName: data.user.FullName,
                    Email: data.user.Email,
                    MobileNo: data.user.MobileNo,
                });
            }
            setIsEditingProfile(false);
            setActiveTab('account');
            setAppAlert({
                isOpen: true,
                type: 'success',
                title: 'Account Updated',
                message: 'Your account details have been updated.',
            });
        } catch {
            setAppAlert({
                isOpen: true,
                type: 'error',
                title: 'Update Failed',
                message: 'Unable to update your account right now.',
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <div className="user-page-container">
            {!isEditingProfile && (
                <>
                    <div className="user-page-tabs">
                        <button
                            type="button"
                            className={`user-tab ${activeTab === 'account' ? 'active' : ''}`}
                            onClick={() => setActiveTab('account')}
                        >
                            Account Details
                        </button>
                        <button
                            type="button"
                            className={`user-tab ${activeTab === 'properties' ? 'active' : ''}`}
                            onClick={() => setActiveTab('properties')}
                        >
                            Properties List
                        </button>
                    </div>

                    {activeTab === 'properties' && (
                        <>
                            <h2 className="user-page-title">My Properties</h2>
                            {isListingsLoading && (
                                <div className="user-page-loading">Loading your listings...</div>
                            )}
                            {!isListingsLoading && listingError && (
                                <div className="user-page-error">Error: {listingError}</div>
                            )}
                            {!isListingsLoading && !listingError && (
                                <>
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
                                </>
                            )}
                        </>
                    )}

                    {activeTab === 'account' && (
                        <>
                            <h2 className="user-page-title">Account Details</h2>
                            {isProfileLoading && (
                                <div className="user-page-loading">Loading account details...</div>
                            )}
                            {!isProfileLoading && profileError && (
                                <div className="user-page-error">Error: {profileError}</div>
                            )}
                            {!isProfileLoading && !profileError && (
                                <>
                                    <div className="account-details-card">
                                        <div className="account-detail-row">
                                            <span>UserID</span>
                                            <strong>{profile?.UserID || user?.UserID || '—'}</strong>
                                        </div>
                                        <div className="account-detail-row">
                                            <span>Full Name</span>
                                            <strong>{profile?.FullName || user?.FullName || '—'}</strong>
                                        </div>
                                        <div className="account-detail-row">
                                            <span>Email</span>
                                            <strong>{profile?.Email || user?.Email || '—'}</strong>
                                        </div>
                                        <div className="account-detail-row">
                                            <span>Phone</span>
                                            <strong>{profile?.MobileNo || '—'}</strong>
                                        </div>
                                        <div className="account-detail-row">
                                            <span>Created</span>
                                            <strong>{formatDate(profile?.CreatedDate)}</strong>
                                        </div>
                                        <div className="account-detail-row">
                                            <span>Updated</span>
                                            <strong>{formatDate(profile?.UpdatedDate)}</strong>
                                        </div>
                                    </div>
                                    <div className="account-action-row">
                                        <button
                                            type="button"
                                            className="account-action-btn primary"
                                            onClick={() => {
                                                setIsEditingProfile(true);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="account-action-btn"
                                            onClick={() => {
                                                if (onChangePassword) {
                                                    onChangePassword();
                                                }
                                            }}
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </>
            )}

            {isEditingProfile && (
                <div className="account-edit-view">
                    <h2 className="user-page-title">Edit Account</h2>
                    <form className="account-edit-form" onSubmit={handleSaveProfile}>
                        <div className="account-form-row">
                            <label>UserID</label>
                            <input
                                type="text"
                                name="userID"
                                value={editForm.userID}
                                onChange={handleEditChange}
                                placeholder="UserID"
                                required
                            />
                        </div>
                        <div className="account-form-row">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={editForm.fullName}
                                onChange={handleEditChange}
                                placeholder="Full Name"
                                required
                            />
                        </div>
                        <div className="account-form-row">
                            <label>Phone</label>
                            <input
                                type="tel"
                                name="mobileNo"
                                value={editForm.mobileNo}
                                onChange={handleEditChange}
                                placeholder="Phone number"
                            />
                        </div>
                        <div className="account-form-row">
                            <label>Email (optional)</label>
                            <input
                                type="email"
                                name="email"
                                value={editForm.email}
                                onChange={handleEditChange}
                                placeholder="Email"
                            />
                        </div>
                        <div className="account-form-actions">
                            <button type="submit" className="btn-submit" disabled={isSavingProfile}>
                                {isSavingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" className="btn-cancel" onClick={() => setIsEditingProfile(false)} disabled={isSavingProfile}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {confirmCloseId && (
                <ConfirmModal
                    title="Confirm Deal Closure"
                    message="Are you sure you want to mark this listing as closed/deal? It will be removed from the map entirely."
                    confirmText="Close Listing"
                    onConfirm={() => handleConfirmClose()}
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
