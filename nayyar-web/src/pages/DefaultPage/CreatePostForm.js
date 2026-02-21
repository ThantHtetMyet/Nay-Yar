import React, { useState, useEffect } from 'react';
import './CreatePostForm.css';

const API_BASE = 'http://localhost:5000/api';

const CreatePostForm = ({ user, onSuccess, onCancel }) => {
    // Dropdown Data States
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [listingTypes, setListingTypes] = useState([]);
    const [propertySubTypes, setPropertySubTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form Field States
    const [formData, setFormData] = useState({
        ListingType: '',
        PropertyType: '',
        PropertySubType: '',
        Price: '',
        Currency: 'SGD',
        Country: 'Singapore',
        City: '',
        Address: '',
        PostalCode: '',
        Bedrooms: '',
        Bathrooms: '',
        AreaSize: '',
        AvailableFrom: '',
        ContactPhone: '',
        ContactEmail: user?.Email || '',
        Description: '',
        Remark: ''
    });

    // Fetch XML Lookups on mount
    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [ptRes, ltRes, pstRes] = await Promise.all([
                    fetch(`${API_BASE}/property-types`),
                    fetch(`${API_BASE}/listing-types`),
                    fetch(`${API_BASE}/property-subtypes`)
                ]);

                const ptData = await ptRes.json();
                const ltData = await ltRes.json();
                const pstData = await pstRes.json();

                if (ptData.success) setPropertyTypes(ptData.data);
                if (ltData.success) setListingTypes(ltData.data);
                if (pstData.success) setPropertySubTypes(pstData.data);
            } catch (error) {
                console.error("Failed to fetch dropdown data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLookups();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final sanity check before POST
        if (!formData.ListingType || !formData.PropertyType || !formData.Price || !formData.Country || !formData.City) {
            alert('Please fill out all required fields marked with *');
            return;
        }

        const payload = {
            ...formData,
            CreatedBy: user?.UserID || 'Guest'
        };

        try {
            const res = await fetch(`${API_BASE}/listings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                onSuccess(data.data.PropertyID);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("Failed to create property listing. Is the server running?");
        }
    };

    // --- CONDITIONAL RENDERING LOGIC ---
    // User Requirement: PropertySubType only if "rent" (LT001) and "Room" (PT003)
    // Note: The XML TypeNames are literally "Room" and "For Rent". 
    // We will check by TypeID or TypeName. TypeID is safer. (LT001 = For Rent, PT003 = Room)
    const showSubType = formData.ListingType === 'LT001' && formData.PropertyType === 'PT003';

    if (isLoading) {
        return <div className="loading-spinner">Loading database configurations...</div>;
    }

    return (
        <form className="create-post-form" onSubmit={handleSubmit}>

            <div className="form-section">
                <h3>Classification</h3>
                <div className="form-row">
                    <div className="input-group">
                        <label>Listing Type *</label>
                        <select name="ListingType" value={formData.ListingType} onChange={handleChange} required>
                            <option value="">Select Rent/Sale</option>
                            {listingTypes.map(lt => (
                                <option key={lt.TypeID} value={lt.TypeID}>{lt.TypeName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Property Type *</label>
                        <select name="PropertyType" value={formData.PropertyType} onChange={handleChange} required>
                            <option value="">Select Property Type</option>
                            {propertyTypes.map(pt => (
                                <option key={pt.TypeID} value={pt.TypeID}>{pt.TypeName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {showSubType && (
                    <div className="form-row subtype-row">
                        <div className="input-group">
                            <label>Room Sub-Type *</label>
                            <select name="PropertySubType" value={formData.PropertySubType} onChange={handleChange} required>
                                <option value="">Select specific room layout...</option>
                                {propertySubTypes.map(pst => (
                                    <option key={pst.TypeID} value={pst.TypeID}>{pst.TypeName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="form-section">
                <h3>Pricing & Geography</h3>
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
                        <label>Price *</label>
                        <input type="number" name="Price" value={formData.Price} onChange={handleChange} placeholder="e.g. 1500" required />
                    </div>
                </div>

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
                        <label>Address</label>
                        <input type="text" name="Address" value={formData.Address} onChange={handleChange} placeholder="Block 914 Jurong West..." />
                    </div>
                    <div className="input-group">
                        <label>Postal Code</label>
                        <input type="text" name="PostalCode" value={formData.PostalCode} onChange={handleChange} />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3>Physical Details</h3>
                <div className="form-row triple">
                    <div className="input-group">
                        <label>Bedrooms</label>
                        <input type="number" name="Bedrooms" value={formData.Bedrooms} onChange={handleChange} min="0" />
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

            <div className="form-section">
                <h3>Logistics & Contact</h3>
                <div className="form-row">
                    <div className="input-group">
                        <label>Available From</label>
                        <input type="date" name="AvailableFrom" value={formData.AvailableFrom} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Contact Phone</label>
                        <input type="tel" name="ContactPhone" value={formData.ContactPhone} onChange={handleChange} />
                    </div>
                </div>

                <div className="input-group">
                    <label>Description</label>
                    <textarea name="Description" value={formData.Description} onChange={handleChange} rows="3" placeholder="Describe the property..."></textarea>
                </div>

                <div className="input-group">
                    <label>Internal Remark</label>
                    <textarea name="Remark" value={formData.Remark} onChange={handleChange} rows="2" placeholder="Private notes (optional)"></textarea>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn-submit">Publish Listing</button>
            </div>
        </form>
    );
};

export default CreatePostForm;
