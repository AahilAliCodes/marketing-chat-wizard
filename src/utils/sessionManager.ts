
interface SessionData {
  [key: string]: any;
}

export class SessionManager {
  private static SESSION_KEY = 'blastari_session';
  private static SESSION_EXPIRY_HOURS = 24;

  // Generate a session ID if one doesn't exist
  static getSessionId(): string {
    let sessionId = localStorage.getItem(`${this.SESSION_KEY}_id`);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem(`${this.SESSION_KEY}_id`, sessionId);
      // Also store in cookies for cross-tab consistency
      this.setCookie(`${this.SESSION_KEY}_id`, sessionId, this.SESSION_EXPIRY_HOURS);
    }
    return sessionId;
  }

  // Generate a unique session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set session data with expiry (store in both localStorage and cookies)
  static setSessionData(key: string, data: any): void {
    const sessionData = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    
    const serializedData = JSON.stringify(sessionData);
    
    // Store in localStorage
    localStorage.setItem(`${this.SESSION_KEY}_${key}`, serializedData);
    
    // Store in cookies for persistence across sessions
    this.setCookie(`${this.SESSION_KEY}_${key}`, serializedData, this.SESSION_EXPIRY_HOURS);
  }

  // Get session data (check both localStorage and cookies)
  static getSessionData(key: string): any {
    // First try localStorage (faster access)
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

    // Fallback to cookies
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

    // Clear cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      if (name.trim().startsWith(this.SESSION_KEY)) {
        this.deleteCookie(name.trim());
      }
    });
  }

  // Clear chat data for other websites (keep current website data)
  static clearOtherWebsiteChats(currentWebsiteUrl: string): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${this.SESSION_KEY}_chat_`) && !key.includes(currentWebsiteUrl)) {
        localStorage.removeItem(key);
        this.deleteCookie(key);
      }
    });
  }

  // Check if data is still valid
  private static isDataValid(sessionData: any): boolean {
    if (!sessionData.expires) return false;
    return Date.now() < sessionData.expires;
  }

  // Cookie helper methods with improved error handling
  private static setCookie(name: string, value: string, hours: number): void {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (hours * 60 * 60 * 1000));
      
      // Encode the value to handle special characters and large data
      const encodedValue = encodeURIComponent(value);
      
      // Split large cookies if needed (browsers have ~4KB limit per cookie)
      const maxCookieSize = 3000; // Leave some room for other cookie attributes
      
      if (encodedValue.length > maxCookieSize) {
        // Split into multiple cookies
        const chunks = Math.ceil(encodedValue.length / maxCookieSize);
        
        // Store the number of chunks
        document.cookie = `${name}_chunks=${chunks};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
        
        // Store each chunk
        for (let i = 0; i < chunks; i++) {
          const start = i * maxCookieSize;
          const end = Math.min(start + maxCookieSize, encodedValue.length);
          const chunk = encodedValue.slice(start, end);
          document.cookie = `${name}_${i}=${chunk};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
        }
      } else {
        // Single cookie
        document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
      }
    } catch (error) {
      console.error('Error setting cookie:', error);
    }
  }

  private static getCookie(name: string): string | null {
    try {
      // Check if it's a chunked cookie
      const chunksMatch = document.cookie.match(new RegExp(`${name}_chunks=([^;]+)`));
      
      if (chunksMatch) {
        // Reconstruct from chunks
        const numChunks = parseInt(chunksMatch[1]);
        let value = '';
        
        for (let i = 0; i < numChunks; i++) {
          const chunkMatch = document.cookie.match(new RegExp(`${name}_${i}=([^;]+)`));
          if (chunkMatch) {
            value += chunkMatch[1];
          } else {
            // Missing chunk, data is corrupted
            this.deleteCookie(name);
            return null;
          }
        }
        
        return decodeURIComponent(value);
      } else {
        // Single cookie
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') c = c.substring(1, c.length);
          if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
          }
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
      // Delete main cookie
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
      
      // Check and delete chunked cookies
      const chunksMatch = document.cookie.match(new RegExp(`${name}_chunks=([^;]+)`));
      if (chunksMatch) {
        const numChunks = parseInt(chunksMatch[1]);
        
        // Delete chunk count cookie
        document.cookie = `${name}_chunks=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
        
        // Delete each chunk
        for (let i = 0; i < numChunks; i++) {
          document.cookie = `${name}_${i}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
        }
      }
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
}
