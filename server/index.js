const express = require('express');
const bodyParser = require('body-parser');
const soap = require('soap');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { google } = require('googleapis');

const WSDL_URL = 'https://ec.europa.eu/taxation_customs/dds2/taric/services/goods?wsdl';

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Optionally serve the demo page from the dist folder
app.use('/', express.static(path.join(__dirname, '..', 'dist', 'tdr-app-v2-en')));

// Google Sheets configuration
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || '';
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '';

// Mock user database (in production, use a real database)
const users = [
  { id: '1', email: 'customer1@email.com', password: 'password123', region: 'EU' },
  { id: '2', email: 'customer2@email.com', password: 'password123', region: 'UK' },
  { id: '3', email: 'customer3@email.com', password: 'password123', region: 'US' },
  { id: '4', email: 'demo@tradedutyrefund.com', password: 'demo123', region: 'EU' }
];

// Helper function to get Google Sheets client
function getSheetsClient() {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEETS_ID) {
    console.warn('Google Sheets credentials not configured. Using mock data.');
    return null;
  }

  try {
    const auth = new google.auth.JWT(
      GOOGLE_CLIENT_EMAIL,
      null,
      GOOGLE_PRIVATE_KEY,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    return null;
  }
}

// Mock claims data (fallback when Google Sheets is not configured)
function getMockClaims(region, userEmail) {
  const mockData = {
    EU: [
      { claimId: 'TDR-EU-2024-001', dateFiled: '2024-01-15', dateRefunded: '2024-03-20', status: 'Refunded', amount: 1500, currency: 'EUR', region: 'EU', customerEmail: userEmail, notes: 'Refund processed successfully' },
      { claimId: 'TDR-EU-2024-002', dateFiled: '2024-02-10', dateRefunded: '', status: 'Processing', amount: 2500, currency: 'EUR', region: 'EU', customerEmail: userEmail, notes: 'Under review by customs' },
      { claimId: 'TDR-EU-2024-003', dateFiled: '2024-03-05', dateRefunded: '', status: 'Filed', amount: 800, currency: 'EUR', region: 'EU', customerEmail: userEmail, notes: 'Recently filed' }
    ],
    UK: [
      { claimId: 'TDR-UK-2024-001', dateFiled: '2024-01-20', dateRefunded: '2024-04-01', status: 'Refunded', amount: 1200, currency: 'GBP', region: 'UK', customerEmail: userEmail, notes: 'Refund completed' },
      { claimId: 'TDR-UK-2024-002', dateFiled: '2024-02-25', dateRefunded: '', status: 'Approved', amount: 1800, currency: 'GBP', region: 'UK', customerEmail: userEmail, notes: 'Approved, awaiting payment' }
    ],
    US: [
      { claimId: 'TDR-US-2024-001', dateFiled: '2024-02-01', dateRefunded: '2024-04-15', status: 'Refunded', amount: 3000, currency: 'USD', region: 'US', customerEmail: userEmail, notes: 'Refund processed' },
      { claimId: 'TDR-US-2024-002', dateFiled: '2024-03-10', dateRefunded: '', status: 'Processing', amount: 2200, currency: 'USD', region: 'US', customerEmail: userEmail, notes: 'In progress' },
      { claimId: 'TDR-US-2024-003', dateFiled: '2024-03-20', dateRefunded: '', status: 'Filed', amount: 1500, currency: 'USD', region: 'US', customerEmail: userEmail, notes: 'New claim' }
    ]
  };

  return mockData[region] || [];
}

// Fetch claims from Google Sheets
async function fetchClaimsFromSheets(region, userEmail) {
  const sheets = getSheetsClient();
  if (!sheets) {
    return getMockClaims(region, userEmail);
  }

  try {
    // This assumes your Google Sheet has a tab for each region
    // and columns: Claim ID, Date Filed, Date Refunded, Status, Amount, Currency, Customer Email, Notes
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${region}!A:H` // Adjust range as needed
    });

    const rows = response.data.values || [];
    const claims = [];

    // Skip header row if it exists
    const startRow = rows.length > 0 && rows[0][0] === 'Claim ID' ? 1 : 0;

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 7 && row[6] === userEmail) { // row[6] should be customer email
        claims.push({
          claimId: row[0],
          dateFiled: row[1],
          dateRefunded: row[2],
          status: row[3],
          amount: parseFloat(row[4]) || 0,
          currency: row[5] || 'USD',
          region: region,
          customerEmail: row[6],
          notes: row[7] || ''
        });
      }
    }

    return claims;
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return getMockClaims(region, userEmail);
  }
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = soap.createClientAsync(WSDL_URL).then(c => c);
  }
  return clientPromise;
}

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { email, password, region } = req.body || {};

  if (!email || !password || !region) {
    return res.status(400).json({ error: 'Email, password, and region are required' });
  }

  const user = users.find(u => u.email === email && u.password === password && u.region === region);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    region: user.region
  };

  return res.json({ 
    success: true, 
    user: { id: user.id, email: user.email, region: user.region } 
  });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session.user) {
    return res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  }
  return res.json({ authenticated: false });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

// Claims routes
app.get('/api/claims', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    const { status, search } = req.query;
    const region = req.query.region || user.region;

    let claims = await fetchClaimsFromSheets(region, user.email);

    // Filter by status if provided
    if (status) {
      claims = claims.filter(claim => claim.status === status);
    }

    // Filter by search term (claim ID)
    if (search) {
      claims = claims.filter(claim => 
        claim.claimId.toLowerCase().includes(search.toLowerCase())
      );
    }

    return res.json({ claims, region });
  } catch (error) {
    console.error('Error fetching claims:', error);
    return res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// Get single claim details
app.get('/api/claims/:claimId', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    const claimId = req.params.claimId;
    const region = req.query.region || user.region;

    const claims = await fetchClaimsFromSheets(region, user.email);
    const claim = claims.find(c => c.claimId === claimId);

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    return res.json({ claim });
  } catch (error) {
    console.error('Error fetching claim:', error);
    return res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

// TARIC API routes (existing)
app.get('/api/taric/describe', async (req, res) => {
  try {
    const client = await getClient();
    const description = client.describe ? client.describe() : {};
    res.json(description);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/taric/execute', async (req, res) => {
  const { operation, args } = req.body || {};
  if (!operation) return res.status(400).json({ error: 'operation is required' });
  try {
    const client = await getClient();
    const parts = operation.split('.');
    // Resolve target object that contains the function
    let target = client;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
      if (!target) break;
    }
    const opName = parts[parts.length - 1];
    if (!target || !(opName in target)) return res.status(400).json({ error: 'operation not found on client' });

    // Prefer async variant if present
    const asyncName = opName + 'Async';
    if (typeof target[asyncName] === 'function') {
      try {
        const response = await target[asyncName](args || {});
        return res.json({ success: true, response });
      } catch (e) {
        return res.status(500).json({ error: String(e) });
      }
    }

    if (typeof target[opName] === 'function') {
      target[opName](args || {}, (err, result) => {
        if (err) return res.status(500).json({ error: String(err) });
        return res.json({ success: true, response: result });
      });
      return;
    }

    return res.status(400).json({ error: 'operation not callable' });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3035;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
