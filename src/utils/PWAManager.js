// PWA Manager Class for Stack'd Finance
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isStandalone = false;
    this.init();
  }

  init() {
    // Check if already installed/standalone
    this.checkInstallationStatus();
    
    // Register service worker
    this.registerServiceWorker();
    
    // Setup PWA event listeners
    this.setupEventListeners();
    
    // Initialize install button
    this.initializeInstallButton();
  }

  checkInstallationStatus() {
    // Check if running as standalone app
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true ||
                      document.referrer.includes('android-app://');
    
    // Check various installation indicators
    this.isInstalled = this.isStandalone ||
                      localStorage.getItem('pwa-installed') === 'true' ||
                      this.isRunningAsApp();
  }

  isRunningAsApp() {
    // Additional checks for app-like behavior
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           window.matchMedia('(display-mode: minimal-ui)').matches ||
           (window.navigator.standalone === true) ||
           (window.outerWidth === window.innerWidth && window.outerHeight === window.innerHeight);
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.isInstalled = true;
      localStorage.setItem('pwa-installed', 'true');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      if (e.matches) {
        this.isInstalled = true;
        this.hideInstallButton();
      }
    });
  }

  initializeInstallButton() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupInstallButton();
      });
    } else {
      this.setupInstallButton();
    }
  }

  setupInstallButton() {
    // Find existing install button or create one
    let installButton = document.querySelector('[data-install-button]') ||
                       document.querySelector('button[class*="install"]') ||
                       this.findInstallButton();
    
    if (!installButton) {
      // Create install button if none exists
      installButton = this.createInstallButton();
    }

    if (installButton) {
      this.installButton = installButton;
      
      // Update button text
      this.updateButtonText();
      
      // Add click handler
      installButton.addEventListener('click', () => {
        this.handleInstallClick();
      });

      // Show/hide based on installation status
      if (this.isInstalled) {
        this.hideInstallButton();
      } else {
        this.showInstallButton();
      }
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
    const button = document.createElement('button');
    button.className = 'install-pwa-button';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      transition: all 0.3s ease;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
    });

    document.body.appendChild(button);
    return button;
  }

  updateButtonText() {
    if (this.installButton) {
      this.installButton.textContent = 'Install Stack\'d';
    }
  }

  async handleInstallClick() {
    if (this.deferredPrompt) {
      // Standard PWA installation
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.isInstalled = true;
        localStorage.setItem('pwa-installed', 'true');
      }
      
      this.deferredPrompt = null;
    } else {
      // Fallback for iOS and other browsers
      this.showIOSInstructions();
    }
  }

  showIOSInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      const modal = this.createIOSModal();
      document.body.appendChild(modal);
    } else {
      // For other browsers, try to trigger download or show generic instructions
      this.showGenericInstructions();
    }
  }

  createIOSModal() {
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
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 320px;
      text-align: center;
      position: relative;
    `;

    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #111;">Install Stack'd</h3>
      <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
        <strong>Note:</strong> Please use Safari browser for the best installation experience.<br/><br/>
        Tap the <strong>Share</strong> button below, then select <strong>"Add to Home Screen"</strong> to install Stack'd as an app.
      </p>
      <div style="font-size: 32px; margin: 16px 0;">📱 ➜ 🏠</div>
      <button id="close-ios-modal" style="
        background: #FFA500;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      ">Got it!</button>
    `;

    modal.appendChild(content);

    modal.querySelector('#close-ios-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    return modal;
  }

  showGenericInstructions() {
    alert('To install Stack\'d as an app:\n\n• Chrome/Edge: Use the install button in the address bar\n• Firefox: Add to home screen from the menu\n• Safari: Use Share > Add to Home Screen');
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

// Initialize PWA when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize PWA Manager
  window.pwaManager = new PWAManager();
  
  // Add manifest link to head if not present
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
  }
  
  // Add iOS meta tags for better PWA support
  const iosTags = [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'Stack\'d' },
    { name: 'mobile-web-app-capable', content: 'yes' }
  ];
  
  iosTags.forEach(tag => {
    if (!document.querySelector(`meta[name="${tag.name}"]`)) {
      const meta = document.createElement('meta');
      meta.name = tag.name;
      meta.content = tag.content;
      document.head.appendChild(meta);
    }
  });
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PWAManager };
}