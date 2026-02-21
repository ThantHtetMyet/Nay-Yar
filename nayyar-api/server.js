const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const crypto = require('crypto');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// XML Database File Path
const USER_DB_PATH = path.join(__dirname, 'Database', 'user_data.xml');

// Helper to Read XML
const readUsersXML = async () => {
    try {
        if (!fs.existsSync(USER_DB_PATH)) {
            return { Users: { User: [] } };
        }
        const xmlData = fs.readFileSync(USER_DB_PATH, 'utf-8');
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        if (!result || !result.Users) return { Users: { User: [] } };

        // Ensure User array exists even if single record
        if (result.Users.User && !Array.isArray(result.Users.User)) {
            result.Users.User = [result.Users.User];
        }
        if (!result.Users.User) {
            result.Users.User = [];
        }

        return result;
    } catch (error) {
        console.error("Error reading XML DB:", error);
        return { Users: { User: [] } };
    }
};

// Helper to Write XML
const writeUsersXML = (dataObj) => {
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(dataObj);
    fs.writeFileSync(USER_DB_PATH, xml);
};

// Generic Helper to Read Dropdown XML Data
const readGenericXML = async (xmlPath, rootNode, childNode) => {
    try {
        if (!fs.existsSync(xmlPath)) {
            return [];
        }
        const xmlData = fs.readFileSync(xmlPath, 'utf-8');
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        if (!result || !result[rootNode] || !result[rootNode][childNode]) return [];

        let items = result[rootNode][childNode];
        if (!Array.isArray(items)) {
            items = [items];
        }
        // Filter out inactive items if IsActive exists
        return items.filter(item => item.IsActive !== 'false');
    } catch (error) {
        console.error(`Error reading ${xmlPath}:`, error);
        return [];
    }
};


// --- API ENDPOINTS ---

