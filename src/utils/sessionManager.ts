interface SessionData {
  [key: string]: any;
}

export class SessionManager {
  private static SESSION_KEY = 'blastari_session';
  private static SESSION_EXPIRY_HOURS = 24;
  private static MAX_COOKIE_SIZE = 800; // Much smaller to avoid header issues
  private static MAX_TOTAL_COOKIES = 5; // Drastically reduced
  private static initialized = false;

  // Initialize and perform emergency cleanup
  private static initialize(): void {
    if (!this.initialized) {
      this.emergencyCleanup();
      this.initialized = true;
    }
  }

  // Generate a session ID if one doesn't exist
  static getSessionId(): string {
    this.initialize();
    let sessionId = localStorage.getItem(`${this.SESSION_KEY}_id`);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem(`${this.SESSION_KEY}_id`, sessionId);
      // Don't store in cookies at all to avoid header bloat
    }
    return sessionId;
  }

  // Generate a unique session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set session data (localStorage only, no cookies)
  static setSessionData(key: string, data: any): void {
    this.initialize();
    const sessionData = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    
    const serializedData = JSON.stringify(sessionData);
    
    // Only use localStorage to avoid header bloat
    localStorage.setItem(`${this.SESSION_KEY}_${key}`, serializedData);
  }

  // Get session data (localStorage only)
  static getSessionData(key: string): any {
    this.initialize();
    const localData = localStorage.getItem(`${this.SESSION_KEY}_${key}`);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (this.isDataValid(parsed)) {
          return parsed.data;
        } else {
          // Data expired, remove it
          this.removeSessionData(key);
        }
      } catch (error) {
        console.error('Error parsing localStorage session data:', error);
        this.removeSessionData(key);
      }
    }
    return null;
  }

  // Remove session data (localStorage only)
  static removeSessionData(key: string): void {
    localStorage.removeItem(`${this.SESSION_KEY}_${key}`);
  }

  // Clear all session data
  static clearAllSessionData(): void {
    // Clear localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.SESSION_KEY)) {
        localStorage.removeItem(key);
      }
    });

    // Clear all cookies to reduce headers
    this.clearAllCookies();
  }

  // Clear ALL cookies to minimize headers
  private static clearAllCookies(): void {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const trimmedName = name.trim();
      this.deleteCookie(trimmedName);
    });
  }

  // Clear chat data for other websites (keep current website data)
  static clearOtherWebsiteChats(currentWebsiteUrl: string): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${this.SESSION_KEY}_chat_`) && !key.includes(currentWebsiteUrl)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Check if data is still valid
  private static isDataValid(sessionData: any): boolean {
    if (!sessionData.expires) return false;
    return Date.now() < sessionData.expires;
  }

  // Remove cookie helper (aggressive deletion)
  private static deleteCookie(name: string): void {
    try {
      // Try multiple domain and path combinations
      const domains = [window.location.hostname, `.${window.location.hostname}`, ''];
      const paths = ['/', ''];
      
      domains.forEach(domain => {
        paths.forEach(path => {
          const domainStr = domain ? `;domain=${domain}` : '';
          const pathStr = path ? `;path=${path}` : '';
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC${domainStr}${pathStr}`;
        });
      });
    } catch (error) {
      console.error('Error deleting cookie:', error);
    }
  }

  // Dashboard-specific methods
  static setDashboardAnalytics(websiteUrl: string, data: any): void {
    this.setSessionData(`dashboard_analytics_${websiteUrl}`, data);
  }

  static getDashboardAnalytics(websiteUrl: string): any {
    return this.getSessionData(`dashboard_analytics_${websiteUrl}`);
  }

  static setDashboardPosts(websiteUrl: string, data: any): void {
    this.setSessionData(`dashboard_posts_${websiteUrl}`, data);
  }

  static getDashboardPosts(websiteUrl: string): any {
    return this.getSessionData(`dashboard_posts_${websiteUrl}`);
  }

  static clearDashboardData(websiteUrl: string): void {
    this.removeSessionData(`dashboard_analytics_${websiteUrl}`);
    this.removeSessionData(`dashboard_posts_${websiteUrl}`);
  }

  // Get all session keys (for debugging)
  static getAllSessionKeys(): string[] {
    const keys = Object.keys(localStorage);
    return keys.filter(key => key.startsWith(this.SESSION_KEY));
  }

  // Check if session has data for a specific website
  static hasDataForWebsite(websiteUrl: string): boolean {
    const analyticsKey = `analytics_${websiteUrl}`;
    const postsKey = `posts_${websiteUrl}`;
    
    return this.getSessionData(analyticsKey) !== null || this.getSessionData(postsKey) !== null;
  }

  // Set selected subreddit for drilldown
  static setSelectedSubreddit(subreddit: string): void {
    this.setSessionData('selected_subreddit', subreddit);
  }

  // Get selected subreddit for drilldown
  static getSelectedSubreddit(): string | null {
    return this.getSessionData('selected_subreddit');
  }

  // Clear selected subreddit
  static clearSelectedSubreddit(): void {
    this.removeSessionData('selected_subreddit');
  }

  // Emergency cleanup method to reduce header size
  static emergencyCleanup(): void {
    console.log('Performing emergency session cleanup to reduce header size...');
    
    // Clear ALL cookies aggressively
    this.clearAllCookies();
    
    // Keep only very recent localStorage data (last 30 minutes)
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const thirtyMinutesAgo = now - (30 * 60 * 1000);
    
    keys.forEach(key => {
      if (key.startsWith(this.SESSION_KEY)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.timestamp && parsed.timestamp < thirtyMinutesAgo) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      }
    });

    // Clear any other potential cookie sources
    try {
      // Clear any remaining cookies that might be causing issues
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    } catch (error) {
      console.error('Error during aggressive cookie cleanup:', error);
    }
  }
}
