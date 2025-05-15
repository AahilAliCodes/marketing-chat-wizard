
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'BLASTari';
  content: string;
  timestamp: Date;
}
