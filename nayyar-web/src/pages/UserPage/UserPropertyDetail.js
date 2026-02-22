import React, { useState, useEffect } from 'react';
import { getListingById, getAllLookups } from '../../services/api';
import '../PropertyPost/PropertyDetail.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const UserPropertyDetail = ({ propertyID, onBack, onClosedListing, onReopenListing }) => {
    const [listing, setListing] = useState(null);
    const [lookups, setLookups] = useState({ pt: [], lt: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [listingRes, { ptData, ltData }] = await Promise.all([
                    getListingById(propertyID),
                    getAllLookups(),
                ]);
                if (!listingRes.success) throw new Error(listingRes.error || 'Not found');
                setListing(listingRes.data);
                setLookups({
                    pt: ptData.success ? ptData.data : [],
                    lt: ltData.success ? ltData.data : [],
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [propertyID]);

    const getLTName = (id) => lookups.lt.find(l => l.TypeID === id)?.TypeName || id || '—';
    const getPTName = (id) => lookups.pt.find(p => p.TypeID === id)?.TypeName || id || '—';

    const handleConfirmClose = () => {
        setShowConfirm(false);
        onClosedListing(propertyID);
        // We stay on page to show status if managed by parent or just go back. 
        // The user asked to show info success or not.
        onBack();
    };

    const handleReopen = () => {
        onReopenListing(propertyID);
        onBack();
    };

    if (isLoading) return <div className="pd-loading">Loading details...</div>;
    if (error) return <div className="pd-error">⚠️ {error}</div>;
    if (!listing) return null;

    const isClosed = String(listing.IsClosed).toLowerCase() === 'true';

    // Parse room units from PropertySubType JSON
    const roomUnits = (() => {
        if (!listing?.PropertySubType) return [];
        try { return JSON.parse(listing.PropertySubType); }
        catch { return []; }
    })();

    const isRoomRent = (() => {
        if (!listing || !listing.PropertySubType) return false;
        try {
            const parsed = JSON.parse(listing.PropertySubType);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].SubTypeID === 'RST001') {
                return false; // Whole unit
            }
            return Array.isArray(parsed) && parsed.length > 0;
        } catch { return false; }
    })();

    const genderLabel = (val) => ({
        Any: '👥 No Preference', Male: '👨 Male Only',
        Female: '👩 Female Only', Couple: '💑 Couple Only'
    }[val] || val);

    const Row = ({ label, value }) => (
        value ? (
            <div className="pd-row">
                <span className="pd-label">{label}</span>
                <span className="pd-value">{value}</span>
            </div>
        ) : null
    );

    return (
        <div className="property-detail user-side-detail">
            <div className="pd-header-compact">
                <button className="pd-icon-btn back" onClick={onBack} title="Go Back">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <div className="pd-center-titles">
                    <span className="pd-type-badge">{getPTName(listing.PropertyType)}</span>
                    <span className="pd-listing-badge">{getLTName(listing.ListingType)}</span>
                </div>
                <div className="pd-right-actions">
                    {isClosed ? (
                        <button className="pd-reopen-btn" onClick={handleReopen}>
                            Reopen Listing
                        </button>
                    ) : (
                        <button className="pd-close-deal-btn" onClick={() => setShowConfirm(true)}>
                            Mark as Closed
                        </button>
                    )}
                </div>
            </div>

            <div className="pd-section">
                <p className="pd-section-title">Property Overview</p>
                <Row label="Status" value={isClosed ? '✅ Closed / Deal Done' : '📢 Active / Live'} />
                <Row label="Address" value={listing.Address} />
                <Row label="City" value={listing.City} />
                <Row label="Country" value={listing.Country} />
                <Row label="Postal Code" value={listing.PostalCode} />
                {!isRoomRent && (
                    <Row label="Price" value={`${listing.Currency} ${listing.Price} ${listing.RentTerm ? '/ ' + listing.RentTerm : ''}`} />
                )}
            </div>

            {/* Rooms — for Room+Rent */}
            {isRoomRent && roomUnits.length > 0 && (
                <div className="pd-section">
                    <p className="pd-section-title">Rooms & Pricing</p>
                    <div className="pd-room-list">
                        {roomUnits.map((u, i) => (
                            <div key={i} className="pd-room-card">
                                <div className="pd-room-header">
                                    <span className="room-price-badge">{u.Label}</span>
                                </div>
                                <div className="pd-room-rows">
                                    <div className="pd-room-row">
                                        <span>Price</span>
                                        <strong>{listing.Currency} {u.Price} / {listing.RentTerm}</strong>
                                    </div>
                                    <div className="pd-room-row">
                                        <span>Rental Basis</span>
                                        <strong>
                                            {u.RentalBasis === 'Shared'
                                                ? `Shared — ${u.BedsForRent} bed${u.BedsForRent > 1 ? 's' : ''} for rent (${u.TotalBeds} total)`
                                                : 'Whole Room (Exclusive)'}
                                        </strong>
                                    </div>
                                    <div className="pd-room-row">
                                        <span>PUB Utilities</span>
                                        <strong>{u.PubIncluded ? '✅ Included' : '❌ Not included'}</strong>
                                    </div>
                                    <div className="pd-room-row">
                                        <span>Tenant Preference</span>
                                        <strong>{genderLabel(u.GenderPref)}</strong>
                                    </div>
                                    <div className="pd-room-row">
                                        <span>Registration</span>
                                        <strong>{u.RegistrationProvided ? '✅ Provided' : '❌ Not provided'}</strong>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isRoomRent && (
                <div className="pd-section">
                    <p className="pd-section-title">Physical Details</p>
                    <Row label="Bedrooms" value={listing.Bedrooms} />
                    <Row label="Bathrooms" value={listing.Bathrooms} />
                    <Row label="Size" value={listing.AreaSize ? `${listing.AreaSize} sqft` : null} />
                </div>
            )}

            <div className="pd-section">
                <p className="pd-section-title">Logistics & Contact</p>
                <Row label="Available From" value={listing.AvailableFrom} />
                <Row label="Contact Phone" value={listing.ContactPhone} />
                <Row label="Contact Email" value={listing.ContactEmail} />
                <Row label="Description" value={listing.Description} />
                <Row label="Internal Remark" value={listing.Remark} />
            </div>

            {/* Meta */}
            <div className="pd-meta" style={{ padding: '0 20px 20px', fontSize: '0.8rem', color: '#64748b' }}>
                <span>Created {new Date(listing.CreatedDate).toLocaleDateString()}</span>
                {listing.UpdatedDate && <span> · Updated {new Date(listing.UpdatedDate).toLocaleDateString()}</span>}
            </div>

            {showConfirm && (
                <ConfirmModal
                    title="Confirm Deal Closure"
                    message="Are you sure you want to mark this listing as closed? It will be removed from the public map immediately."
                    confirmText="Yes, Close Deal"
                    onConfirm={handleConfirmClose}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            <style>{`
                .user-side-detail {
                    padding: 0;
                    background: transparent;
                }
                .pd-close-deal-btn {
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
                }
                .pd-reopen-btn {
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
                }
                .pd-description-text {
                    font-size: 0.9rem;
                    line-height: 1.6;
                    color: #4a5568;
                    margin: 0;
                }
            `}</style>
        </div>
    );
};

export default UserPropertyDetail;
