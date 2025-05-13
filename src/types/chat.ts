export type MessageType = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  previousMessage?: string;
};

export type ChannelType = {
  id: string;
  name: string;
  description: string;
  messages: MessageType[];
};
