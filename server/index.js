const express = require('express');
const bodyParser = require('body-parser');
const soap = require('soap');
const cors = require('cors');
const path = require('path');

const WSDL_URL = 'https://ec.europa.eu/taxation_customs/dds2/taric/services/goods?wsdl';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// Optionally serve the demo page from the dist folder
app.use('/', express.static(path.join(__dirname, '..', 'dist', 'tdr-app-v2-en')));

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = soap.createClientAsync(WSDL_URL).then(c => c);
  }
  return clientPromise;
}

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TARIC proxy listening on http://localhost:${PORT}`));
