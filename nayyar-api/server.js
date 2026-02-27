const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5010;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── File Paths ───────────────────────────────────────────────────────────────
const USER_DB_PATH = path.join(__dirname, 'Database', 'user_data.xml');
const LISTING_DB_PATH = path.join(__dirname, 'Database', 'property_data.xml');
const FEEDBACK_DB_PATH = path.join(__dirname, 'Database', 'feedback_data.xml');
const URL_HIT_DB_PATH = path.join(__dirname, 'Database', 'url_hit_count.xml');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const readUsersXML = async () => {
    try {
        if (!fs.existsSync(USER_DB_PATH)) return { Users: { User: [] } };
        const xmlData = fs.readFileSync(USER_DB_PATH, 'utf-8');
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        if (!result || !result.Users) return { Users: { User: [] } };
        if (result.Users.User && !Array.isArray(result.Users.User))
            result.Users.User = [result.Users.User];
        if (!result.Users.User) result.Users.User = [];
        return result;
    } catch (error) {
        console.error('Error reading user XML:', error);
        return { Users: { User: [] } };
    }
};

const writeUsersXML = (dataObj) => {
    const builder = new xml2js.Builder();
    fs.writeFileSync(USER_DB_PATH, builder.buildObject(dataObj));
};

// Read property_data.xml and always return an array of listings
const readListingsXML = async () => {
    try {
        if (!fs.existsSync(LISTING_DB_PATH))
            return { PropertyListings: { PropertyListing: [] } };
        const xmlData = fs.readFileSync(LISTING_DB_PATH, 'utf-8');
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        if (!result || !result.PropertyListings)
            return { PropertyListings: { PropertyListing: [] } };
        if (result.PropertyListings.PropertyListing &&
            !Array.isArray(result.PropertyListings.PropertyListing))
            result.PropertyListings.PropertyListing = [result.PropertyListings.PropertyListing];
        if (!result.PropertyListings.PropertyListing)
            result.PropertyListings.PropertyListing = [];
        return result;
    } catch (error) {
        console.error('Error reading listings XML:', error);
        return { PropertyListings: { PropertyListing: [] } };
    }
};

const writeListingsXML = (dataObj) => {
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(dataObj);
    fs.writeFileSync(LISTING_DB_PATH, xml);
};

const readFeedbackXML = async () => {
    try {
        if (!fs.existsSync(FEEDBACK_DB_PATH)) return { Feedbacks: { Feedback: [] } };
        const xmlData = fs.readFileSync(FEEDBACK_DB_PATH, 'utf-8');
        if (!xmlData.trim()) return { Feedbacks: { Feedback: [] } };
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        if (!result || !result.Feedbacks) return { Feedbacks: { Feedback: [] } };
        if (result.Feedbacks.Feedback && !Array.isArray(result.Feedbacks.Feedback))
            result.Feedbacks.Feedback = [result.Feedbacks.Feedback];
        if (!result.Feedbacks.Feedback) result.Feedbacks.Feedback = [];
        return result;
    } catch (error) {
        console.error('Error reading feedback XML:', error);
        return { Feedbacks: { Feedback: [] } };
    }
};

const writeFeedbackXML = (dataObj) => {
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(dataObj);
    fs.writeFileSync(FEEDBACK_DB_PATH, xml);
};

const readUrlHitsXML = async () => {
    try {
        if (!fs.existsSync(URL_HIT_DB_PATH)) return { UrlHitCounts: { UrlHit: [] } };
        const xmlData = fs.readFileSync(URL_HIT_DB_PATH, 'utf-8');
        if (!xmlData.trim()) return { UrlHitCounts: { UrlHit: [] } };
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        if (!result || !result.UrlHitCounts) return { UrlHitCounts: { UrlHit: [] } };
        if (result.UrlHitCounts.UrlHit && !Array.isArray(result.UrlHitCounts.UrlHit))
            result.UrlHitCounts.UrlHit = [result.UrlHitCounts.UrlHit];
        if (!result.UrlHitCounts.UrlHit) result.UrlHitCounts.UrlHit = [];
        return result;
    } catch (error) {
        console.error('Error reading url hit XML:', error);
        return { UrlHitCounts: { UrlHit: [] } };
    }
};

const writeUrlHitsXML = (dataObj) => {
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(dataObj);
    fs.writeFileSync(URL_HIT_DB_PATH, xml);
};

