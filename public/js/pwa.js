/**
 * HUBOOZE PWA MANAGER
 * Handles SW registration, install prompt, push subscriptions
 */
(function() {
  'use strict';

  // ── Service Worker Registration ───────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[PWA] Service Worker registered:', reg.scope);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'navigate' && typeof showPage === 'function') {
            const url = new URL(event.data.url, window.location.origin);
            const page = url.searchParams.get('page') || 'home';
            showPage(page);
          }
        });
      } catch (err) {
        console.warn('[PWA] SW registration failed:', err.message);
      }
    });
  }

  // ── Install Prompt (Add to Home Screen) ──────────────────────
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
    if (typeof showToast === 'function') {
      showToast('🎉 Hubooze installed! Find it on your home screen.', 'success');
    }
    console.log('[PWA] App installed');
  });

  function showInstallButton() {
    let btn = document.getElementById('pwaInstallBtn');
    if (btn) { btn.style.display = 'flex'; return; }

    btn = document.createElement('button');
    btn.id        = 'pwaInstallBtn';
    btn.innerHTML = '📲 Install App';
    btn.style.cssText = `
      position:fixed;bottom:80px;right:72px;
      background:linear-gradient(90deg,#00ff8f,#00a1ff);
      color:#000;font-weight:700;border:none;border-radius:24px;
      padding:10px 18px;font-size:13px;cursor:pointer;
      z-index:8999;box-shadow:0 4px 20px rgba(0,255,143,.3);
      display:flex;align-items:center;gap:6px;font-family:inherit;
      animation:slideUpIn .4s ease;
    `;
    btn.onclick = triggerInstall;
    document.body.appendChild(btn);
  }

  function hideInstallButton() {
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) btn.remove();
  }

  async function triggerInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);
    deferredPrompt = null;
    if (outcome === 'accepted') hideInstallButton();
  }

  window.triggerPWAInstall = triggerInstall;

  // ── Update Banner ─────────────────────────────────────────────
  function showUpdateBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwaUpdateBanner';
    banner.style.cssText = `
      position:fixed;top:0;left:0;right:0;
      background:linear-gradient(90deg,#00ff8f,#00a1ff);
      color:#000;padding:12px 20px;z-index:99999;
      display:flex;align-items:center;justify-content:space-between;
      font-size:14px;font-weight:600;
    `;
    banner.innerHTML = `
      <span>🆕 New version of Hubooze available!</span>
      <button onclick="window.location.reload()" style="background:#000;color:#00ff8f;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-weight:700;font-family:inherit">Update Now</button>
    `;
    document.body.prepend(banner);
  }

  // ── Push Notifications ────────────────────────────────────────
  async function requestPushPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return { status: 'unsupported' };
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { status: 'denied' };

    try {
      const reg = await navigator.serviceWorker.ready;
      // VAPID key would go here for real push
      // const sub = await reg.pushManager.subscribe({...});
      return { status: 'granted', registration: reg };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  // Show native push notification (for demo)
  async function showLocalNotification(title, body, data = {}) {
    if (Notification.permission !== 'granted') {
      const result = await requestPushPermission();
      if (result.status !== 'granted') return;
    }
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      body,
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      vibrate: [200, 100, 200],
      data,
    });
  }

  window.pwa = {
    requestPushPermission,
    showLocalNotification,
    triggerInstall,
    isInstalled: () => window.matchMedia('(display-mode: standalone)').matches,
    isOnline:    () => navigator.onLine,
  };

  // ── Online / Offline Banner ───────────────────────────────────
  window.addEventListener('offline', () => {
    if (typeof showToast === 'function') showToast('📵 You are offline — some features may be limited', 'error');
  });
  window.addEventListener('online', () => {
    if (typeof showToast === 'function') showToast('✅ Back online!', 'success');
  });

})();
