# TARIC Proxy (local dev)

This small proxy lets your browser page call the EU TARIC SOAP service without CORS issues.

Quick start:

1. cd server
2. npm install
3. npm start

Then open the demo page at: http://localhost:3000/eu-2026-taric-integration.html

Notes:
- The server uses the official WSDL: https://ec.europa.eu/taxation_customs/dds2/taric/services/goods?wsdl
- For production, secure the proxy and limit which operations/args are allowed.
