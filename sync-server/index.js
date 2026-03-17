const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer } = require('ws');

// In y-websocket v3, bin/utils isn't exported cleanly. We can grab it from 'y-websocket/bin/utils.js' manually in some Node versions,
// but the easiest fix is downgrading y-websocket to v1.5.4 exclusively in the sync-server 
// or writing a quick proxy.
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;

const port = process.env.PORT || 1234;

const app = express();
app.use(cors());

// ... rest of file

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Yummy Sync Server is running!');
});

// A registry to hold custom event connections
const eventClients = new Map(); // pageId -> Set<WebSocket>

app.post('/api/broadcast', (req, res) => {
    const { pageId, event } = req.body;
    if (!pageId || !event) {
        return res.status(400).json({ error: "Missing pageId or event data" });
    }

    const roomClients = eventClients.get(pageId);
    if (roomClients && roomClients.size > 0) {
        const message = JSON.stringify(event);
        for (const client of roomClients) {
            if (client.readyState === 1) { // OPEN
                client.send(message);
            }
        }
        console.log(`[Sync Server] Broadcasted event to ${roomClients.size} clients in room ${pageId}`);
    } else {
        console.log(`[Sync Server] No active clients in room for broadcast: ${pageId}`);
    }

    res.json({ success: true });
});

const server = http.createServer(app);

// Setup WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (conn, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Check if it's the custom event channel
    if (url.pathname.startsWith('/events/')) {
        const pageId = url.pathname.split('/events/')[1];
        console.log(`[Sync Server] Client connected to events for room: ${pageId}`);
        
        if (!eventClients.has(pageId)) {
            eventClients.set(pageId, new Set());
        }
        eventClients.get(pageId).add(conn);

        conn.on('close', () => {
            const clients = eventClients.get(pageId);
            if (clients) {
                clients.delete(conn);
                if (clients.size === 0) {
                    eventClients.delete(pageId);
                }
            }
        });
        return;
    }

    // Otherwise pass it to Yjs
    console.log(`[Sync Server] Client connected to Yjs. URL: ${req.url}`);
    setupWSConnection(conn, req);
});

server.listen(port, () => {
    console.log(`[Sync Server] Running on http://localhost:${port}`);
    console.log(`[Sync Server] WebSocket listening on ws://localhost:${port}`);
});