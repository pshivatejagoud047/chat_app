/**
 * chat.js — Real-Time Chat Logic
 * Handles WebSocket (STOMP/SockJS), contacts, message history for chat.html
 */

// ── Config ──────────────────────────────────────────────
// Update this to your Render URL when deployed
const API_BASE = 'http://localhost:8080';
const WS_URL   = `${API_BASE}/ws`;

// ── State ────────────────────────────────────────────────
let currentUser     = null;  // { email, name }
let selectedContact = null;  // { email, name, online }
let stompClient     = null;
let contacts        = [];    // all users

// ── Init ─────────────────────────────────────────────────
(function init() {
    const stored = sessionStorage.getItem('chatUser');
    if (!stored) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(stored);

    // Populate header
    document.getElementById('myName').textContent = currentUser.name;
    document.getElementById('myAvatar').textContent = getInitial(currentUser.name);

    // Load contacts and connect WebSocket
    loadContacts();
    connectWebSocket();

    // Mark offline on page close
    window.addEventListener('beforeunload', () => {
        markOffline();
        if (stompClient) stompClient.deactivate();
    });
})();

// ── WebSocket Connection ─────────────────────────────────
function connectWebSocket() {
    const client = new StompJs.Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        onConnect: () => {
            console.log('✅ WebSocket connected');

            // Subscribe to the broadcast topic
            client.subscribe('/topic/messages', (frame) => {
                const msg = JSON.parse(frame.body);
                handleIncomingMessage(msg);
            });
        },
        onStompError: (frame) => {
            console.error('WebSocket error:', frame);
            showToast('⚠️ Real-time connection lost. Reconnecting...');
        }
    });

    client.activate();
    stompClient = client;
}

// ── Load Contacts ────────────────────────────────────────
async function loadContacts() {
    try {
        const res  = await fetch(`${API_BASE}/users`);
        const data = await res.json();

        // Exclude yourself
        contacts = data.filter(u => u.email !== currentUser.email);
        renderContacts(contacts);
    } catch (err) {
        document.getElementById('contactsList').innerHTML =
            '<li class="loading-contacts" style="color:#ff5c6b">⚠️ Failed to load contacts</li>';
    }
}

function renderContacts(list) {
    const ul = document.getElementById('contactsList');
    if (list.length === 0) {
        ul.innerHTML = '<li class="loading-contacts">No other users registered yet</li>';
        return;
    }

    ul.innerHTML = list.map(user => `
        <li class="contact-item" id="contact-${btoa(user.email)}"
            onclick="selectContact('${user.email}', '${escapeHtml(user.name)}', ${user.online})">
            <div class="contact-avatar">
                ${getInitial(user.name)}
                <span class="contact-online-dot ${user.online ? 'dot-online' : 'dot-offline'}"></span>
            </div>
            <div class="contact-details">
                <div class="contact-name">${escapeHtml(user.name)}</div>
                <div class="contact-email">${escapeHtml(user.email)}</div>
            </div>
        </li>
    `).join('');
}

function filterContacts() {
    const query   = document.getElementById('searchInput').value.toLowerCase();
    const filtered = contacts.filter(
        u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
    renderContacts(filtered);
}

// ── Select Contact ───────────────────────────────────────
async function selectContact(email, name, online) {
    selectedContact = { email, name, online };

    // Highlight active contact
    document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`contact-${btoa(email)}`);
    if (el) el.classList.add('active');

    // Update chat header
    document.getElementById('chatAvatar').textContent      = getInitial(name);
    document.getElementById('chatContactName').textContent  = name;
    const statusEl = document.getElementById('chatContactStatus');
    statusEl.textContent = online ? '🟢 Online' : '⚫ Offline';
    statusEl.className   = 'contact-status-lg' + (online ? ' is-online' : '');

    // Show chat window
    document.getElementById('chatPlaceholder').classList.add('hidden');
    document.getElementById('chatWindow').classList.remove('hidden');

    // Load history
    await loadMessages();
}

