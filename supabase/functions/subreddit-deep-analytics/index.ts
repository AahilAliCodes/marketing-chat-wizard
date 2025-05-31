
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID');
const REDDIT_SECRET_KEY = Deno.env.get('REDDIT_SECRET_KEY');

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { subreddit } = await req.json();

    if (!REDDIT_CLIENT_ID || !REDDIT_SECRET_KEY) {
      throw new Error('Reddit API credentials not configured');
    }

    console.log('Fetching deep analytics for subreddit:', subreddit);

    // Get Reddit access token
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${REDDIT_CLIENT_ID}:${REDDIT_SECRET_KEY}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Subreddit Deep Analytics Script by /u/smartkid18'
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Get recent posts (last 500 posts for better analysis)
    const postsResponse = await fetch(`https://oauth.reddit.com/r/${subreddit}/new?limit=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Subreddit Deep Analytics Script by /u/smartkid18'
      }
    });
    const postsData = await postsResponse.json();
    const posts = postsData.data?.children || [];

    if (posts.length === 0) {
      throw new Error('No posts found for this subreddit');
    }

    // 1. Post Volume (posts per day)
    const now = Date.now() / 1000;
    const oneDayAgo = now - (24 * 60 * 60);
    const oneWeekAgo = now - (7 * 24 * 60 * 60);
    
    const postsLastDay = posts.filter((post: any) => post.data.created_utc > oneDayAgo).length;
    const postsLastWeek = posts.filter((post: any) => post.data.created_utc > oneWeekAgo).length;
    const postVolume = {
      daily: postsLastDay,
      weekly: postsLastWeek,
      total: posts.length
    };

    // 2. Average Upvotes per Post
    const totalUpvotes = posts.reduce((sum: number, post: any) => sum + (post.data.score || 0), 0);
    const avgUpvotes = posts.length > 0 ? Math.round(totalUpvotes / posts.length) : 0;

    // 3. Average Comments per Post
    const totalComments = posts.reduce((sum: number, post: any) => sum + (post.data.num_comments || 0), 0);
    const avgComments = posts.length > 0 ? Math.round(totalComments / posts.length) : 0;

    // 4. Top Posters
    const posterCounts: { [key: string]: number } = {};
    posts.forEach((post: any) => {
      const author = post.data.author;
      if (author && author !== '[deleted]') {
        posterCounts[author] = (posterCounts[author] || 0) + 1;
      }
    });
    const topPosters = Object.entries(posterCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([author, count]) => ({ author, posts: count }));

    // 5. Top Commenters (estimated from post engagement)
    const commenterEngagement: { [key: string]: number } = {};
    posts.forEach((post: any) => {
      const author = post.data.author;
      if (author && author !== '[deleted]') {
        commenterEngagement[author] = (commenterEngagement[author] || 0) + (post.data.num_comments || 0);
      }
    });
    const topCommenters = Object.entries(commenterEngagement)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([author, engagement]) => ({ author, engagement: Math.round(engagement) }));

    // 6. Average Upvote Ratio
    const upvoteRatios = posts.map((post: any) => post.data.upvote_ratio || 0).filter(ratio => ratio > 0);
    const avgUpvoteRatio = upvoteRatios.length > 0 ? 
      Math.round((upvoteRatios.reduce((sum, ratio) => sum + ratio, 0) / upvoteRatios.length) * 100) : 0;

    // 7. Post Karma Distribution
    const karmaRanges = {
      low: posts.filter((post: any) => post.data.score < 10).length,
      medium: posts.filter((post: any) => post.data.score >= 10 && post.data.score < 100).length,
      high: posts.filter((post: any) => post.data.score >= 100 && post.data.score < 1000).length,
      viral: posts.filter((post: any) => post.data.score >= 1000).length
    };

    // 8. Flair Distribution
    const flairCounts: { [key: string]: number } = {};
    posts.forEach((post: any) => {
      const flair = post.data.link_flair_text || 'No Flair';
      flairCounts[flair] = (flairCounts[flair] || 0) + 1;
    });
    const flairDistribution = Object.entries(flairCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([flair, count]) => ({ flair, count }));

    // 9. Active Hours (Post Timing)
    const hourCounts: { [key: number]: number } = {};
    posts.forEach((post: any) => {
      const date = new Date(post.data.created_utc * 1000);
      const hour = date.getUTCHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0];
    const activeHours = {
      peakHour: peakHour ? parseInt(peakHour[0]) : 0,
      distribution: Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour)
    };

    // 10. Top Keywords
    const words: string[] = [];
    posts.forEach((post: any) => {
      if (post.data.title) {
        const titleWords = post.data.title.toLowerCase().match(/\b\w+\b/g) || [];
        words.push(...titleWords);
      }
    });

    const stopwords = new Set(['the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'with', 'by', 'at', 'an', 'this', 'that', 'it', 'from', 'are', 'was', 'be', 'or', 'as', 'but', 'not', 'can', 'will', 'have', 'has', 'had', 'my', 'me', 'i', 'you', 'your', 'we', 'our', 'they', 'their', 'he', 'she', 'his', 'her']);
    const filtered = words.filter(w => !stopwords.has(w) && w.length > 2);
    
    const wordCounts: { [key: string]: number } = {};
    filtered.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const topKeywords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    const analytics = {
      subreddit,
      postVolume,
      avgUpvotes,
      avgComments,
      topPosters,
      topCommenters,
      avgUpvoteRatio,
      karmaDistribution: karmaRanges,
      flairDistribution,
      activeHours,
      topKeywords,
      generatedAt: new Date().toISOString()
    };

    console.log('Deep analytics generated successfully for:', subreddit);

    return new Response(JSON.stringify({ analytics }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in subreddit-deep-analytics function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
