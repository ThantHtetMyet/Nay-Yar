import React, { useState, useEffect } from 'react';
import './CreatePostForm.css';
import { getAllLookups, createListing } from '../../services/api';
import ErrorModal from '../../components/ErrorModal/ErrorModal';

const TABS = ['Classification', 'Pricing', 'Address', 'Physical Details', 'Logistics & Contact', 'Review'];
const WHOLE_UNIT_ID = 'RST001';

// Property type emoji map
const PT_ICONS = { PT001: '🏘️', PT002: '🏙️' };

const CreatePostForm = ({ user, onSuccess, onCancel }) => {
    // ── Dropdown data ─────────────────────────────────────────
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [propertySubTypes, setPropertySubTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ── Tab + internal Classification sub-step ────────────────
    const [currentTab, setCurrentTab] = useState(0);
    const [classStep, setClassStep] = useState(1); // 1 = property type, 2 = rental mode

    // ── Rental mode ───────────────────────────────────────────
    const [rentalMode, setRentalMode] = useState(''); // '' | 'whole' | 'rooms'

    // ── Room counts: { [SubTypeID]: qty } ─────────────────────
    const [roomCounts, setRoomCounts] = useState({});

    const changeCount = (typeID, delta) => {
        setRoomCounts(prev => ({
            ...prev,
            [typeID]: Math.max(0, (prev[typeID] || 0) + delta),
        }));
    };

    // ── Room units (Pricing tab) ──────────────────────────────
    const newUnit = (subTypeID, label) => ({
        SubTypeID: subTypeID,
        Label: label,
        Price: '',
        PubIncluded: false,
        RentalBasis: 'Whole',
        TotalBeds: 2,
        BedsForRent: 1,
        GenderPref: 'Any',
        RegistrationProvided: false,
        Remark: '',
    });
    const [roomUnits, setRoomUnits] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);
    const handleUnitChange = (index, field, value) =>
        setRoomUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u));

    // ── Form data ─────────────────────────────────────────────
    const [formData, setFormData] = useState({
        ListingType: 'LT001',
        PropertyType: '',
        Currency: 'SGD', Price: '', RentTerm: 'Per Month',
        Country: 'Singapore', City: '', Address: '', PostalCode: '',
        Bedrooms: '', Bathrooms: '', AreaSize: '',
        AvailableFrom: '', ContactPhone: '', ContactEmail: '',
        GenderPreference: 'Any', Description: '', Remark: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ── Fetch lookups ─────────────────────────────────────────
    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const { ptData, pstData } = await getAllLookups();
                if (ptData.success) setPropertyTypes(ptData.data);
                if (pstData.success) setPropertySubTypes(pstData.data);
            } catch (err) {
                console.error('Failed to fetch lookups:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLookups();
    }, []);

    // ── Derived ───────────────────────────────────────────────
    const isWholeUnit = rentalMode === 'whole';
    const isRoomMode = rentalMode === 'rooms';
    const skipPhysical = isRoomMode;
    const roomSubTypes = propertySubTypes.filter(p => p.TypeID !== WHOLE_UNIT_ID);
    const totalRooms = Object.values(roomCounts).reduce((s, v) => s + v, 0);

    // ── Navigation ────────────────────────────────────────────
    const tabName = TABS[currentTab];
    const isLastTab = currentTab === TABS.length - 1;

    // Build room units when leaving Classification → Pricing
    const buildRoomUnits = () => {
        if (isWholeUnit) {
            const wholeName = propertySubTypes.find(p => p.TypeID === WHOLE_UNIT_ID)?.TypeName || 'Whole Unit';
            setRoomUnits([newUnit(WHOLE_UNIT_ID, wholeName)]);
        } else {
            const expanded = [];
            roomSubTypes.forEach(pst => {
                const qty = roomCounts[pst.TypeID] || 0;
                for (let i = 0; i < qty; i++) {
                    expanded.push(newUnit(pst.TypeID, qty > 1 ? `${pst.TypeName} #${i + 1}` : pst.TypeName));
                }
            });
            setRoomUnits(expanded);
        }
    };

    const goNext = () => {
        // Internal sub-step within Classification
        if (currentTab === 0 && classStep === 1) {
            setClassStep(2);
            return;
        }
        if (currentTab === 0 && classStep === 2) {
            buildRoomUnits();
        }

        // Validate Postal Code when leaving the Address tab
        if (tabName === 'Address' && formData.PostalCode) {
            if (formData.Country.toLowerCase() === 'singapore' && !/^\d{6}$/.test(formData.PostalCode)) {
                setErrorMsg('Please enter a valid 6-digit Singapore postal code.');
                return;
            }
        }

        let next = currentTab + 1;
        if (skipPhysical && TABS[next] === 'Physical Details') next++;
        setCurrentTab(Math.min(next, TABS.length - 1));
    };

    const goPrev = () => {
        if (currentTab === 0 && classStep === 2) {
            setClassStep(1);
            return;
        }
        let prev = currentTab - 1;
        if (skipPhysical && TABS[prev] === 'Physical Details') prev--;
        setCurrentTab(Math.max(prev, 0));
    };

    // ── Validation ────────────────────────────────────────────
    const isTabValid = () => {
        if (currentTab === 0) {
            if (classStep === 1) return !!formData.PropertyType;
            if (!rentalMode) return false;
            if (isRoomMode) return totalRooms > 0;
            return true;
        }
        switch (tabName) {
            case 'Pricing':
                return !!formData.Currency && roomUnits.length > 0 && roomUnits.every(u => u.Price && Number(u.Price) > 0);
            case 'Address': return !!formData.Country && !!formData.City;
            case 'Physical Details': return !!formData.Bedrooms;
            case 'Logistics & Contact': return !!formData.ContactPhone && !!formData.AvailableFrom;
            case 'Review': return true;
            default: return true;
        }
    };

    // ── Submit ────────────────────────────────────────────────
    const handleSubmit = async () => {
        const payload = {
            ...formData,
            CreatedBy: user?.UserID || 'Guest',
            PropertySubType: JSON.stringify(roomUnits),
            Price: isWholeUnit ? (roomUnits[0]?.Price || '0') : '0',
        };
        try {
            const data = await createListing(payload);
            if (data.success) {
                onSuccess(data.data.PropertyID);
            } else {
                setErrorMsg(data.error || 'An unknown error occurred.');
            }
        } catch (err) {
            console.error('Submission error:', err);
            setErrorMsg('Failed to create listing. Please check your connection and try again.');
        }
    };

    // ── Label helpers ─────────────────────────────────────────
    const getPTName = (id) => propertyTypes.find(p => p.TypeID === id)?.TypeName || id;
    const getPSTName = (id) => propertySubTypes.find(p => p.TypeID === id)?.TypeName || id;

    if (isLoading) return <div className="loading-spinner">Loading configurations...</div>;

    // ── Error modal (replaces native alert) ──────────────────
    const renderErrorModal = () => errorMsg
        ? <ErrorModal message={errorMsg} onClose={() => setErrorMsg(null)} />
        : null;

    // ─────────────────────────────────────────────────────────
    // TAB RENDERERS
    // ─────────────────────────────────────────────────────────

    const renderClassification = () => {
        // Sub-step 1: Property Type
        if (classStep === 1) {
            return (
                <div className="form-section tab-content">
                    <p className="classif-hint">What type of property are you listing?</p>
                    <div className="property-type-cards">
                        {propertyTypes.map(pt => (
                            <button
                                key={pt.TypeID}
                                type="button"
                                className={`pt-card ${formData.PropertyType === pt.TypeID ? 'selected' : ''}`}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, PropertyType: pt.TypeID }));
                                    setRentalMode('');
                                    setRoomCounts({});
                                    setTimeout(() => setClassStep(2), 180); // auto-advance after brief highlight
                                }}
                            >
                                <span className="pt-card-icon">{PT_ICONS[pt.TypeID] || '🏠'}</span>
                                <span className="pt-card-name">{pt.TypeName}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        // Sub-step 2: Rental Mode
        return (
            <div className="form-section tab-content">
                <div className="classif-back-header">
                    <span className="classif-chosen">
                        {PT_ICONS[formData.PropertyType] || '🏠'} {getPTName(formData.PropertyType)}
                    </span>
                </div>
                <p className="classif-hint">How would you like to rent this property?</p>

                <div className="rental-mode-cards">
                    <button
                        type="button"
                        className={`rental-mode-card ${rentalMode === 'whole' ? 'selected' : ''}`}
                        onClick={() => { setRentalMode('whole'); setRoomCounts({}); }}
                    >
                        <span className="rental-mode-icon">🏠</span>
                        <span className="rental-mode-title">Whole Unit</span>
                        <span className="rental-mode-desc">Rent out the entire unit at one price</span>
                    </button>
                    <button
                        type="button"
                        className={`rental-mode-card ${rentalMode === 'rooms' ? 'selected' : ''}`}
                        onClick={() => setRentalMode('rooms')}
                    >
                        <span className="rental-mode-icon">🛏️</span>
                        <span className="rental-mode-title">By Room</span>
                        <span className="rental-mode-desc">List individual rooms with separate prices</span>
                    </button>
                </div>

                {/* Room +/− steppers */}
                {isRoomMode && (
                    <div className="room-stepper-section">
                        <p className="classif-hint" style={{ marginTop: '20px' }}>Select the number of rooms:</p>
                        {roomSubTypes.map(pst => (
                            <div key={pst.TypeID} className="room-stepper-row">
                                <span className="room-stepper-label">{pst.TypeName}</span>
                                <div className="room-stepper-control">
                                    <button
                                        type="button"
                                        className="stepper-btn"
                                        onClick={() => changeCount(pst.TypeID, -1)}
                                        disabled={(roomCounts[pst.TypeID] || 0) === 0}
                                    >−</button>
                                    <span className="stepper-value">{roomCounts[pst.TypeID] || 0}</span>
                                    <button
                                        type="button"
                                        className="stepper-btn"
                                        onClick={() => changeCount(pst.TypeID, 1)}
                                    >+</button>
                                </div>
                            </div>
                        ))}
                        {totalRooms > 0 && (
                            <div className="stepper-summary">
                                {roomSubTypes
                                    .filter(pst => (roomCounts[pst.TypeID] || 0) > 0)
                                    .map(pst => `${roomCounts[pst.TypeID]} × ${pst.TypeName}`)
                                    .join('  ·  ')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

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
                <div className="input-group">
                    <label>Rent Term *</label>
                    <select name="RentTerm" value={formData.RentTerm} onChange={handleChange} required>
                        <option value="Per Month">Per Month</option>
                        <option value="Per Year">Per Year</option>
                    </select>
                </div>
            </div>

            <div className="room-entries-section">
                <label className="room-entries-label">
                    {isWholeUnit ? 'Unit Pricing *' : 'Price per Room *'}
                </label>
                {!isWholeUnit && <p className="room-price-hint">Set pricing and terms for each room.</p>}

                {roomUnits.map((unit, index) => (
                    <div key={index} className="room-price-entry">
                        <div className="room-card-header">
                            <span className="room-card-title">{unit.Label}</span>
                        </div>
                        <div className="room-card-body">
                            {!isWholeUnit && (
                                <div className="rental-basis-row">
                                    <span className="rental-basis-label">Rental Basis *</span>
                                    <div className="rental-basis-pills">
                                        <button type="button"
                                            className={`basis-pill ${unit.RentalBasis === 'Whole' ? 'active' : ''}`}
                                            onClick={() => handleUnitChange(index, 'RentalBasis', 'Whole')}
                                        >🚪 Whole Room</button>
                                        <button type="button"
                                            className={`basis-pill ${unit.RentalBasis === 'Shared' ? 'active' : ''}`}
                                            onClick={() => handleUnitChange(index, 'RentalBasis', 'Shared')}
                                        >🛏️ Shared · Per Bed</button>
                                    </div>
                                </div>
                            )}

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
                                        &nbsp;·&nbsp; sharing with <strong>{unit.TotalBeds - unit.BedsForRent}</strong> others
                                        &nbsp;({unit.TotalBeds} total)
                                    </div>
                                </>
                            )}

                            <div className="input-group">
                                <label>
                                    {formData.Currency} price
                                    {isWholeUnit ? ' for whole unit' : (unit.RentalBasis === 'Shared' ? ' per bed' : ' for whole room')} *
                                </label>
                                <input type="number" min="0" value={unit.Price}
                                    onChange={e => handleUnitChange(index, 'Price', e.target.value)}
                                    placeholder="e.g. 1500" required />
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
                                <textarea rows="2" value={unit.Remark || ''}
                                    onChange={e => handleUnitChange(index, 'Remark', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
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
                    <input type="text" name="Address" value={formData.Address} onChange={handleChange} placeholder="Block 914 Jurong West..." />
                </div>
                <div className="input-group">
                    <label>Postal Code</label>
                    <input type="text" name="PostalCode" value={formData.PostalCode} onChange={handleChange} />
                </div>
            </div>
        </div>
    );

    const renderPhysicalDetails = () => {
        if (skipPhysical) return (
            <div className="form-section tab-content not-applicable-card">
                <span className="na-icon">🛏️</span>
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
                    <label>Available From *</label>
                    <input
                        type="date"
                        name="AvailableFrom"
                        value={formData.AvailableFrom}
                        onChange={handleChange}
                        min={new Date().toLocaleDateString('en-CA')} // Works locally for 'YYYY-MM-DD'
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Contact Phone *</label>
                    <div className="multi-phone-container">
                        {(formData.ContactPhone ? formData.ContactPhone.split(', ') : ['']).map((phone, idx) => (
                            <div key={idx} className="phone-input-row">
                                <input type="tel" value={phone}
                                    onChange={(e) => {
                                        const parts = (formData.ContactPhone ? formData.ContactPhone.split(', ') : ['']);
                                        parts[idx] = e.target.value;
                                        setFormData(prev => ({ ...prev, ContactPhone: parts.join(', ') }));
                                    }}
                                    placeholder="+65 9xxx xxxx" required={idx === 0} />
                                {idx > 0 && (
                                    <button type="button" className="remove-phone-btn"
                                        onClick={() => {
                                            const parts = formData.ContactPhone.split(', ');
                                            setFormData(prev => ({ ...prev, ContactPhone: parts.filter((_, i) => i !== idx).join(', ') }));
                                        }}>&times;</button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="add-phone-btn"
                            onClick={() => {
                                const current = formData.ContactPhone || '';
                                setFormData(prev => ({ ...prev, ContactPhone: current ? current + ', ' : '' }));
                            }}>+ Add Phone Number</button>
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
                <div className="review-row"><span>Listing Type</span><strong>Rent</strong></div>
                <div className="review-row"><span>Property Type</span><strong>{getPTName(formData.PropertyType) || '—'}</strong></div>
                <div className="review-row"><span>Rental Mode</span><strong>{isWholeUnit ? '🏠 Whole Unit' : '🛏️ By Room'}</strong></div>
                {isRoomMode && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {roomSubTypes.filter(pst => (roomCounts[pst.TypeID] || 0) > 0).map(pst => (
                            <div key={pst.TypeID} className="bed-summary-chip">
                                <strong>{roomCounts[pst.TypeID]}</strong> × {pst.TypeName}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="review-group">
                <p className="review-category">Pricing</p>
                <div className="review-rooms">
                    {roomUnits.map((u, i) => (
                        <div key={i} className="review-room-card">
                            <div className="review-room-header">
                                <span className="room-price-badge">{u.Label}</span>
                            </div>
                            <div className="review-room-rows">
                                <div className="review-room-row"><span>Price</span>
                                    <strong>{formData.Currency} {u.Price} / {formData.RentTerm}</strong>
                                </div>
                                {!isWholeUnit && (
                                    <div className="review-room-row"><span>Rental Basis</span>
                                        <strong>{u.RentalBasis === 'Shared'
                                            ? `Shared — ${u.BedsForRent} bed${u.BedsForRent > 1 ? 's' : ''} for rent`
                                            : 'Whole Room (Exclusive)'}</strong>
                                    </div>
                                )}
                                <div className="review-room-row"><span>PUB Utilities</span>
                                    <strong>{u.PubIncluded ? '✅ Included' : '❌ Not included'}</strong>
                                </div>
                                <div className="review-room-row"><span>Tenant Preference</span>
                                    <strong>{u.GenderPref === 'Any' ? '👥 No Preference'
                                        : u.GenderPref === 'Male' ? '👨 Male Only'
                                            : u.GenderPref === 'Female' ? '👩 Female Only'
                                                : '💑 Couple Only'}</strong>
                                </div>
                                <div className="review-room-row"><span>Registration</span>
                                    <strong>{u.RegistrationProvided ? '✅ Provided' : '❌ Not provided'}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="review-group">
                <p className="review-category">Address</p>
                <div className="review-row"><span>Location</span><strong>{formData.City}, {formData.Country}</strong></div>
                {formData.Address && <div className="review-row"><span>Street</span><strong>{formData.Address} {formData.PostalCode}</strong></div>}
            </div>

            {!skipPhysical && (
                <div className="review-group">
                    <p className="review-category">Physical Details</p>
                    <div className="review-row"><span>Beds / Baths</span><strong>{formData.Bedrooms || '—'} / {formData.Bathrooms || '—'}</strong></div>
                    {formData.AreaSize && <div className="review-row"><span>Size</span><strong>{formData.AreaSize} sqft</strong></div>}
                </div>
            )}

            <div className="review-group">
                <p className="review-category">Logistics & Contact</p>
                {formData.AvailableFrom && <div className="review-row"><span>Available From</span><strong>{formData.AvailableFrom}</strong></div>}
                <div className="review-row"><span>Phone</span><strong>{formData.ContactPhone || '—'}</strong></div>
                {formData.ContactEmail && <div className="review-row"><span>Email</span><strong>{formData.ContactEmail}</strong></div>}
                {formData.Description && (
                    <div className="review-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span>Description</span>
                        <strong style={{ textAlign: 'left', fontWeight: 500 }}>{formData.Description}</strong>
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

    const visibleTabs = TABS.filter(t => !skipPhysical || t !== 'Physical Details');
    // Step count: classStep 1 = step 1, classStep 2 = step 2, then Pricing etc continue
    const classOffset = currentTab === 0 ? classStep - 1 : 1;
    const visibleStep = currentTab === 0 ? classStep : visibleTabs.indexOf(tabName) + 2;
    const totalVisible = visibleTabs.length + 1; // +1 for the 2 class sub-steps

    return (
        <div className="create-post-form">
            {renderErrorModal()}
            <div className="step-indicator">
                <div className="step-meta">
                    <span className="step-title">
                        {tabName === 'Classification'
                            ? (classStep === 1 ? 'Property Type' : 'Rental Mode')
                            : tabName}
                    </span>
                    <span className="step-count">Step {visibleStep} of {totalVisible}</span>
                </div>
                <div className="step-progress-bar">
                    <div className="step-progress-fill" style={{ width: `${(visibleStep / totalVisible) * 100}%` }} />
                </div>
            </div>

            {renderTabContent()}

            <div className="form-actions">
                {currentTab === 0 && classStep === 1
                    ? <button type="button" className="auth-button ghost" onClick={onCancel}>Cancel</button>
                    : <button type="button" className="auth-button ghost" onClick={goPrev}>← Back</button>
                }
                {currentTab === 0 && classStep === 1
                    ? null
                    : isLastTab
                        ? <button type="button" className="auth-button" onClick={handleSubmit}>Create</button>
                        : <button type="button" className="auth-button" onClick={goNext}
                            disabled={!valid}
                            style={!valid ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
                            Next →
                        </button>
                }
            </div>
        </div>
    );
};

export default CreatePostForm;
