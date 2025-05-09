
import { ChannelType } from "@/types/chat";

export const defaultChannels: ChannelType[] = [
  {
    id: 'channel-1',
    name: 'Social Media',
    description: 'Generate content for social media campaigns',
    messages: [
      {
        id: 'msg-1-1',
        content: 'Welcome to the Social Media channel! Here you can get help with creating engaging posts, ads, and campaign ideas for platforms like Facebook, Instagram, Twitter, and LinkedIn.',
        role: 'assistant',
        timestamp: new Date()
      }
    ]
  },
  {
    id: 'channel-2',
    name: 'Blog Content',
    description: 'Create blog posts and articles',
    messages: [
      {
        id: 'msg-2-1',
        content: 'Welcome to the Blog Content channel! Here you can get help with drafting articles, blog posts, SEO optimization, and content planning for your website or publication.',
        role: 'assistant',
        timestamp: new Date()
      }
    ]
  },
  {
    id: 'channel-3',
    name: 'Email Marketing',
    description: 'Design email campaigns and newsletters',
    messages: [
      {
        id: 'msg-3-1',
        content: 'Welcome to the Email Marketing channel! Here you can get help with crafting newsletters, drip campaigns, subject lines, and other email marketing content that converts.',
        role: 'assistant',
        timestamp: new Date()
      }
    ]
  }
];
