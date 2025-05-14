
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useToast } from '@/hooks/use-toast';
import { type RedditPost } from './RedditPostGenerator';

interface RedditPostsDisplayProps {
  posts: RedditPost[];
}

const RedditPostsDisplay: React.FC<RedditPostsDisplayProps> = ({ posts }) => {
  const { toast } = useToast();
  
  const handleCopyText = (post: RedditPost) => {
    navigator.clipboard.writeText(`${post.title}\n\n${post.content}`);
    toast({
      title: "Copied to clipboard",
      description: "Post text copied to clipboard"
    });
  };
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No posts generated yet. Click "Generate Reddit Posts" to create some.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">u/{post.subreddit}</div>
                <CardTitle className="text-lg font-semibold mt-1">{post.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {post.imageUrl && (
              <div className="mb-3">
                <AspectRatio ratio={16/9} className="bg-gray-100 rounded-md overflow-hidden">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
              </div>
            )}
            
            <p className="text-gray-700 text-sm line-clamp-3">{post.content}</p>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-2 border-t">
            <div className="text-xs text-gray-500">
              Generated {new Date(post.dateGenerated).toLocaleDateString()}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleCopyText(post)}
              className="text-xs"
            >
              Copy Text
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default RedditPostsDisplay;
