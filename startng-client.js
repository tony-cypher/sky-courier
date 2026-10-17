// start.ng Integration Client for Sky Courier
const START_NG = 'https://start.ng';
const API_URL = 'https://api.start.ng';

// Fallback guest profile when playing offline or locally
const DEFAULT_GUEST = {
  name: 'Sky Cadet',
  account: 'guest',
  face: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23d8fd71"/><circle cx="50" cy="42" r="22" fill="%238d5524"/><circle cx="42" cy="38" r="4" fill="%2317120f"/><circle cx="58" cy="38" r="4" fill="%2317120f"/><path d="M42 54 Q50 62 58 54" stroke="%2317120f" stroke-width="3" fill="none"/></svg>',
  style: {
    body: 'male',
    primaryColor: '#00a8ff',
    secondaryColor: '#273c75',
    skinColor: '#8d5524',
    hairColor: '#17120f',
    hair: 'short',
    hat: 'cap',
    accessory: 'scarf'
  }
};

class StartNgClient {
  constructor() {
    this.framePromise = null;
    this.user = null;
    this.guest = null;
    this.isSignedIn = false;
    this.isLocal = !window.location.hostname.endsWith('start.ng');
    this.gameName = window.location.hostname.split('.')[0] || 'sky-courier';
    this.session = null;

    this.checkSessionParam();
  }

  checkSessionParam() {
    try {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const session = params.get('startng_session');
        if (session) {
          sessionStorage.setItem('startng_session', session);
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
      this.session = sessionStorage.getItem('startng_session');
    } catch (e) {
      console.warn('Session check warning:', e);
    }
  }

  connectFrame() {
    if (this.framePromise) return this.framePromise;

    this.framePromise = new Promise((resolve, reject) => {
      // Don't bother trying to embed start.ng frame if we are on localhost/file
      if (this.isLocal) {
        resolve(null);
        return;
      }

      const el = document.createElement('iframe');
      el.src = `${START_NG}/connect`;
      el.hidden = true;
      el.onload = () => resolve(el);
      el.onerror = () => {
        console.warn('Could not load start.ng iframe');
        resolve(null);
      };
      document.body.appendChild(el);
    });

    return this.framePromise;
  }

  async askStartNg(message, replyType, timeoutMs = 4000) {
    const el = await this.connectFrame();
    if (!el || !el.contentWindow) return null;

    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      let timer = null;

      const done = (reply) => {
        if (timer) clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        resolve(reply);
      };

      timer = setTimeout(() => done(null), timeoutMs);

      function onMessage(e) {
        if (e.origin !== START_NG || e.source !== el.contentWindow) return;
        if (e.data?.type === replyType && e.data.requestId === requestId) {
          done(e.data);
        }
      }

      window.addEventListener('message', onMessage);
      try {
        el.contentWindow.postMessage({ ...message, requestId }, START_NG);
      } catch (err) {
        console.warn('postMessage error:', err);
        done(null);
      }
    });
  }

  async init() {
    // 1. Try iframe postMessage if hosted on *.start.ng
    if (!this.isLocal) {
      try {
        const reply = await this.askStartNg({ type: 'startng:whoami' }, 'startng:user', 3500);
        if (reply) {
          this.user = reply.user || null;
          this.guest = reply.guest || DEFAULT_GUEST;
          this.isSignedIn = !!this.user;
          return this.getActiveProfile();
        }
      } catch (err) {
        console.warn('iframe whoami failed, falling back to HTTP/local:', err);
      }
    }

    // 2. Try HTTP session if available
    if (this.session) {
      try {
        const res = await fetch(`${API_URL}/games/${this.gameName}/player`, {
          headers: { Authorization: `Bearer ${this.session}` }
        });
        if (res.ok) {
          const playerData = await res.json();
          this.user = playerData;
          this.isSignedIn = true;
          return this.getActiveProfile();
        } else if (res.status === 401) {
          sessionStorage.removeItem('startng_session');
          this.session = null;
        }
      } catch (e) {
        console.warn('HTTP player fetch failed:', e);
      }
    }

    // 3. Fallback for guests and local development
    this.guest = DEFAULT_GUEST;
    this.isSignedIn = false;
    return this.getActiveProfile();
  }

  getActiveProfile() {
    const profile = this.user || this.guest || DEFAULT_GUEST;
    return {
      id: profile.id || null,
      name: profile.name || 'Sky Cadet',
      account: profile.account || (this.isSignedIn ? 'pilot' : 'guest'),
      style: profile.style || DEFAULT_GUEST.style,
      face: profile.face || DEFAULT_GUEST.face,
      isSignedIn: this.isSignedIn
    };
  }

  signIn() {
    const returnTo = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `${START_NG}/?return_to=${returnTo}`;
  }

  async submitScore(stats) {
    if (!this.isSignedIn) {
      return { ok: false, error: 'Sign in to start.ng to post your run to the global leaderboard!' };
    }

    // Attempt postMessage first
    try {
      const reply = await this.askStartNg({ type: 'startng:score', stats }, 'startng:scoreSaved', 4000);
      if (reply) {
        return reply;
      }
    } catch (e) {
      console.warn('postMessage score submission error:', e);
    }

    // Fallback to HTTP API
    if (this.session) {
      try {
        const res = await fetch(`${API_URL}/games/${this.gameName}/scores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.session}`
          },
          body: JSON.stringify({ stats })
        });
        if (res.ok) {
          const result = await res.json();
          return { ok: true, result };
        }
      } catch (err) {
        console.warn('HTTP score save error:', err);
      }
    }

    return { ok: false, error: 'Could not connect to start.ng server' };
  }

  async getLeaderboard(limit = 10) {
    // 1. Try postMessage
    try {
      const reply = await this.askStartNg({ type: 'startng:leaderboard', limit }, 'startng:leaderboardData', 3500);
      if (reply && reply.entries) {
        return reply.entries;
      }
    } catch (e) {}

    // 2. Try HTTP API
    try {
      const res = await fetch(`${API_URL}/games/${this.gameName}/leaderboard?limit=${limit}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    // Mock local leaderboard for demonstration when not on start.ng yet
    return [
      { rank: 1, name: 'AeroAce', stats: { distance: 4820, parcels: 24, coins: 145 } },
      { rank: 2, name: 'CloudDancer', stats: { distance: 3650, parcels: 19, coins: 98 } },
      { rank: 3, name: 'SkyZephyr', stats: { distance: 2900, parcels: 14, coins: 72 } },
      { rank: 4, name: 'WindRider', stats: { distance: 1840, parcels: 9, coins: 45 } },
      { rank: 5, name: 'AviationFan', stats: { distance: 1200, parcels: 6, coins: 30 } }
    ];
  }
}

window.startNgClient = new StartNgClient();
