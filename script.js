const THEME_KEY = 'tg-color-scheme';
const REPO = 'lcc33/terminal-graveyard';

class ThemeManager {
  constructor() {
    this.toggle = document.getElementById('themeToggle');
    this.html = document.documentElement;
    this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.init();
  }

  getStoredMode() {
    try {
      const m = localStorage.getItem(THEME_KEY);
      if (m === 'light' || m === 'dark') return m;
    } catch (e) {}
    return 'system';
  }

  followsSystem() {
    return this.getStoredMode() === 'system';
  }

  systemTheme() {
    try {
      return this.prefersDark.matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  }

  resolve() {
    const mode = this.getStoredMode();
    if (mode === 'light' || mode === 'dark') return mode;
    return this.systemTheme();
  }

  applied() {
    const attr = this.html.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return this.systemTheme();
  }

  init() {
    this.setTheme(this.resolve());
    if (this.toggle) {
      this.toggle.addEventListener('click', (e) => {
        if (e.shiftKey) {
          e.preventDefault();
          this.resetToSystem();
          return;
        }
        this.toggleTheme();
      });
    }
    this.prefersDark.addEventListener('change', () => {
      if (this.followsSystem()) this.setTheme(this.systemTheme());
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.followsSystem()) {
        const next = this.systemTheme();
        if (next !== this.applied()) this.setTheme(next);
      }
    });
  }

  toggleTheme() {
    const next = this.applied() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {}
  }

  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    this.html.setAttribute('data-theme', theme);
    if (this.toggle) {
      this.toggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
      this.toggle.title = `Theme: ${theme}. Click to switch. Shift-click to follow system.`;
    }
  }

  resetToSystem() {
    try {
      localStorage.removeItem(THEME_KEY);
    } catch (e) {}
    this.setTheme(this.systemTheme());
  }
}

class ClockManager {
  constructor() {
    this.el = document.getElementById('currentClock');
    this.init();
  }

  init() {
    this.update();
    setInterval(() => this.update(), 1000);
  }

  update() {
    if (!this.el) return;
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    this.el.textContent = `${h}:${m}:${s}`;
  }
}

class PlatformManager {
  constructor() {
    this.tabs = document.querySelectorAll('.os-tab-btn');
    this.panels = document.querySelectorAll('.os-panel');
    this.init();
  }

  detectPlatform() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const platform = (navigator.platform || navigator.userAgentData?.platform || '').toLowerCase();
    if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os')) {
      return 'mac';
    }
    if (platform.includes('linux') || ua.includes('linux') || ua.includes('x11')) {
      return 'linux';
    }
    return 'windows';
  }

  setPlatform(platformName) {
    this.tabs.forEach((tab) => {
      const isMatch = tab.getAttribute('data-target') === platformName;
      tab.classList.toggle('active', isMatch);
      tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    this.panels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === `panel-${platformName}`);
    });
  }

  init() {
    const current = this.detectPlatform();
    this.setPlatform(current);

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        if (target) this.setPlatform(target);
      });
    });
  }
}

class StatsManager {
  constructor() {
    this.starEl = document.getElementById('starCount');
    this.downloadStatsEl = document.getElementById('downloadStats');
    this.downloadsCountEl = document.getElementById('totalDownloadsCount');
    this.init();
  }

  async init() {
    this.fetchStars();
    this.fetchDownloads();
    this.attachDownloadTracker();
  }

  async fetchStars() {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}`);
      if (res.ok) {
        const data = await res.json();
        if (this.starEl && typeof data.stargazers_count === 'number') {
          this.starEl.textContent = data.stargazers_count.toLocaleString();
        }
      }
    } catch (e) {}
  }

  async fetchDownloads() {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases`);
      if (res.ok) {
        const releases = await res.json();
        let totalDownloads = 0;
        if (Array.isArray(releases)) {
          releases.forEach((rel) => {
            if (Array.isArray(rel.assets)) {
              rel.assets.forEach((asset) => {
                totalDownloads += asset.download_count || 0;
              });
            }
          });
        }
        if (this.downloadsCountEl && this.downloadStatsEl && totalDownloads > 0) {
          this.downloadsCountEl.textContent = totalDownloads.toLocaleString();
          this.downloadStatsEl.style.display = 'inline-flex';
        }
      }
    } catch (e) {}
  }

  attachDownloadTracker() {
    document.querySelectorAll('.download-track').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fileType = btn.getAttribute('data-file') || 'installer';
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'download', { event_category: 'app', event_label: fileType });
        }
      });
    });
  }
}

class SuggestionManager {
  constructor() {
    this.form = document.getElementById('suggestionForm');
    this.input = document.getElementById('nameSuggestion');
    this.message = document.getElementById('suggestionMessage');
    this.init();
  }

  init() {
    if (!this.form) return;
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const suggestion = this.input.value.trim();
      if (!suggestion) return;

      try {
        const response = await fetch('save_suggestion.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suggestion })
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
          this.showMessage('Thanks for the suggestion!', 'success');
          this.input.value = '';
        } else {
          this.showMessage('Failed to save suggestion.', 'error');
        }
      } catch (err) {
        this.showMessage('Error submitting suggestion.', 'error');
      }
    });
  }

  showMessage(msg, type) {
    this.message.textContent = msg;
    this.message.className = `suggestion-message ${type}`;
    setTimeout(() => {
      this.message.className = 'suggestion-message';
      this.message.textContent = '';
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
  new ClockManager();
  new StatsManager();
  new PlatformManager();
  new SuggestionManager();
});

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
  if (e.key.toLowerCase() === 't') {
    e.preventDefault();
    document.getElementById('themeToggle')?.click();
  }
});