// ── Load Message History ─────────────────────────────────
async function loadMessages() {
    const area = document.getElementById('messagesArea');
    area.innerHTML = '<div class="loading-contacts">Loading messages...</div>';

    try {
        const url = `${API_BASE}/chat/messages?sender=${encodeURIComponent(currentUser.email)}&receiver=${encodeURIComponent(selectedContact.email)}`;
        const res = await fetch(url);
        const msgs = await res.json();

        area.innerHTML = '';

        if (msgs.length === 0) {
            area.innerHTML = '<div class="loading-contacts">No messages yet. Say hello! 👋</div>';
            return;
        }

        let lastDate = null;
        msgs.forEach(msg => {
            const dateStr = formatDate(msg.timestamp);
            if (dateStr !== lastDate) {
                area.innerHTML += `<div class="date-divider"><span>${dateStr}</span></div>`;
                lastDate = dateStr;
            }
            area.innerHTML += buildBubble(msg);
        });

        scrollToBottom();
    } catch (err) {
        area.innerHTML = '<div class="loading-contacts" style="color:#ff5c6b">⚠️ Failed to load messages</div>';
    }
}

// ── Send Message ─────────────────────────────────────────
async function sendMessage() {
    if (!selectedContact) return;

    const input   = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content) return;

    input.value = '';

    const payload = {
        sender:   currentUser.email,
        receiver: selectedContact.email,
        content:  content
    };

    // Send via WebSocket (real-time broadcast + DB persistence via WebSocketController)
    if (stompClient && stompClient.connected) {
        stompClient.publish({
            destination: '/app/chat',
            body: JSON.stringify(payload)
        });
    } else {
        // Fallback to REST if WebSocket unavailable
        try {
            await fetch(`${API_BASE}/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            await loadMessages();
        } catch (err) {
            showToast('❌ Failed to send message');
        }
    }
}

// ── Handle Incoming WebSocket Messages ───────────────────
function handleIncomingMessage(msg) {
    const isMine     = msg.sender === currentUser.email;
    const isForMe    = msg.receiver === currentUser.email;
    const isInConversation =
        selectedContact &&
        ((msg.sender === selectedContact.email && msg.receiver === currentUser.email) ||
         (msg.sender === currentUser.email && msg.receiver === selectedContact.email));

    if (isInConversation) {
        // Append bubble to active conversation
        const area    = document.getElementById('messagesArea');
        const noMsg   = area.querySelector('.loading-contacts');
        if (noMsg) noMsg.remove();

        area.innerHTML += buildBubble(msg);
        scrollToBottom();
    } else if (isForMe && !isMine) {
        // Notification for a message in another conversation
        const from = contacts.find(c => c.email === msg.sender);
        showToast(`💬 New message from ${from ? from.name : msg.sender}`);
    }
}

// ── Key Press Handler ────────────────────────────────────
function handleKeyPress(event) {
    if (event.key === 'Enter') sendMessage();
}

// ── Logout ───────────────────────────────────────────────
async function logout() {
    await markOffline();
    sessionStorage.removeItem('chatUser');
    window.location.href = 'index.html';
}

async function markOffline() {
    try {
        await fetch(`${API_BASE}/auth/logout?email=${encodeURIComponent(currentUser.email)}`, {
            method: 'POST'
        });
    } catch (_) { /* ignore */ }
}

// ── Utilities ────────────────────────────────────────────
function buildBubble(msg) {
    const isOutgoing = msg.sender === currentUser.email;
    const time       = formatTime(msg.timestamp);
    return `
        <div class="message-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}">
            <div class="message-bubble">
                ${escapeHtml(msg.content)}
                <span class="message-time">${time}</span>
            </div>
        </div>
    `;
}

function scrollToBottom() {
    const area = document.getElementById('messagesArea');
    area.scrollTop = area.scrollHeight;
}

function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}

function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
    if (!ts) return '';
    const d   = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Toast Notification ───────────────────────────────────
let toastTimeout;
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}
