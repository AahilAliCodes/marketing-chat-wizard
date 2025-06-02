interface SessionData {
  [key: string]: any;
}

export class SessionManager {
  private static SESSION_KEY = 'blastari_session';
  private static SESSION_EXPIRY_HOURS = 24;
  private static MAX_COOKIE_SIZE = 1500; // Reduced from 3000 to be more conservative
  private static MAX_TOTAL_COOKIES = 10; // Limit total number of cookies

  // Generate a session ID if one doesn't exist
  static getSessionId(): string {
    let sessionId = localStorage.getItem(`${this.SESSION_KEY}_id`);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem(`${this.SESSION_KEY}_id`, sessionId);
      // Only store session ID in cookies, not large data
      this.setCookie(`${this.SESSION_KEY}_id`, sessionId, this.SESSION_EXPIRY_HOURS);
    }
    return sessionId;
  }

  // Generate a unique session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set session data with expiry (prioritize localStorage over cookies)
  static setSessionData(key: string, data: any): void {
    const sessionData = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    
    const serializedData = JSON.stringify(sessionData);
    
    // Always store in localStorage
    localStorage.setItem(`${this.SESSION_KEY}_${key}`, serializedData);
    
    // Only store critical data in cookies and only if it's small enough
    const isCriticalData = key.includes('session_id') || key.includes('user_id');
    const isSmallEnough = serializedData.length < this.MAX_COOKIE_SIZE;
    
    if (isCriticalData && isSmallEnough) {
      this.setCookie(`${this.SESSION_KEY}_${key}`, serializedData, this.SESSION_EXPIRY_HOURS);
    }
  }

  // Get session data (prioritize localStorage)
  static getSessionData(key: string): any {
    // First try localStorage (faster access and no size limits)
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

    // Only fallback to cookies for critical data
    const isCriticalData = key.includes('session_id') || key.includes('user_id');
    if (isCriticalData) {
      const cookieData = this.getCookie(`${this.SESSION_KEY}_${key}`);
      if (cookieData) {
        try {
          const parsed = JSON.parse(cookieData);
          if (this.isDataValid(parsed)) {
            // Restore to localStorage for faster future access
            localStorage.setItem(`${this.SESSION_KEY}_${key}`, cookieData);
            return parsed.data;
          } else {
            // Data expired, remove it
            this.removeSessionData(key);
          }
        } catch (error) {
          console.error('Error parsing cookie session data:', error);
          this.removeSessionData(key);
        }
      }
    }

    return null;
  }

  // Remove session data from both localStorage and cookies
  static removeSessionData(key: string): void {
    localStorage.removeItem(`${this.SESSION_KEY}_${key}`);
    this.deleteCookie(`${this.SESSION_KEY}_${key}`);
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

    // Clear all session cookies
    this.clearAllSessionCookies();
  }

  // Clear all session cookies efficiently
  private static clearAllSessionCookies(): void {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const trimmedName = name.trim();
      if (trimmedName.startsWith(this.SESSION_KEY)) {
        this.deleteCookie(trimmedName);
      }
    });
  }

  // Clear chat data for other websites (keep current website data)
  static clearOtherWebsiteChats(currentWebsiteUrl: string): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${this.SESSION_KEY}_chat_`) && !key.includes(currentWebsiteUrl)) {
        localStorage.removeItem(key);
        // Only clear cookies for critical data
        if (key.includes('session_id') || key.includes('user_id')) {
          this.deleteCookie(key);
        }
      }
    });
  }

  // Check if data is still valid
  private static isDataValid(sessionData: any): boolean {
    if (!sessionData.expires) return false;
    return Date.now() < sessionData.expires;
  }

  // Simplified cookie helper methods
  private static setCookie(name: string, value: string, hours: number): void {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (hours * 60 * 60 * 1000));
      
      // Encode the value
      const encodedValue = encodeURIComponent(value);
      
      // Don't chunk cookies anymore to reduce header size
      if (encodedValue.length <= this.MAX_COOKIE_SIZE) {
        document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
      } else {
        console.warn(`Cookie ${name} too large (${encodedValue.length} chars), storing in localStorage only`);
      }
    } catch (error) {
      console.error('Error setting cookie:', error);
    }
  }

  private static getCookie(name: string): string | null {
    try {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting cookie:', error);
      return null;
    }
  }

  private static deleteCookie(name: string): void {
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
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
    
    // Clear all non-critical cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const trimmedName = name.trim();
      if (trimmedName.startsWith(this.SESSION_KEY) && 
          !trimmedName.includes('session_id') && 
          !trimmedName.includes('user_id')) {
        this.deleteCookie(trimmedName);
      }
    });
    
    // Keep only recent localStorage data
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    keys.forEach(key => {
      if (key.startsWith(this.SESSION_KEY)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.timestamp && parsed.timestamp < oneHourAgo) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      }
    });
  }
}