// 1. SIGNUP API
app.post('/api/signup', async (req, res) => {
    try {
        const { userID, fullName, email, mobileNo, loginPassword } = req.body;

        // Basic Validation
        if (!userID || !email || !loginPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const db = await readUsersXML();
        const users = db.Users.User;

        // Duplicate Check
        const isDuplicateUserID = users.some(u => u.UserID.toLowerCase() === userID.toLowerCase());
        const isDuplicateEmail = users.some(u => u.Email.toLowerCase() === email.toLowerCase());

        if (isDuplicateUserID || isDuplicateEmail) {
            return res.status(409).json({
                error: 'Conflict',
                message: isDuplicateUserID ? `UserID "${userID}" is already taken.` : `Email "${email}" is already registered.`
            });
        }

        // Generate ID and Timestamps
        const now = new Date().toISOString();
        const crypto = require('crypto');
        const newID = crypto.randomUUID();

        // Construct New User Node
        const newUser = {
            ID: newID,
            UserID: userID,
            FullName: fullName,
            Email: email,
            MobileNo: mobileNo,
            LoginPassword: loginPassword, // Storing raw initially as mock
            Remark: 'User Registered via API',
            LastLogin: now,
            IsActive: 'true',
            IsDeleted: 'false',
            CreatedDate: now,
            UpdatedDate: now
        };

        // Append to Array and Save
        db.Users.User.push(newUser);
        writeUsersXML(db);

        console.log(`[API] New user registered successfully: ${userID}`);
        return res.status(201).json({ success: true, user: newUser });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


// 2. LOGIN API
app.post('/api/login', async (req, res) => {
    try {
        const { userID, password } = req.body;

        if (!userID || !password) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const db = await readUsersXML();
        const users = db.Users.User;

        // Find user by UserID
        const user = users.find(u => u.UserID.toLowerCase() === userID.toLowerCase());

        if (!user) {
            return res.status(404).json({ error: 'Invalid credentials. User not found.' });
        }

        // Extremely basic password check (In real prod, use bcrypt)
        // Since original mock had "hashed_password_placeholder", we allow passthrough or direct match
        const isMatch = (user.LoginPassword === password || user.LoginPassword === 'hashed_password_placeholder');

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password.' });
        }

        console.log(`[API] Login successful: ${userID}`);
        return res.status(200).json({ success: true, user: { UserID: user.UserID, Email: user.Email, FullName: user.FullName } });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


// 3. GET PROPERTY TYPES
app.get('/api/property-types', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'Database', 'property_type.xml');
        const items = await readGenericXML(dataPath, 'PropertyTypes', 'PropertyType');
        return res.status(200).json({ success: true, data: items });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 4. GET PROPERTY SUBTYPES
app.get('/api/property-subtypes', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'Database', 'property_subtype.xml');
        const items = await readGenericXML(dataPath, 'PropertyTypes', 'PropertyType'); // Schema uses PropertyTypes root
        return res.status(200).json({ success: true, data: items });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 5. GET LISTING TYPES
app.get('/api/listing-types', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'Database', 'listing_type.xml');
        const items = await readGenericXML(dataPath, 'ListingTypes', 'ListingType');
        return res.status(200).json({ success: true, data: items });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 6. CREATE PROPERTY LISTING (POST)
app.post('/api/listings', async (req, res) => {
    try {
        const payload = req.body;

        // Basic Validation
        if (!payload.PropertyType || !payload.ListingType || !payload.Price || !payload.CreatedBy || !payload.Country || !payload.City) {
            return res.status(400).json({ error: "Missing required fields (PropertyType, ListingType, Price, CreatedBy, Country, City)." });
        }

        const LISTING_DB_PATH = path.join(__dirname, 'Database', 'property_listing.xml');
        let db = { PropertyListings: { PropertyListing: [] } };

        // Read existing DB if it exists
        if (fs.existsSync(LISTING_DB_PATH)) {
            const xmlData = fs.readFileSync(LISTING_DB_PATH, 'utf-8');
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(xmlData);

            if (result && result.PropertyListings) {
                db = result;
                if (db.PropertyListings.PropertyListing && !Array.isArray(db.PropertyListings.PropertyListing)) {
                    db.PropertyListings.PropertyListing = [db.PropertyListings.PropertyListing];
                }
                if (!db.PropertyListings.PropertyListing) {
                    db.PropertyListings.PropertyListing = [];
                }
            }
        }

        // Construct Mapping
        const newListing = {
            PropertyID: crypto.randomUUID(),
            PropertyType: payload.PropertyType,
            ListingType: payload.ListingType,
            PropertySubType: payload.PropertySubType || '', // Optional conditional
            Price: payload.Price,
            Currency: payload.Currency || 'USD',
            Country: payload.Country,
            City: payload.City,
            Address: payload.Address || '',
            PostalCode: payload.PostalCode || '',
            Bedrooms: payload.Bedrooms || '',
            Bathrooms: payload.Bathrooms || '',
            AreaSize: payload.AreaSize || '',
            AvailableFrom: payload.AvailableFrom || '',
            ContactPhone: payload.ContactPhone || '',
            ContactEmail: payload.ContactEmail || '',
            Description: payload.Description || '',
            Remark: payload.Remark || '',
            CreatedBy: payload.CreatedBy, // Foreign Key
            CreatedDate: new Date().toISOString(),
            UpdatedDate: '',
            IsActive: 'true',
            IsDeleted: 'false'
        };

        db.PropertyListings.PropertyListing.push(newListing);

        // Save DB
        const builder = new xml2js.Builder();
        const xml = builder.buildObject(db);
        fs.writeFileSync(LISTING_DB_PATH, xml);

        return res.status(201).json({ success: true, message: "Listing created successfully.", data: newListing });
    } catch (error) {
        console.error("Error creating listing:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 NAYYAR API SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🔌 Listening for frontend requests...`);
    console.log(`📁 Database Path: ${USER_DB_PATH}`);
    console.log(`========================================\n`);
});
