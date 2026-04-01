/**
 * app.js — Authentication Logic
 * Handles Login and Register for index.html
 */

// ── Config ──────────────────────────────────────────────
// Update this URL when you deploy to Render
const API_BASE = 'http://localhost:8080';

// ── Redirect if already logged in ───────────────────────
(function checkAuth() {
    const user = sessionStorage.getItem('chatUser');
    if (user) {
        window.location.href = 'chat.html';
    }
})();

// ── Tab Switching ────────────────────────────────────────
function switchTab(tab) {
    const loginForm    = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab     = document.getElementById('loginTab');
    const registerTab  = document.getElementById('registerTab');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        clearMessages();
    } else {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        clearMessages();
    }
}

function clearMessages() {
    const els = document.querySelectorAll('.error-msg, .msg');
    els.forEach(el => el.classList.add('hidden'));
}

// ── Login ────────────────────────────────────────────────
async function handleLogin(event) {
    event.preventDefault();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn      = document.getElementById('loginBtn');
    const errEl    = document.getElementById('loginError');

    setLoading(btn, true);
    errEl.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store user info in sessionStorage
            sessionStorage.setItem('chatUser', JSON.stringify({
                email: data.email,
                name: data.name
            }));
            window.location.href = 'chat.html';
        } else {
            showError(errEl, data.message || 'Login failed. Please try again.');
        }
    } catch (err) {
        showError(errEl, '⚠️ Cannot reach server. Make sure the backend is running.');
    } finally {
        setLoading(btn, false);
    }
}

// ── Register ─────────────────────────────────────────────
async function handleRegister(event) {
    event.preventDefault();

    const name     = document.getElementById('regName').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const btn      = document.getElementById('registerBtn');
    const msgEl    = document.getElementById('registerMsg');

    setLoading(btn, true);
    msgEl.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (data.success) {
            msgEl.textContent = '✅ ' + data.message;
            msgEl.classList.remove('hidden');
            // Auto-switch to login tab after 1.5 seconds
            setTimeout(() => switchTab('login'), 1500);
        } else {
            msgEl.textContent = '❌ ' + (data.message || 'Registration failed.');
            msgEl.style.color = '#ff5c6b';
            msgEl.classList.remove('hidden');
        }
    } catch (err) {
        msgEl.textContent = '⚠️ Cannot reach server. Make sure the backend is running.';
        msgEl.style.color = '#ff5c6b';
        msgEl.classList.remove('hidden');
    } finally {
        setLoading(btn, false);
    }
}

// ── Helpers ──────────────────────────────────────────────
function setLoading(btn, loading) {
    btn.disabled = loading;
    const text   = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (loading) {
        text.classList.add('hidden');
        loader.classList.remove('hidden');
    } else {
        text.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

function showError(el, message) {
    el.textContent = message;
    el.classList.remove('hidden');
}
