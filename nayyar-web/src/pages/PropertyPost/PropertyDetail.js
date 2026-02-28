import React, { useState, useEffect } from 'react';
import './PropertyDetail.css';
import { getListingById, getAllLookups, deleteListing } from '../../services/api';
import ErrorModal from '../../components/ErrorModal/ErrorModal';

const PropertyDetail = ({ propertyID, user, onEdit, onBack, onDeleted }) => {
    const [listing, setListing] = useState(null);
    const [lookups, setLookups] = useState({ pt: [], lt: [], pst: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showWaPicker, setShowWaPicker] = useState(false);
    const [selectedPhoneForWa, setSelectedPhoneForWa] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [listingRes, { ptData, ltData, pstData }] = await Promise.all([
                    getListingById(propertyID),
                    getAllLookups(),
                ]);
                if (!listingRes.success) throw new Error(listingRes.error || 'Not found');
                setListing(listingRes.data);
                setLookups({
                    pt: ptData.success ? ptData.data : [],
                    lt: ltData.success ? ltData.data : [],
                    pst: pstData.success ? pstData.data : [],
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

    const handleDelete = async () => {
        setDeleting(true);
        const res = await deleteListing(propertyID);
        if (res.success) {
            setShowDeleteModal(false);
            onDeleted?.();
        } else {
            setErrorMsg('Failed to delete: ' + res.error);
            setDeleting(false);
        }
    };

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
        } catch {
            return false;
        }
    })();

    if (isLoading) return <div className="pd-loading">Loading listing…</div>;
    if (error) return <div className="pd-error">⚠️ {error}</div>;
    if (!listing) return null;

    const Row = ({ label, value }) => (
        value ? (
            <div className="pd-row">
                <span className="pd-label">{label}</span>
                <span className="pd-value">{value}</span>
            </div>
        ) : null
    );

    const genderLabel = (val) => ({
        Any: '👥 No Preference', Male: '👨 Male Only',
        Female: '👩 Female Only', Couple: '💑 Couple Only'
    }[val] || val);

    const openWhatsApp = (room = null, specificPhone = null) => {
        // 1. Extract the raw phone number
        let rawPhone = (specificPhone || listing.ContactPhone?.split(',')[0] || '').trim();
        if (!rawPhone) {
            setErrorMsg('No contact phone number provided.');
            return;
        }

        // 2. Clean digits
        let phone = rawPhone.replace(/\D/g, '');

        // 3. Handle local-to-international conversion (Focusing on Myanmar & Singapore)
        const country = (listing.Country || '').toLowerCase();

        // Remove leading 0 if present (trunk prefix)
        if (phone.startsWith('0')) {
            phone = phone.substring(1);

            // Prepend country code based on detected country
            if (country.includes('myanmar') || country.includes('burma')) {
                phone = '95' + phone;
            } else if (country.includes('singapore')) {
                phone = '65' + phone;
            } else if (country.includes('thailand')) {
                phone = '66' + phone;
            } else if (country.includes('malaysia')) {
                phone = '60' + phone;
            }
        }
        // If no leading 0 but likely missing country code (e.g. 8-digit SG or 9/10-digit MM)
        else if (phone.length >= 8 && phone.length <= 11) {
            if (country.includes('singapore') && phone.length === 8) {
                phone = '65' + phone;
            } else if ((country.includes('myanmar') || country.includes('burma')) && !phone.startsWith('95')) {
                phone = '95' + phone;
            }
        }

        if (phone.length < 7) {
            setErrorMsg('The phone number seems too short or invalid.');
            return;
        }

        const ltName = getLTName(listing.ListingType);
        const ptName = getPTName(listing.PropertyType);
        const locationStr = `${listing.Address || listing.City || ''}, ${listing.Country || ''}`.replace(/^,\s*/, '');

        let message = `Hi, I saw your listing on Nay-Yar:\n\n*${ltName} - ${ptName}*\n📍 ${locationStr}`;

        if (room) {
            message += `\n🏠 *Unit:* ${room.Label}\n💰 *Price:* ${listing.Currency} ${room.Price}/${listing.RentTerm}`;
        } else if (!isRoomRent) {
            message += `\n💰 *Price:* ${listing.Currency} ${listing.Price}${listing.RentTerm ? '/' + listing.RentTerm : ''}`;
        }

        message += `\n\nIs this still available?`;

        // Using api.whatsapp.com for broader device compatibility
        const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

        // Open link
        window.open(url, '_blank');

        // Reset state
        setShowWaPicker(false);
        setSelectedPhoneForWa(null);
        setSelectedRoom(null);
    };

    const handleWaClick = (phone) => {
        if (isRoomRent && roomUnits.length > 1) {
            setSelectedPhoneForWa(phone);
            setSelectedRoom(null);
            setShowWaPicker(true);
        } else {
            openWhatsApp(roomUnits.length === 1 ? roomUnits[0] : null, phone);
        }
    };



    return (
        <div className="property-detail">
            {/* ── Compact Header ── */}
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
                    {listing.CreatedBy === user?.UserID && (
                        <>
                            <button className="pd-icon-btn edit" onClick={() => onEdit(propertyID)} title="Edit Listing">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>
                            <button className="pd-icon-btn delete" onClick={() => setShowDeleteModal(true)} disabled={deleting} title="Delete Listing">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>



            {/* Classification */}
            <div className="pd-section">
                <p className="pd-section-title">Classification</p>
                <Row label="Listing Type" value={getLTName(listing.ListingType)} />
                <Row label="Property Type" value={getPTName(listing.PropertyType)} />
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

            {/* Pricing — non-Room or standard */}
            {!isRoomRent && (
                <div className="pd-section">
                    <p className="pd-section-title">Pricing</p>
                    <Row label="Price" value={`${listing.Currency} ${listing.Price}${listing.RentTerm ? ' / ' + listing.RentTerm : ''}`} />
                    <Row label="Currency" value={listing.Currency} />
                </div>
            )}

            {/* Address */}
            <div className="pd-section">
                <p className="pd-section-title">Address</p>
                <Row label="Country" value={listing.Country} />
                <Row label="City" value={listing.City} />
                <Row label="Street" value={listing.Address} />
                <Row label="Postal Code" value={listing.PostalCode} />
            </div>

            {/* Physical Details */}
            {(!isRoomRent && (listing.Bedrooms || listing.Bathrooms || listing.AreaSize)) && (
                <div className="pd-section">
                    <p className="pd-section-title">Physical Details</p>
                    <Row label="Bedrooms" value={listing.Bedrooms} />
                    <Row label="Bathrooms" value={listing.Bathrooms} />
                    <Row label="Size" value={listing.AreaSize ? `${listing.AreaSize} sqft` : null} />
                </div>
            )}

            {/* Logistics */}
            <div className="pd-section">
                <p className="pd-section-title">Logistics & Contact</p>
                <Row label="Available From" value={listing.AvailableFrom} />
                <div className="pd-row">
                    <span className="pd-label">Contact Phone</span>
                    <span className="pd-value phone-list">
                        {listing.ContactPhone?.split(',').map((p, i) => {
                            const cleanPhone = p.trim();
                            return (
                                <div key={i} className="pd-phone-item">
                                    <span>{cleanPhone}</span>
                                    <button
                                        className="pd-wa-inline-btn"
                                        onClick={() => handleWaClick(cleanPhone)}
                                        title="Chat on WhatsApp"
                                    >
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </span>
                </div>
                <Row label="Contact Email" value={listing.ContactEmail} />
                <Row label="Description" value={listing.Description} />
                <Row label="Remark" value={listing.Remark} />
            </div>

            {/* Meta */}
            <div className="pd-meta">
                <span>Created {new Date(listing.CreatedDate).toLocaleDateString()}</span>
                {listing.UpdatedDate && <span>· Updated {new Date(listing.UpdatedDate).toLocaleDateString()}</span>}
            </div>


            {/* WhatsApp Room Picker Overlay */}
            {showWaPicker && (
                <div className="pd-modal-overlay" onClick={() => { setShowWaPicker(false); setSelectedRoom(null); }}>
                    <div className="pd-glass-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-icon-header wa">
                            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </div>
                        <h3>Inquire about...</h3>
                        <p>Which room are you interested in?</p>
                        <div className="pd-wa-room-options">
                            {roomUnits.map((u, i) => (
                                <button
                                    key={i}
                                    className={`wa-room-option ${selectedRoom?.Label === u.Label ? 'selected' : ''}`}
                                    onClick={() => setSelectedRoom(u)}
                                >
                                    <span className="wa-room-label">{u.Label}</span>
                                    <span className="wa-room-price">{listing.Currency} {u.Price}</span>
                                </button>
                            ))}
                        </div>

                        {selectedRoom && (
                            <button
                                className="pd-btn whatsapp-full send-message-btn"
                                onClick={() => openWhatsApp(selectedRoom, selectedPhoneForWa)}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Send Message
                            </button>
                        )}

                        <button className="pd-wa-cancel" onClick={() => {
                            setShowWaPicker(false);
                            setSelectedPhoneForWa(null);
                            setSelectedRoom(null);
                        }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Glass Modal */}
            {showDeleteModal && (
                <div className="pd-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="pd-glass-modal danger" onClick={e => e.stopPropagation()}>
                        <div className="modal-icon-header danger">
                            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6m4-11v0m0 11v-6" />
                            </svg>
                        </div>
                        <h3>Delete Listing?</h3>
                        <p>This action cannot be undone. Are you sure you want to remove this property completely?</p>

                        <div className="modal-footer-actions">
                            <button className="pd-modal-btn cancel" onClick={() => setShowDeleteModal(false)}>Keep it</button>
                            <button className="pd-modal-btn confirm-delete" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyDetail;
