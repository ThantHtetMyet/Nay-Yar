import React, { useState, useEffect } from 'react';
import './CreatePostForm.css';
import { getAllLookups, getListingById, updateListing } from '../../services/api';

// Same 6 tabs as CreatePostForm
const TABS = ['Classification', 'Pricing', 'Address', 'Physical Details', 'Logistics & Contact', 'Review'];

const EditPostForm = ({ propertyID, user, onSuccess, onCancel }) => {
    // ── Dropdown data ─────────────────────────────────────────
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [listingTypes, setListingTypes] = useState([]);
    const [propertySubTypes, setPropertySubTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ── Tab state ─────────────────────────────────────────────
    const [currentTab, setCurrentTab] = useState(0);

    // ── Room entries (Classification) ─────────────────────────
    const [roomEntries, setRoomEntries] = useState([{ SubTypeID: '', Quantity: 1 }]);

    const handleRoomChange = (index, field, value) =>
        setRoomEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
    const addRoomEntry = () =>
        setRoomEntries(prev => [...prev, { SubTypeID: '', Quantity: 1 }]);
    const removeRoomEntry = (index) =>
        setRoomEntries(prev => prev.filter((_, i) => i !== index));

    // ── Room units (Pricing) ──────────────────────────────────
    const [roomUnits, setRoomUnits] = useState([]);

    const handleUnitChange = (index, field, value) =>
        setRoomUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u));

    // ── Form data ─────────────────────────────────────────────
    const [formData, setFormData] = useState({
        ListingType: '', PropertyType: '', Currency: 'SGD', Price: '',
        RentTerm: 'Per Month', Country: 'Singapore', City: '', Address: '',
        PostalCode: '', Bedrooms: '', Bathrooms: '', AreaSize: '',
        AvailableFrom: '', ContactPhone: '', ContactEmail: user?.Email || '',
        GenderPreference: 'Any', Description: '', Remark: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ── Load existing listing + lookups ───────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const [listingRes, { ptData, ltData, pstData }] = await Promise.all([
                    getListingById(propertyID),
                    getAllLookups(),
                ]);
                if (ptData.success) setPropertyTypes(ptData.data);
                if (ltData.success) setListingTypes(ltData.data);
                if (pstData.success) setPropertySubTypes(pstData.data);

                if (listingRes.success) {
                    const l = listingRes.data;
                    setFormData({
                        ListingType: l.ListingType || '',
                        PropertyType: l.PropertyType || '',
                        Currency: l.Currency || 'SGD',
                        Price: l.Price || '',
                        RentTerm: l.RentTerm || 'Per Month',
                        Country: l.Country || 'Singapore',
                        City: l.City || '',
                        Address: l.Address || '',
                        PostalCode: l.PostalCode || '',
                        Bedrooms: l.Bedrooms || '',
                        Bathrooms: l.Bathrooms || '',
                        AreaSize: l.AreaSize || '',
                        AvailableFrom: l.AvailableFrom || '',
                        ContactPhone: l.ContactPhone || '',
                        ContactEmail: l.ContactEmail || user?.Email || '',
                        GenderPreference: l.GenderPreference || 'Any',
                        Description: l.Description || '',
                        Remark: l.Remark || '',
                    });

                    // Restore room units from PropertySubType JSON
                    if (l.PropertyType === 'PT003' && l.ListingType === 'LT001' && l.PropertySubType) {
                        try {
                            const parsed = JSON.parse(l.PropertySubType);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                setRoomUnits(parsed);
                            }
                        } catch { /* ignore parse errors */ }
                    }
                }
            } catch (err) {
                console.error('EditPostForm load error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [propertyID, user]);

    // ── Derived flags ─────────────────────────────────────────
    const isRentRoom = formData.ListingType === 'LT001' && formData.PropertyType === 'PT003';
    const isRoom = formData.PropertyType === 'PT003';
    const isRent = formData.ListingType === 'LT001';

    // ── Navigation ────────────────────────────────────────────
    const tabName = TABS[currentTab];
    const isLastTab = currentTab === TABS.length - 1;

    const goNext = () => {
        let next = currentTab + 1;
        if (isRoom && TABS[next] === 'Physical Details') next++;
        setCurrentTab(Math.min(next, TABS.length - 1));
    };
    const goPrev = () => {
        let prev = currentTab - 1;
        if (isRoom && TABS[prev] === 'Physical Details') prev--;
        setCurrentTab(Math.max(prev, 0));
    };

    // ── Validation (same rules as create) ────────────────────
    const isTabValid = () => {
        switch (tabName) {
            case 'Classification':
                if (!formData.ListingType || !formData.PropertyType) return false;
                if (isRentRoom) return roomUnits.length > 0;
                return true;
            case 'Pricing':
                if (!formData.Currency) return false;
                if (isRentRoom) return roomUnits.length > 0 && roomUnits.every(u => u.Price && Number(u.Price) > 0);
                return !!formData.Price && Number(formData.Price) > 0;
            case 'Address': return !!formData.Country && !!formData.City;
            case 'Physical Details': return isRoom ? true : !!formData.Bedrooms;
            case 'Logistics & Contact': return !!formData.ContactPhone;
            case 'Review': return true;
            default: return true;
        }
    };

    // ── Submit (UPDATE) ───────────────────────────────────────
    const handleSubmit = async () => {
        const payload = {
            ...formData,
            CreatedBy: user?.UserID || 'Guest',
            ...(isRentRoom && {
                Price: '0',
                PropertySubType: JSON.stringify(roomUnits)
            })
        };
        try {
            const data = await updateListing(propertyID, payload);
            if (data.success) {
                onSuccess(propertyID);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error('Update error:', err);
            alert('Failed to update listing. Is the server running?');
        }
    };

    // ── Label helpers ─────────────────────────────────────────
    const getLTName = (id) => listingTypes.find(l => l.TypeID === id)?.TypeName || id;
    const getPTName = (id) => propertyTypes.find(p => p.TypeID === id)?.TypeName || id;

    if (isLoading) return <div className="loading-spinner">Loading listing…</div>;

    // ── Visible tabs (skip Physical Details for Rooms) ────────
    const visibleTabs = TABS.filter(t => !isRoom || t !== 'Physical Details');
    const visibleStep = visibleTabs.indexOf(tabName) + 1;
    const totalVisible = visibleTabs.length;

    // ─────────────────────────────────────────────────────────
    // TAB RENDERERS  (reusing same JSX as CreatePostForm)
    // ─────────────────────────────────────────────────────────

    const renderClassification = () => (
        <div className="form-section tab-content">
            <div className="form-row">
                <div className="input-group">
                    <label>Listing Type *</label>
                    <select name="ListingType" value={formData.ListingType} onChange={handleChange} required>
                        <option value="">Select Rent / Sale</option>
                        {listingTypes.map(lt => <option key={lt.TypeID} value={lt.TypeID}>{lt.TypeName}</option>)}
                    </select>
                </div>
                <div className="input-group">
                    <label>Property Type *</label>
                    <select name="PropertyType" value={formData.PropertyType} onChange={handleChange} required>
                        <option value="">Select Property Type</option>
                        {propertyTypes.map(pt => <option key={pt.TypeID} value={pt.TypeID}>{pt.TypeName}</option>)}
                    </select>
                </div>
            </div>

            {isRentRoom && (
                <div className="room-entries-section subtype-row">
                    <label className="room-entries-label">Room Units *</label>
                    <p className="room-price-hint">Units are already expanded from the original listing. You can adjust pricing on the next tab.</p>
                </div>
            )}
        </div>
    );

    const renderPricing = () => (
        <div className="form-section tab-content">
            <div className="form-row">
                <div className="input-group">
                    <label>Currency *</label>
                    <select name="Currency" value={formData.Currency} onChange={handleChange} required>
                        <option value="SGD">SGD (S$)</option>
                        <option value="USD">USD ($)</option>
                        <option value="MYR">MYR (RM)</option>
                    </select>
                </div>
                {isRent && (
                    <div className="input-group">
                        <label>Rent Term *</label>
                        <select name="RentTerm" value={formData.RentTerm} onChange={handleChange} required>
                            <option value="Per Month">Per Month</option>
                            <option value="Per Year">Per Year</option>
                        </select>
                    </div>
                )}
            </div>

            {isRentRoom ? (
                <div className="room-entries-section">
                    <label className="room-entries-label">Price per Room *</label>
                    <p className="room-price-hint">Edit pricing, PUB, and preferences for each room.</p>
                    {roomUnits.map((unit, index) => (
                        <div key={index} className="room-price-entry">
                            <div className="room-card-header">
                                <span className="room-card-title">{unit.Label}</span>
                            </div>

                            <div className="room-card-body">
                                <div className="rental-basis-row">
                                    <span className="rental-basis-label">Rental Basis *</span>
                                    <div className="rental-basis-pills">
                                        <button type="button" className={`basis-pill ${unit.RentalBasis === 'Whole' ? 'active' : ''}`}
                                            onClick={() => handleUnitChange(index, 'RentalBasis', 'Whole')}>🏠 Whole Room</button>
                                        <button type="button" className={`basis-pill ${unit.RentalBasis === 'Shared' ? 'active' : ''}`}
                                            onClick={() => handleUnitChange(index, 'RentalBasis', 'Shared')}>🛏️ Shared · Per Bed</button>
                                    </div>
                                </div>

                                {unit.RentalBasis === 'Shared' && (
                                    <>
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Total beds in this room</label>
                                                <select value={unit.TotalBeds}
                                                    onChange={e => handleUnitChange(index, 'TotalBeds', Number(e.target.value))}>
                                                    {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} beds total</option>)}
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label>Beds available for rent</label>
                                                <select value={unit.BedsForRent}
                                                    onChange={e => handleUnitChange(index, 'BedsForRent', Number(e.target.value))}>
                                                    {Array.from({ length: unit.TotalBeds }, (_, i) => i + 1).map(n => (
                                                        <option key={n} value={n}>{n} bed{n > 1 ? 's' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="bed-summary-chip">
                                            🛏️ <strong>{unit.BedsForRent}</strong> bed{unit.BedsForRent > 1 ? 's' : ''} for rent
                                            &nbsp;·&nbsp; sharing with <strong>{unit.TotalBeds - unit.BedsForRent}</strong> other{unit.TotalBeds - unit.BedsForRent !== 1 ? 's' : ''}
                                            &nbsp;({unit.TotalBeds} total)
                                        </div>
                                    </>
                                )}

                                <div className="input-group">
                                    <label>
                                        {formData.Currency} price
                                        {unit.RentalBasis === 'Shared' ? ' per bed / per person' : ' for whole room'} *
                                    </label>
                                    <input type="number" min="0" value={unit.Price}
                                        onChange={e => handleUnitChange(index, 'Price', e.target.value)}
                                        placeholder="e.g. 800" required />
                                </div>

                                <div className="gender-pref-section">
                                    <label className="rental-basis-label">Tenant Preference</label>
                                    <div className="rental-basis-pills">
                                        {[
                                            { val: 'Any', label: '👥 Any' },
                                            { val: 'Male', label: '👨 Male Only' },
                                            { val: 'Female', label: '👩 Female Only' },
                                            { val: 'Couple', label: '💑 Couple Only' },
                                        ].map(opt => (
                                            <button key={opt.val} type="button"
                                                className={`basis-pill ${unit.GenderPref === opt.val ? 'active' : ''}`}
                                                onClick={() => handleUnitChange(index, 'GenderPref', opt.val)}
                                            >{opt.label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pub-toggle-row">
                                    <label htmlFor={`pub-${index}`}>
                                        <input id={`pub-${index}`} type="checkbox"
                                            checked={unit.PubIncluded}
                                            onChange={e => handleUnitChange(index, 'PubIncluded', e.target.checked)} />
                                        PUB (utilities) included in price
                                    </label>
                                    <span className="pub-hint">{unit.PubIncluded ? '✅ Included' : '❌ Not included'}</span>
                                </div>

                                <div className="pub-toggle-row">
                                    <label htmlFor={`reg-${index}`}>
                                        <input id={`reg-${index}`} type="checkbox"
                                            checked={unit.RegistrationProvided}
                                            onChange={e => handleUnitChange(index, 'RegistrationProvided', e.target.checked)} />
                                        Address registration provided
                                    </label>
                                    <span className="pub-hint">{unit.RegistrationProvided ? '✅ Provided' : '❌ Not provided'}</span>
                                </div>

                                <div className="input-group room-remark-group">
                                    <label>Remark <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Optional)</span></label>
                                    <textarea
                                        rows="2"
                                        value={unit.Remark || ''}
                                        onChange={e => handleUnitChange(index, 'Remark', e.target.value)}
                                        placeholder="e.g. Quiet room, near MRT, no cooking..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="form-row">
                    <div className="input-group">
                        <label>Price *</label>
                        <input type="number" name="Price" value={formData.Price}
                            onChange={handleChange} placeholder="e.g. 1500" required />
                    </div>
                </div>
            )}
        </div>
    );

    const renderAddress = () => (
        <div className="form-section tab-content">
            <div className="form-row">
                <div className="input-group">
                    <label>Country *</label>
                    <input type="text" name="Country" value={formData.Country} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label>City *</label>
                    <input type="text" name="City" value={formData.City} onChange={handleChange} required />
                </div>
            </div>
            <div className="form-row">
                <div className="input-group">
                    <label>Street Address</label>
                    <input type="text" name="Address" value={formData.Address} onChange={handleChange} />
                </div>
                <div className="input-group">
                    <label>Postal Code</label>
                    <input type="text" name="PostalCode" value={formData.PostalCode} onChange={handleChange} />
                </div>
            </div>
        </div>
    );

    const renderPhysicalDetails = () => {
        if (isRoom) return (
            <div className="form-section tab-content not-applicable-card">
                <span className="na-icon">🏠</span>
                <p className="na-title">Not applicable for Room listings</p>
                <p className="na-subtitle">Click <strong>Next</strong> to continue.</p>
            </div>
        );
        return (
            <div className="form-section tab-content">
                <div className="form-row triple">
                    <div className="input-group">
                        <label>Bedrooms *</label>
                        <input type="number" name="Bedrooms" value={formData.Bedrooms} onChange={handleChange} min="0" required />
                    </div>
                    <div className="input-group">
                        <label>Bathrooms</label>
                        <input type="number" name="Bathrooms" value={formData.Bathrooms} onChange={handleChange} min="0" />
                    </div>
                    <div className="input-group">
                        <label>Size (sqft)</label>
                        <input type="number" name="AreaSize" value={formData.AreaSize} onChange={handleChange} min="0" />
                    </div>
                </div>
            </div>
        );
    };

    const renderLogistics = () => (
        <div className="form-section tab-content">
            <div className="form-row">
                <div className="input-group">
                    <label>Available From</label>
                    <input type="date" name="AvailableFrom" value={formData.AvailableFrom} onChange={handleChange} />
                </div>
                <div className="input-group">
                    <label>Contact Phone *</label>
                    <div className="multi-phone-container">
                        {(formData.ContactPhone ? formData.ContactPhone.split(', ') : ['']).map((phone, idx) => (
                            <div key={idx} className="phone-input-row">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        const parts = (formData.ContactPhone ? formData.ContactPhone.split(', ') : ['']);
                                        parts[idx] = e.target.value;
                                        setFormData(prev => ({ ...prev, ContactPhone: parts.join(', ') }));
                                    }}
                                    placeholder="+65 9xxx xxxx"
                                    required={idx === 0}
                                />
                                {idx > 0 && (
                                    <button
                                        type="button"
                                        className="remove-phone-btn"
                                        onClick={() => {
                                            const parts = formData.ContactPhone.split(', ');
                                            const filtered = parts.filter((_, i) => i !== idx);
                                            setFormData(prev => ({ ...prev, ContactPhone: filtered.join(', ') }));
                                        }}
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            className="add-phone-btn"
                            onClick={() => {
                                const current = formData.ContactPhone || '';
                                setFormData(prev => ({ ...prev, ContactPhone: current ? current + ', ' : '' }));
                            }}
                        >
                            + Add Phone Number
                        </button>
                    </div>
                </div>
            </div>
            <div className="input-group">
                <label>Contact Email</label>
                <input type="email" name="ContactEmail" value={formData.ContactEmail} onChange={handleChange} />
            </div>
            <div className="input-group">
                <label>Description</label>
                <textarea name="Description" value={formData.Description} onChange={handleChange} rows="3" placeholder="Describe the property..." />
            </div>
            <div className="input-group">
                <label>Internal Remark</label>
                <textarea name="Remark" value={formData.Remark} onChange={handleChange} rows="2" placeholder="Private notes (optional)" />
            </div>
        </div>
    );

    const renderReview = () => (
        <div className="form-section tab-content review-section">
            <div className="review-group">
                <p className="review-category">Classification</p>
                <div className="review-row"><span>Listing Type</span><strong>{getLTName(formData.ListingType) || '—'}</strong></div>
                <div className="review-row"><span>Property Type</span><strong>{getPTName(formData.PropertyType) || '—'}</strong></div>

                {isRentRoom && (
                    <div className="review-rooms">
                        {roomUnits.map((u, i) => (
                            <div key={i} className="review-room-card">
                                <div className="review-room-header">
                                    <span className="room-price-badge">{u.Label}</span>
                                </div>
                                <div className="review-room-rows">
                                    <div className="review-room-row"><span>Price</span><strong>{formData.Currency} {u.Price} / {formData.RentTerm}</strong></div>
                                    <div className="review-room-row">
                                        <span>Rental Basis</span>
                                        <strong>{u.RentalBasis === 'Shared'
                                            ? `Shared — ${u.BedsForRent} bed${u.BedsForRent > 1 ? 's' : ''} for rent (${u.TotalBeds} total)`
                                            : 'Whole Room (Exclusive)'}</strong>
                                    </div>
                                    <div className="review-room-row"><span>PUB Utilities</span><strong>{u.PubIncluded ? '✅ Included' : '❌ Not included'}</strong></div>
                                    <div className="review-room-row">
                                        <span>Tenant Preference</span>
                                        <strong>{u.GenderPref === 'Any' ? '👥 No Preference' : u.GenderPref === 'Male' ? '👨 Male Only' : u.GenderPref === 'Female' ? '👩 Female Only' : '💑 Couple Only'}</strong>
                                    </div>
                                    <div className="review-room-row"><span>Registration</span><strong>{u.RegistrationProvided ? '✅ Provided' : '❌ Not provided'}</strong></div>
                                    {u.Remark && (
                                        <div className="review-room-row">
                                            <span>Remark</span>
                                            <strong>{u.Remark}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!isRentRoom && (
                <div className="review-group">
                    <p className="review-category">Pricing</p>
                    <div className="review-row"><span>Price</span><strong>{formData.Currency} {formData.Price}{isRent ? ` / ${formData.RentTerm}` : ''}</strong></div>
                </div>
            )}

            <div className="review-group">
                <p className="review-category">Address</p>
                <div className="review-row"><span>Location</span><strong>{formData.City}, {formData.Country}</strong></div>
                {formData.Address && <div className="review-row"><span>Street</span><strong>{formData.Address} {formData.PostalCode}</strong></div>}
            </div>

            {!isRoom && (
                <div className="review-group">
                    <p className="review-category">Physical Details</p>
                    <div className="review-row"><span>Beds / Baths</span><strong>{formData.Bedrooms || '—'} / {formData.Bathrooms || '—'}</strong></div>
                    {formData.AreaSize && <div className="review-row"><span>Size</span><strong>{formData.AreaSize} sqft</strong></div>}
                </div>
            )}

            <div className="review-group">
                <p className="review-category">Logistics & Contact</p>
                {formData.AvailableFrom && <div className="review-row"><span>Available From</span><strong>{formData.AvailableFrom}</strong></div>}
                <div className="review-row">
                    <span>Phone(s)</span>
                    <strong>{formData.ContactPhone || '—'}</strong>
                </div>
                {formData.ContactEmail && <div className="review-row"><span>Email</span><strong>{formData.ContactEmail}</strong></div>}
                {formData.Description && (
                    <div className="review-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span>Description</span>
                        <strong style={{ textAlign: 'left', fontWeight: 500 }}>{formData.Description}</strong>
                    </div>
                )}
                {formData.Remark && (
                    <div className="review-row" style={{ borderTop: '1px dashed #e2e8f0', marginTop: '8px', paddingTop: '8px' }}>
                        <span style={{ color: '#94a3b8' }}>Internal Remark</span>
                        <strong style={{ color: '#94a3b8' }}>{formData.Remark}</strong>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (tabName) {
            case 'Classification': return renderClassification();
            case 'Pricing': return renderPricing();
            case 'Address': return renderAddress();
            case 'Physical Details': return renderPhysicalDetails();
            case 'Logistics & Contact': return renderLogistics();
            case 'Review': return renderReview();
            default: return null;
        }
    };

    const valid = isTabValid();

    return (
        <div className="create-post-form">
            <div className="step-indicator">
                <div className="step-meta">
                    <span className="step-count">Step {visibleStep} of {totalVisible}</span>
                    <span className="step-title">{tabName}</span>
                </div>
                <div className="step-progress-bar">
                    <div className="step-progress-fill"
                        style={{ width: `${(visibleStep / totalVisible) * 100}%` }} />
                </div>
            </div>

            {renderTabContent()}

            <div className="form-actions">
                {currentTab === 0
                    ? <button type="button" className="auth-button ghost" onClick={onCancel}>Cancel</button>
                    : <button type="button" className="auth-button ghost" onClick={goPrev}>← Back</button>
                }
                {isLastTab
                    ? <button type="button" className="auth-button" onClick={handleSubmit}>Save Changes</button>
                    : <button type="button" className="auth-button" onClick={goNext}
                        disabled={!valid} style={!valid ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
                        Next →
                    </button>
                }
            </div>
        </div>
    );
};

export default EditPostForm;
