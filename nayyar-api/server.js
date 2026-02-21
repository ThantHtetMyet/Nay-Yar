const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

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
        return res.status(200).json({ success: true, user: { UserID: user.UserID, Email: user.Email } });

    } catch (error) {
        console.error(error);
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
