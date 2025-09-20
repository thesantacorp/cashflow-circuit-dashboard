// Enhanced PWA Manager with TRUE installation detection
class AdvancedPWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isStandalone = false;
    this.installButton = null;
    this.init();
  }

  init() {
    // Enhanced installation detection
    this.checkInstallationStatus();
    
    // Register service worker with enhanced caching
    this.registerServiceWorker();
    
    // Setup PWA event listeners
    this.setupEventListeners();
    
    // Initialize install button with better detection
    setTimeout(() => this.initializeInstallButton(), 1000);
    
    // Continuous monitoring for installation status
    this.startInstallationMonitoring();
  }

  checkInstallationStatus() {
    // Multiple methods to detect if app is installed
    const checks = [
      // Check if running in standalone mode
      window.matchMedia('(display-mode: standalone)').matches,
      
      // iOS standalone check
      window.navigator.standalone === true,
      
      // Android WebAPK detection
      document.referrer.includes('android-app://'),
      
      // Check for TWA indicators
      window.location.search.includes('utm_source=pwa'),
      
      // Local storage flag (set after installation)
      localStorage.getItem('stackd-pwa-installed') === 'true',
      
      // URL contains our app identifier
      window.location.href.includes('utm_source=pwa'),
      
      // Check window dimensions (installed apps often have different dimensions)
      this.isLikelyInstalledApp()
    ];

    this.isStandalone = checks.some(check => check);
    this.isInstalled = this.isStandalone;

    console.log('Installation status checks:', {
      standalone: checks[0],
      iOS: checks[1],
      android: checks[2],
      twa: checks[3],
      localStorage: checks[4],
      url: checks[5],
      dimensions: checks[6],
      finalResult: this.isInstalled
    });
  }

  isLikelyInstalledApp() {
    // Check if the app is running in a way that suggests it's installed
    const hasAppLikeProperties = (
      // No browser UI visible
      window.outerHeight - window.innerHeight < 100 ||
      // Full screen or near full screen
      window.innerWidth === screen.width ||
      // Specific aspect ratios common in installed apps
      window.devicePixelRatio > 1
    );

    return hasAppLikeProperties && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone
    );
  }

  startInstallationMonitoring() {
    // Monitor for installation changes every few seconds
    setInterval(() => {
      const wasInstalled = this.isInstalled;
      this.checkInstallationStatus();
      
      if (wasInstalled !== this.isInstalled) {
        console.log('Installation status changed:', this.isInstalled);
        if (this.isInstalled) {
          this.hideInstallButton();
          localStorage.setItem('stackd-pwa-installed', 'true');
        } else {
          this.showInstallButton();
        }
      }
    }, 3000);
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('Service Worker registered:', registration);
        
        // Update service worker when available
        registration.addEventListener('updatefound', () => {
          console.log('New service worker version available');
        });
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupEventListeners() {
    // Listen for beforeinstallprompt event (Android Chrome)
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt fired');
      e.preventDefault();
      this.deferredPrompt = e;
      
      if (!this.isInstalled) {
        this.showInstallButton();
      }
    });

    // Listen for successful app installation
    window.addEventListener('appinstalled', (e) => {
      console.log('App installed successfully');
      this.isInstalled = true;
      localStorage.setItem('stackd-pwa-installed', 'true');
      this.hideInstallButton();
      this.deferredPrompt = null;
      
      // Show success message
      this.showInstallationSuccess();
    });

    // Monitor display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      console.log('Display mode changed:', e.matches);
      if (e.matches) {
        this.isInstalled = true;
        this.hideInstallButton();
        localStorage.setItem('stackd-pwa-installed', 'true');
      }
    });

    // Monitor for navigation that indicates app installation
    window.addEventListener('beforeunload', () => {
      if (this.isStandalone) {
        localStorage.setItem('stackd-pwa-installed', 'true');
      }
    });
  }

  initializeInstallButton() {
    // Find the existing install button
    this.findAndSetupInstallButton();
  }

  findAndSetupInstallButton() {
    // Multiple selectors to find the install button
    const selectors = [
      '[data-install-button]',
      'button[class*="install"]',
      'button:contains("Install")',
      '.install-button',
      '#install-button'
    ];

    let installButton = null;
    
    // Try each selector
    for (const selector of selectors) {
      installButton = document.querySelector(selector);
      if (installButton) break;
    }

    // If no button found, search by text content
    if (!installButton) {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        const text = button.textContent.toLowerCase();
        if (text.includes('install') && text.includes('stack')) {
          installButton = button;
          break;
        }
      }
    }

    if (installButton) {
      this.installButton = installButton;
      
      // Clear any existing click handlers
      const newButton = installButton.cloneNode(true);
      installButton.parentNode.replaceChild(newButton, installButton);
      this.installButton = newButton;
      
      // Set correct text
      this.updateButtonText();
      
      // Add our click handler
      this.installButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleInstallClick();
      });

      // Show or hide based on installation status
      if (this.isInstalled) {
        this.hideInstallButton();
      } else {
        this.showInstallButton();
      }
      
      console.log('Install button configured:', this.installButton);
    } else {
      console.log('No install button found, creating one...');
      this.createInstallButton();
    }
  }

  findInstallButton() {
    // Try to find button with install-related text
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const text = button.textContent.toLowerCase();
      if (text.includes('install') || text.includes('add to home')) {
        return button;
      }
    }
    return null;
  }

  createInstallButton() {
    if (this.isInstalled) return; // Don't create if already installed

    const button = document.createElement('button');
    button.id = 'stackd-pwa-install';
    button.textContent = 'Install Stack\'d';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      background: linear-gradient(135deg, #FFA500, #FF8C00);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(255, 165, 0, 0.3);
      transition: all 0.3s ease;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    button.addEventListener('click', () => this.handleInstallClick());
    document.body.appendChild(button);
    this.installButton = button;
  }

  updateButtonText() {
    if (this.installButton) {
      this.installButton.textContent = 'Install Stack\'d';
      
      // Remove any debug text or indicators
      const textNode = this.installButton.childNodes[0];
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = 'Install Stack\'d';
      }
    }
  }

  async handleInstallClick() {
    console.log('Install button clicked');
    
    if (this.isInstalled) {
      console.log('App already installed, hiding button');
      this.hideInstallButton();
      return;
    }

    if (this.deferredPrompt) {
      console.log('Using deferred prompt for installation');
      
      // Show the native install prompt
      this.deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('User choice:', outcome);
      
      if (outcome === 'accepted') {
        this.isInstalled = true;
        localStorage.setItem('stackd-pwa-installed', 'true');
        this.hideInstallButton();
        this.showInstallationSuccess();
      }
      
      this.deferredPrompt = null;
    } else {
      // Fallback for browsers without beforeinstallprompt
      console.log('No deferred prompt, showing fallback');
      this.showInstallationInstructions();
    }
  }

  showInstallationInstructions() {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !isChrome;

    if (isAndroid) {
      this.showAndroidInstructions();
    } else if (isIOS && isSafari) {
      this.showIOSInstructions();
    } else {
      this.showDesktopInstructions();
    }
  }

  showAndroidInstructions() {
    const modal = this.createModal(
      '📱 Install Stack\'d',
      `
        <div style="text-align: center;">
          <div style="font-size: 48px; margin: 20px 0;">⬇️</div>
          <p><strong>To install Stack'd as a real app:</strong></p>
          <ol style="text-align: left; margin: 20px 0; line-height: 1.6;">
            <li>Tap the <strong>menu</strong> (⋮) in your browser</li>
            <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
            <li>Tap <strong>"Install"</strong> when prompted</li>
            <li>The app will be installed like any other Android app</li>
          </ol>
          <p style="color: #666; font-size: 14px;">You can uninstall it later from your app drawer</p>
        </div>
      `
    );
    document.body.appendChild(modal);
  }

  showIOSInstructions() {
    const modal = this.createModal(
      '📱 Install Stack\'d',
      `
        <div style="text-align: center;">
          <div style="font-size: 48px; margin: 20px 0;">📱</div>
          <p><strong>To install Stack'd on iOS:</strong></p>
          <ol style="text-align: left; margin: 20px 0; line-height: 1.6;">
            <li>Tap the <strong>Share button</strong> <span style="font-size: 18px;">⬆️</span></li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> in the top right</li>
            <li>Stack'd will appear on your home screen</li>
          </ol>
          <p style="color: #666; font-size: 14px;">Long press the icon later to remove it</p>
        </div>
      `
    );
    document.body.appendChild(modal);
  }

  showDesktopInstructions() {
    const modal = this.createModal(
      '💻 Install Stack\'d',
      `
        <div style="text-align: center;">
          <div style="font-size: 48px; margin: 20px 0;">⬇️</div>
          <p><strong>To install Stack'd:</strong></p>
          <ul style="text-align: left; margin: 20px 0; line-height: 1.6;">
            <li><strong>Chrome/Edge:</strong> Look for the install icon in the address bar</li>
            <li><strong>Firefox:</strong> Use the menu → "Install this site as an app"</li>
            <li><strong>Safari:</strong> File → "Add to Dock"</li>
          </ul>
        </div>
      `
    );
    document.body.appendChild(modal);
  }

  createModal(title, content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    contentDiv.innerHTML = `
      <h2 style="margin: 0 0 24px 0; color: #333; text-align: center;">${title}</h2>
      ${content}
      <button id="close-modal" style="
        background: #FFA500;
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        margin-top: 24px;
        font-size: 16px;
      ">Got it!</button>
    `;

    modal.appendChild(contentDiv);

    // Close handlers
    const closeButton = contentDiv.querySelector('#close-modal');
    closeButton.addEventListener('click', () => document.body.removeChild(modal));
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    });

    return modal;
  }

  showInstallationSuccess() {
    const modal = this.createModal(
      '✅ Stack\'d Installed!',
      `
        <div style="text-align: center;">
          <div style="font-size: 64px; margin: 20px 0;">🎉</div>
          <p style="font-size: 18px; margin: 20px 0;">
            <strong>Stack'd has been installed successfully!</strong>
          </p>
          <p style="color: #666;">
            You can now find it in your app drawer and use it offline.
          </p>
        </div>
      `
    );
    document.body.appendChild(modal);
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }, 3000);
  }


  showInstallButton() {
    if (this.installButton && !this.isInstalled) {
      this.installButton.style.display = 'block';
    }
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }
}

// Initialize the enhanced PWA system
function initializePWA() {
  console.log('Initializing enhanced PWA system...');
  
  // Create and inject manifest
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
  }

  // Add enhanced meta tags for better PWA support
  const metaTags = [
    { name: 'theme-color', content: '#FFA500' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'Stack\'d' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'application-name', content: 'Stack\'d' },
    { name: 'msapplication-TileColor', content: '#FFA500' },
    { name: 'msapplication-starturl', content: '/?utm_source=pwa' }
  ];

  metaTags.forEach(tag => {
    if (!document.querySelector(`meta[name="${tag.name}"]`)) {
      const meta = document.createElement('meta');
      meta.name = tag.name;
      meta.content = tag.content;
      document.head.appendChild(meta);
    }
  });

  // Initialize the PWA manager
  window.stackdPWA = new AdvancedPWAManager();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePWA);
} else {
  initializePWA();
}

// Also initialize on window load for additional safety
window.addEventListener('load', () => {
  if (!window.stackdPWA) {
    initializePWA();
  }
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdvancedPWAManager };
}