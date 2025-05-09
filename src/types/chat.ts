
export type MessageType = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

export type ChannelType = {
  id: string;
  name: string;
  description: string;
  messages: MessageType[];
};
