
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
      this.setCookie(`${this.SESSION_KEY}_id`, sessionId, this.SESSION_EXPIRY_HOURS);
    }
    return sessionId;
  }

  // Generate a unique session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set session data with expiry (both localStorage and cookies)
  static setSessionData(key: string, data: any): void {
    const sessionData = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    
    const serializedData = JSON.stringify(sessionData);
    
    // Store in localStorage
    localStorage.setItem(`${this.SESSION_KEY}_${key}`, serializedData);
    
    // Also save to cookies for persistence across sessions
    this.setCookie(`${this.SESSION_KEY}_${key}`, serializedData, this.SESSION_EXPIRY_HOURS);
  }

  // Get session data (check both localStorage and cookies with fallback)
  static getSessionData(key: string): any {
    // First try localStorage
    const localData = localStorage.getItem(`${this.SESSION_KEY}_${key}`);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (this.isDataValid(parsed)) {
          // Also update cookie to extend expiry
          this.setCookie(`${this.SESSION_KEY}_${key}`, localData, this.SESSION_EXPIRY_HOURS);
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
          // Restore to localStorage
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

  // Remove session data (both localStorage and cookies)
  static removeSessionData(key: string): void {
    localStorage.removeItem(`${this.SESSION_KEY}_${key}`);
    this.deleteCookie(`${this.SESSION_KEY}_${key}`);
  }

  // Clear all session data (both localStorage and cookies)
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
      }
    });

    // Also clear cookies for other website chats
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const trimmedName = name.trim();
      if (trimmedName.startsWith(`${this.SESSION_KEY}_chat_`) && !trimmedName.includes(currentWebsiteUrl)) {
        this.deleteCookie(trimmedName);
      }
    });
  }

  // Check if data is still valid
  private static isDataValid(sessionData: any): boolean {
    if (!sessionData.expires) return false;
    return Date.now() < sessionData.expires;
  }

  // Enhanced cookie helper methods with better persistence
  private static setCookie(name: string, value: string, hours: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (hours * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure`;
  }

  private static getCookie(name: string): string | null {
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
  }

  private static deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax;Secure`;
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

  // Enhanced methods for subreddit and posts persistence
  static setSubredditAnalytics(websiteUrl: string, data: any): void {
    this.setSessionData(`analytics_${websiteUrl}`, data);
  }

  static getSubredditAnalytics(websiteUrl: string): any {
    return this.getSessionData(`analytics_${websiteUrl}`);
  }

  static setRedditPosts(websiteUrl: string, data: any): void {
    this.setSessionData(`posts_${websiteUrl}`, data);
  }

  static getRedditPosts(websiteUrl: string): any {
    return this.getSessionData(`posts_${websiteUrl}`);
  }

  static clearWebsiteData(websiteUrl: string): void {
    this.removeSessionData(`analytics_${websiteUrl}`);
    this.removeSessionData(`posts_${websiteUrl}`);
  }
}
