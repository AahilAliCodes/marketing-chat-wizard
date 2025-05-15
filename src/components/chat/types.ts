
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'BLASTari';
  content: string;
  timestamp: Date;
}

export interface ChatHistory {
  website_url: string;
  user_prompt: string;
  ai_response: string;
  created_at: Date;
}