// Generic dropdown reader
const readGenericXML = async (xmlPath, rootNode, childNode) => {
    try {
        if (!fs.existsSync(xmlPath)) return [];
        const xmlData = fs.readFileSync(xmlPath, 'utf-8');
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        if (!result || !result[rootNode] || !result[rootNode][childNode]) return [];
        let items = result[rootNode][childNode];
        if (!Array.isArray(items)) items = [items];
        return items.filter(item => item.IsActive !== 'false');
    } catch (error) {
        console.error(`Error reading ${xmlPath}:`, error);
        return [];
    }
};

// Map payload to a canonical listing object
const buildListingObject = (payload, propertyID, now, isRoomRent) => ({
    PropertyID: propertyID,
    PropertyType: payload.PropertyType,
    ListingType: payload.ListingType,
    // PropertySubType stores serialised JSON for Room+Rent, empty otherwise
    PropertySubType: payload.PropertySubType || '',
    Price: payload.Price || '0',
    RentTerm: payload.ListingType === 'LT001' ? (payload.RentTerm || 'Per Month') : '',
    Currency: payload.Currency || 'SGD',
    Country: payload.Country,
    City: payload.City,
    Address: payload.Address || '',
    PostalCode: payload.PostalCode || '',
    // Physical — leave empty for Room listings
    Bedrooms: isRoomRent ? '' : (payload.Bedrooms || ''),
    Bathrooms: isRoomRent ? '' : (payload.Bathrooms || ''),
    AreaSize: isRoomRent ? '' : (payload.AreaSize || ''),
    AvailableFrom: payload.AvailableFrom || '',
    ContactPhone: payload.ContactPhone || '',
    ContactEmail: payload.ContactEmail || '',
    GenderPreference: payload.GenderPreference || 'Any',
    Description: payload.Description || '',
    Remark: payload.Remark || '',
    CreatedBy: payload.CreatedBy,
    CreatedDate: now,
    UpdatedDate: '',
    IsActive: 'true',
    IsDeleted: 'false',
    IsClosed: payload.IsClosed || 'false',
});

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────

