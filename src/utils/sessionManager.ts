import { v4 as uuidv4 } from 'uuid';

export class SessionManager {
  private static SESSION_KEY = 'blastari_session_id';
  private static SESSION_DATA_KEY = 'blastari_session_data';

  static getSessionId(): string {
    let sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  static setSessionData(key: string, data: any): void {
    const sessionId = this.getSessionId();
    const sessionKey = `${this.SESSION_DATA_KEY}_${sessionId}_${key}`;
    localStorage.setItem(sessionKey, JSON.stringify(data));
  }

  static getSessionData(key: string): any {
    const sessionId = this.getSessionId();
    const sessionKey = `${this.SESSION_DATA_KEY}_${sessionId}_${key}`;
    const data = localStorage.getItem(sessionKey);
    return data ? JSON.parse(data) : null;
  }

  static clearSessionData(key?: string): void {
    const sessionId = this.getSessionId();
    if (key) {
      const sessionKey = `${this.SESSION_DATA_KEY}_${sessionId}_${key}`;
      localStorage.removeItem(sessionKey);
    } else {
      // Clear all session data for current session
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.startsWith(`${this.SESSION_DATA_KEY}_${sessionId}`)) {
          localStorage.removeItem(storageKey);
        }
      });
    }
  }

  static createNewSession(): string {
    const newSessionId = uuidv4();
    localStorage.setItem(this.SESSION_KEY, newSessionId);
    return newSessionId;
  }

  // Clear chat data for all websites except the specified one
  static clearOtherWebsiteChats(currentWebsiteUrl: string): void {
    const sessionId = this.getSessionId();
    Object.keys(localStorage).forEach(storageKey => {
      if (storageKey.startsWith(`${this.SESSION_DATA_KEY}_${sessionId}_chat_`)) {
        try {
          const chatData = JSON.parse(localStorage.getItem(storageKey) || '{}');
          if (chatData.websiteUrl && chatData.websiteUrl !== currentWebsiteUrl) {
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          // If we can't parse the data, remove it to keep storage clean
          localStorage.removeItem(storageKey);
        }
      }
    });
  }
}