// 1. SIGNUP
app.post('/api/signup', async (req, res) => {
    try {
        const { userID, fullName, email, mobileNo, loginPassword } = req.body;
        if (!userID || !loginPassword)
            return res.status(400).json({ error: 'Missing required fields' });

        const db = await readUsersXML();
        const users = db.Users.User;

        const isDuplicateUserID = users.some(u => u.UserID.toLowerCase() === userID.toLowerCase());
        const normalizedEmail = String(email || '').trim();
        const isDuplicateEmail = normalizedEmail
            ? users.some(u => u.Email.toLowerCase() === normalizedEmail.toLowerCase())
            : false;
        if (isDuplicateUserID || isDuplicateEmail)
            return res.status(409).json({
                error: 'Conflict',
                message: isDuplicateUserID
                    ? `UserID "${userID}" is already taken.`
                    : `Email "${normalizedEmail}" is already registered.`
            });

        const now = new Date().toISOString();
        const newUser = {
            ID: crypto.randomUUID(),
            UserID: userID, FullName: fullName, Email: normalizedEmail,
            MobileNo: mobileNo, LoginPassword: loginPassword,
            Remark: ' ',
            LastLogin: now, IsActive: 'true', IsDeleted: 'false',
            CreatedDate: now, UpdatedDate: now
        };
        db.Users.User.push(newUser);
        writeUsersXML(db);
        return res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { userID, password } = req.body;
        if (!userID || !password)
            return res.status(400).json({ error: 'Missing credentials' });

        const db = await readUsersXML();
        const users = db.Users.User;
        const user = users.find(u => u.UserID.toLowerCase() === userID.toLowerCase());
        if (!user) return res.status(404).json({ error: 'Invalid credentials. User not found.' });

        const isMatch = (user.LoginPassword === password || user.LoginPassword === 'hashed_password_placeholder');
        if (!isMatch) return res.status(401).json({ error: 'Invalid password.' });

        return res.status(200).json({
            success: true,
            user: { UserID: user.UserID, Email: user.Email, FullName: user.FullName }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const { userID, phone, newPassword } = req.body;
        if (!userID || !phone || !newPassword) {
            return res.status(400).json({ error: 'UserID, phone and new password are required.' });
        }
        if (String(newPassword).length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }

        const normalizePhone = (value) => String(value || '').replace(/\D/g, '');
        const db = await readUsersXML();
        const users = db.Users.User;
        const idx = users.findIndex(u =>
            u.UserID.toLowerCase() === String(userID).toLowerCase() &&
            normalizePhone(u.MobileNo) === normalizePhone(phone)
        );
        if (idx === -1) {
            return res.status(404).json({ error: 'UserID and MobileNo are mismatched. please enter correct UserID and MobileNo.' });
        }

        users[idx].LoginPassword = newPassword;
        users[idx].UpdatedDate = new Date().toISOString();
        writeUsersXML(db);

        return res.status(200).json({ success: true, message: 'Password reset successfully.' });
    } catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        const {
            rating,
            message,
            name,
            phone,
            userID,
            fullName,
            email,
        } = req.body;

        if (!rating || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }

        const db = await readFeedbackXML();
        const now = new Date().toISOString();
        const newFeedback = {
            FeedbackID: crypto.randomUUID(),
            Rating: String(rating),
            Message: message || '',
            Name: name || fullName || '',
            Phone: phone || '',
            UserID: userID || '',
            FullName: fullName || '',
            Email: email || '',
            CreatedDate: now,
            IsResolved: 'false',
        };

        db.Feedbacks.Feedback.push(newFeedback);
        writeFeedbackXML(db);
        return res.status(201).json({ success: true, data: newFeedback });
    } catch (error) {
        console.error('Error creating feedback:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/feedback', async (req, res) => {
    try {
        const userID = String(req.query.userID || '').trim();
        if (userID !== 'Thant') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const db = await readFeedbackXML();
        const feedbacks = db.Feedbacks.Feedback || [];
        const sorted = [...feedbacks].sort((a, b) => {
            const aTime = new Date(a.CreatedDate || 0).getTime();
            const bTime = new Date(b.CreatedDate || 0).getTime();
            return bTime - aTime;
        });
        return res.status(200).json({ success: true, data: sorted });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/feedback/:id', async (req, res) => {
    try {
        const userID = String(req.query.userID || '').trim();
        if (userID !== 'Thant') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const targetId = String(req.params.id).trim();
        const db = await readFeedbackXML();
        const feedbacks = db.Feedbacks.Feedback || [];
        const found = feedbacks.find(f => String(f.FeedbackID || '').trim() === targetId);
        if (!found) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        return res.status(200).json({ success: true, data: found });
    } catch (error) {
        console.error('Error fetching feedback detail:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/link-hits', async (req, res) => {
    try {
        const key = String(req.body?.key || '').trim();
        const url = String(req.body?.url || '').trim();
        const allowed = ['default-page', 'signup-success', 'create-post'];
        if (!allowed.includes(key)) {
            return res.status(400).json({ error: 'Invalid key' });
        }
        const db = await readUrlHitsXML();
        const hits = db.UrlHitCounts.UrlHit || [];
        const now = new Date().toISOString();
        const entry = url
            ? hits.find(item => String(item.Url || '').trim() === url)
            : hits.find(item => String(item.Key || '').trim() === key && !item.Url);
        if (entry) {
            const nextCount = Number(entry.Count || 0) + 1;
            entry.Count = String(nextCount);
            entry.UpdatedDate = now;
        } else {
            hits.push({ Key: key, Url: url, Count: '1', UpdatedDate: now });
        }
        db.UrlHitCounts.UrlHit = hits;
        writeUrlHitsXML(db);
        const updated = url
            ? hits.find(item => String(item.Url || '').trim() === url)
            : hits.find(item => String(item.Key || '').trim() === key && !item.Url);
        return res.status(200).json({ success: true, data: { key, count: Number(updated?.Count || 0) } });
    } catch (error) {
        console.error('Error updating link hits:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/link-hits', async (req, res) => {
    try {
        const userID = String(req.query.userID || '').trim();
        if (userID !== 'Thant') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const db = await readUrlHitsXML();
        const hits = db.UrlHitCounts.UrlHit || [];
        const getCount = (key) => {
            return hits
                .filter(item => String(item.Key || '').trim() === key)
                .reduce((sum, item) => sum + Number(item.Count || 0), 0);
        };
        const data = [
            { key: 'default-page', count: getCount('default-page') },
            { key: 'signup-success', count: getCount('signup-success') },
            { key: 'create-post', count: getCount('create-post') },
        ];
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching link hits:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/users/change-password', async (req, res) => {
    try {
        const { userID, newPassword } = req.body;
        if (!userID || !newPassword) {
            return res.status(400).json({ error: 'UserID and new password are required.' });
        }
        if (String(newPassword).length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }

        const db = await readUsersXML();
        const users = db.Users.User;
        const idx = users.findIndex(u => u.UserID.toLowerCase() === String(userID).toLowerCase());
        if (idx === -1) {
            return res.status(404).json({ error: 'User not found.' });
        }

        users[idx].LoginPassword = newPassword;
        users[idx].UpdatedDate = new Date().toISOString();
        writeUsersXML(db);
        return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/users/:userID', async (req, res) => {
    try {
        const targetId = String(req.params.userID || '').trim();
        if (!targetId) return res.status(400).json({ error: 'UserID is required.' });
        const db = await readUsersXML();
        const users = db.Users.User || [];
        const user = users.find(u => String(u.UserID || '').toLowerCase() === targetId.toLowerCase());
        if (!user) return res.status(404).json({ error: 'User not found.' });
        return res.status(200).json({
            success: true,
            data: {
                UserID: user.UserID || '',
                FullName: user.FullName || '',
                Email: user.Email || '',
                MobileNo: user.MobileNo || '',
                CreatedDate: user.CreatedDate || '',
                UpdatedDate: user.UpdatedDate || ''
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/users/:userID', async (req, res) => {
    try {
        const currentId = String(req.params.userID || '').trim();
        const { userID, fullName, email, mobileNo } = req.body;
        if (!currentId) return res.status(400).json({ error: 'UserID is required.' });
        if (!userID || !fullName) {
            return res.status(400).json({ error: 'UserID and full name are required.' });
        }

        const db = await readUsersXML();
        const users = db.Users.User;
        const idx = users.findIndex(u => String(u.UserID || '').toLowerCase() === currentId.toLowerCase());
        if (idx === -1) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const nextUserID = String(userID).trim();
        const duplicateUser = users.find((u, i) =>
            i !== idx && String(u.UserID || '').toLowerCase() === nextUserID.toLowerCase()
        );
        if (duplicateUser) {
            return res.status(409).json({ error: `UserID "${nextUserID}" is already taken.` });
        }

        const normalizedEmail = String(email || '').trim();
        users[idx].UserID = nextUserID;
        users[idx].FullName = String(fullName || '').trim();
        users[idx].Email = normalizedEmail;
        if (mobileNo !== undefined) {
            users[idx].MobileNo = String(mobileNo || '').trim();
        }
        users[idx].UpdatedDate = new Date().toISOString();
        writeUsersXML(db);

        if (currentId.toLowerCase() !== nextUserID.toLowerCase()) {
            const listingsDb = await readListingsXML();
            const listings = listingsDb.PropertyListings.PropertyListing || [];
            let updated = false;
            listings.forEach(l => {
                if (String(l.CreatedBy || '') === currentId) {
                    l.CreatedBy = nextUserID;
                    updated = true;
                }
            });
            if (updated) writeListingsXML(listingsDb);
        }

        return res.status(200).json({
            success: true,
            user: {
                UserID: users[idx].UserID || '',
                FullName: users[idx].FullName || '',
                Email: users[idx].Email || '',
                MobileNo: users[idx].MobileNo || '',
                CreatedDate: users[idx].CreatedDate || '',
                UpdatedDate: users[idx].UpdatedDate || ''
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const userID = String(req.query.userID || '').trim();
        if (userID !== 'Thant') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const db = await readUsersXML();
        const users = db.Users.User || [];
        const data = users.map((u) => ({
            UserID: u.UserID || '',
            MobileNo: u.MobileNo || '',
            CreatedDate: u.CreatedDate || '',
        }));
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. GET PROPERTY TYPES
app.get('/api/property-types', async (_req, res) => {
    try {
        const items = await readGenericXML(
            path.join(__dirname, 'Database', 'property_type.xml'), 'PropertyTypes', 'PropertyType');
        return res.status(200).json({ success: true, data: items });
    } catch { return res.status(500).json({ error: 'Internal Server Error' }); }
});

// 4. GET PROPERTY SUBTYPES
app.get('/api/property-subtypes', async (_req, res) => {
    try {
        const items = await readGenericXML(
            path.join(__dirname, 'Database', 'property_subtype.xml'), 'PropertyTypes', 'PropertyType');
        return res.status(200).json({ success: true, data: items });
    } catch { return res.status(500).json({ error: 'Internal Server Error' }); }
});

// 5. GET LISTING TYPES
app.get('/api/listing-types', async (_req, res) => {
    try {
        const items = await readGenericXML(
            path.join(__dirname, 'Database', 'listing_type.xml'), 'ListingTypes', 'ListingType');
        return res.status(200).json({ success: true, data: items });
    } catch { return res.status(500).json({ error: 'Internal Server Error' }); }
});

// 6. GET ALL LISTINGS (optionally filter by createdBy)
app.get('/api/listings', async (req, res) => {
    try {
        const db = await readListingsXML();
        const raw = db.PropertyListings.PropertyListing;

        // Robust filter: handles string 'true', boolean true, etc.
        let listings = raw.filter(l => String(l.IsDeleted).toLowerCase() !== 'true');

        const { createdBy } = req.query;
        if (createdBy) {
            listings = listings.filter(l => l.CreatedBy === createdBy);
        } else {
            // For general map/feed (no createdBy), hide closed listings
            listings = listings.filter(l => String(l.IsClosed).toLowerCase() !== 'true');
        }

        console.log(`[API] Listings fetched: ${listings.length} (total raw: ${raw.length})`);
        return res.status(200).json({ success: true, data: listings });
    } catch (error) {
        console.error('[API Error] Fetching listings failed:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 7. GET SINGLE LISTING by ID
app.get('/api/listings/:id', async (req, res) => {
    try {
        const db = await readListingsXML();
        const listings = db.PropertyListings.PropertyListing;
        const targetId = String(req.params.id).trim();

        const getCleanId = (idObj) => {
            if (!idObj) return '';
            const val = typeof idObj === 'object' ? (idObj._ || idObj['$']?.id || '') : idObj;
            return String(val).trim();
        };

        const listing = listings.find(l =>
            getCleanId(l.PropertyID) === targetId &&
            String(l.IsDeleted).toLowerCase() !== 'true'
        );

        if (!listing) {
            console.warn(`[API] Fetch failed - Listing ID ${targetId} matches none in [${listings.map(l => getCleanId(l.PropertyID)).join(', ')}]`);
            return res.status(404).json({ error: 'Listing not found.' });
        }
        return res.status(200).json({ success: true, data: listing });
    } catch (error) {
        console.error('Error fetching listing:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 8. CREATE LISTING (POST)
app.post('/api/listings', async (req, res) => {
    try {
        const payload = req.body;

        // Determine if it's a Room listing by checking PropertySubType
        let isRoomRent = true;
        try {
            const parsed = JSON.parse(payload.PropertySubType);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].SubTypeID === 'RST001') {
                isRoomRent = false;
            }
        } catch (e) { }
        if (!payload.PropertyType || !payload.ListingType || !payload.CreatedBy ||
            !payload.Country || !payload.City) {
            return res.status(400).json({
                error: 'Missing required fields (PropertyType, ListingType, CreatedBy, Country, City).'
            });
        }
        if (!isRoomRent && (!payload.Price || Number(payload.Price) <= 0)) {
            return res.status(400).json({ error: 'Price is required for non-Room listings.' });
        }

        const db = await readListingsXML();
        const now = new Date().toISOString();
        const newListing = buildListingObject(payload, crypto.randomUUID(), now, isRoomRent);
        db.PropertyListings.PropertyListing.push(newListing);
        writeListingsXML(db);

        console.log(`[API] Listing created: ${newListing.PropertyID}`);
        return res.status(201).json({ success: true, message: 'Listing created.', data: newListing });
    } catch (error) {
        console.error('Error creating listing:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 9. UPDATE LISTING (PUT)
app.put('/api/listings/:id', async (req, res) => {
    try {
        const db = await readListingsXML();
        const listings = db.PropertyListings.PropertyListing;
        const targetId = String(req.params.id).trim();

        const getCleanId = (idObj) => {
            if (!idObj) return '';
            const val = typeof idObj === 'object' ? (idObj._ || idObj['$']?.id || '') : idObj;
            return String(val).trim();
        };

        const idx = listings.findIndex(l =>
            getCleanId(l.PropertyID) === targetId &&
            String(l.IsDeleted).toLowerCase() !== 'true'
        );

        if (idx === -1) {
            console.warn(`[API] Update failed - Listing ID ${targetId} matches none in [${listings.map(l => getCleanId(l.PropertyID)).join(', ')}]`);
            return res.status(404).json({ error: 'Listing not found.' });
        }

        const payload = req.body;
        const now = new Date().toISOString();

        let isRoomRent = true;
        try {
            const parsed = JSON.parse(payload.PropertySubType);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].SubTypeID === 'RST001') {
                isRoomRent = false;
            }
        } catch (e) { }

        // Rebuild object preserving PropertyID and CreatedDate
        const updated = buildListingObject(payload, req.params.id, listings[idx].CreatedDate, isRoomRent);
        updated.CreatedBy = listings[idx].CreatedBy;   // forbid changing owner
        updated.CreatedDate = listings[idx].CreatedDate;
        updated.UpdatedDate = now;

        listings[idx] = updated;
        writeListingsXML(db);

        console.log(`[API] Listing updated: ${req.params.id}`);
        return res.status(200).json({ success: true, message: 'Listing updated.', data: updated });
    } catch (error) {
        console.error('Error updating listing:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 10. SOFT DELETE LISTING (DELETE)
app.delete('/api/listings/:id', async (req, res) => {
    try {
        const db = await readListingsXML();
        const listings = db.PropertyListings.PropertyListing;
        const targetId = String(req.params.id).trim();

        const getCleanId = (idObj) => {
            if (!idObj) return '';
            const val = typeof idObj === 'object' ? (idObj._ || idObj['$']?.id || '') : idObj;
            return String(val).trim();
        };

        const idx = listings.findIndex(l =>
            getCleanId(l.PropertyID) === targetId &&
            String(l.IsDeleted).toLowerCase() !== 'true'
        );
        if (idx === -1) {
            console.warn(`[API] Delete failed - Listing ID ${targetId} matches none in [${listings.map(l => getCleanId(l.PropertyID)).join(', ')}]`);
            return res.status(404).json({ error: 'Listing not found.' });
        }

        listings[idx].IsDeleted = 'true';
        listings[idx].IsActive = 'false';
        listings[idx].UpdatedDate = new Date().toISOString();
        writeListingsXML(db);

        return res.status(200).json({ success: true, message: 'Listing deleted.' });
    } catch (error) {
        console.error('Error deleting listing:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 11. MARK LISTING AS CLOSED (PATCH)
app.patch('/api/listings/:id/close', async (req, res) => {
    try {
        const db = await readListingsXML();
        const listings = db.PropertyListings.PropertyListing;
        const targetId = String(req.params.id).trim();

        const getCleanId = (idObj) => {
            if (!idObj) return '';
            const val = typeof idObj === 'object' ? (idObj._ || idObj['$']?.id || '') : idObj;
            return String(val).trim();
        };

        const idx = listings.findIndex(l =>
            getCleanId(l.PropertyID) === targetId &&
            String(l.IsDeleted).toLowerCase() !== 'true'
        );

        if (idx === -1) {
            console.warn(`[API] Close failed - Listing ID ${targetId} matches none in [${listings.map(l => getCleanId(l.PropertyID)).join(', ')}]`);
            return res.status(404).json({ error: 'Listing not found.' });
        }

        listings[idx].IsClosed = 'true';
        listings[idx].UpdatedDate = new Date().toISOString();
        writeListingsXML(db);

        return res.status(200).json({ success: true, message: 'Listing marked as closed.' });
    } catch (error) {
        console.error('Error closing listing:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 12. REOPEN CLOSED LISTING (PATCH)
app.patch('/api/listings/:id/reopen', async (req, res) => {
    try {
        const db = await readListingsXML();
        const listings = db.PropertyListings.PropertyListing;
        const targetId = String(req.params.id).trim();

        const getCleanId = (idObj) => {
            if (!idObj) return '';
            const val = typeof idObj === 'object' ? (idObj._ || idObj['$']?.id || '') : idObj;
            return String(val).trim();
        };

        const idx = listings.findIndex(l =>
            getCleanId(l.PropertyID) === targetId &&
            String(l.IsDeleted).toLowerCase() !== 'true'
        );

        if (idx === -1) {
            console.warn(`[API] Reopen failed - Listing ID ${targetId} matches none in [${listings.map(l => getCleanId(l.PropertyID)).join(', ')}]`);
            return res.status(404).json({ error: 'Listing not found.' });
        }

        listings[idx].IsClosed = 'false';
        listings[idx].UpdatedDate = new Date().toISOString();
        writeListingsXML(db);

        return res.status(200).json({ success: true, message: 'Listing reopened.' });
    } catch (error) {
        console.error('Error reopening listing:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 NAYYAR API SERVER RUNNING ON PORT ${PORT}`);
    console.log(`========================================\n`);
});
