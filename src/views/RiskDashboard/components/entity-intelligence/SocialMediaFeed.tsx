import React from 'react';
import { Twitter, Globe, FileText, LoaderCircle } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { useSocialMediaData } from '../../../../hooks/useSocialMedia';


// Types
interface Tweet {
  content: string;
  url: string;
  date: string;
  username: string;
  userDisplayName?: string;
  retweetCount?: number;
  likeCount?: number;
}

interface NewsArticle {
  title: string;
  link: string;
  published: string;
  source?: string;
  description?: string;
}

interface SocialMediaData {
  tweets: Tweet[];
  news: NewsArticle[];
  searchContext: 'address' | 'beneficial_owner' | 'entity';
  searchTerm: string;
}

interface SocialMediaFeedProps {
  address: string;
  title?: string;
}

const SocialMediaFeed: React.FC<SocialMediaFeedProps> = ({ 
  address,
  title = "Social Media & News Feed"
}) => {
  const { theme } = useTheme();
  const { data, isLoading: loading, error } = useSocialMediaData(address);
  const [filter, setFilter] = React.useState<'all' | 'entity' | 'beneficial_owner' | 'address'>('all');

  // Debug logging
  console.log('SocialMediaFeed - Debug Info:', {
    address,
    loading,
    error: error?.message,
    hasData: !!data,
    addressData: data?.addressData,
    beneficialOwnerData: data?.beneficialOwnerData,
    entityData: data?.entityData
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const TweetCard: React.FC<{ tweet: Tweet }> = ({ tweet }) => (
    <div className={`p-4 rounded-lg border mb-3 ${
      theme === 'dark' 
        ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
        : 'bg-white border-gray-200 hover:bg-gray-50'
    } transition-colors duration-200`}>
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
        }`}>
          <Twitter className="text-white w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`font-semibold text-sm ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {tweet.userDisplayName || tweet.username}
            </span>
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              @{tweet.username}
            </span>
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatDate(tweet.date)}
            </span>
          </div>
          <p className={`text-sm mb-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {truncateText(tweet.content)}
          </p>
          <div className="flex items-center space-x-4 text-xs">
            {tweet.retweetCount !== undefined && (
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                🔄 {tweet.retweetCount}
              </span>
            )}
            {tweet.likeCount !== undefined && (
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                ❤️ {tweet.likeCount}
              </span>
            )}
          </div>
          <a 
            href={tweet.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`text-xs ${
              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            } hover:underline mt-2 inline-block`}
          >
            View Tweet →
          </a>
        </div>
      </div>
    </div>
  );

  const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <div className={`p-4 rounded-lg border mb-3 ${
      theme === 'dark' 
        ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
        : 'bg-white border-gray-200 hover:bg-gray-50'
    } transition-colors duration-200`}>
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          theme === 'dark' ? 'bg-green-600' : 'bg-green-500'
        }`}>
          <FileText className="text-white w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm mb-1 line-clamp-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {article.title}
          </h4>
          {article.description && (
            <p className={`text-xs mb-2 line-clamp-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {truncateText(article.description, 100)}
            </p>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {article.source && `${article.source} • `}{formatDate(article.published)}
            </span>
            <a 
              href={article.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className={theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}
            >
              Read →
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const FeedTab: React.FC<{ data: SocialMediaData | { tweets: Tweet[]; news: NewsArticle[] } }> = ({ data }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
      {/* Tweets Column */}
      <div className="space-y-2">
        <div className={`flex items-center space-x-2 mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Twitter className="text-blue-500 w-5 h-5" />
          <span className="font-semibold text-sm">Latest Tweets</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            theme === 'dark' 
              ? 'bg-blue-900/30 text-blue-300' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {data.tweets.length}
          </span>
        </div>
        <div className="overflow-y-auto h-80 pr-2">
          {data.tweets.length > 0 ? (
            data.tweets.map((tweet, index) => (
              <TweetCard key={index} tweet={tweet} />
            ))
          ) : (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Twitter className="text-2xl mb-2 opacity-50" />
              <p className="text-sm">No tweets found</p>
            </div>
          )}
        </div>
      </div>

      {/* News Column */}
      <div className="space-y-2">
        <div className={`flex items-center space-x-2 mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Globe className="text-green-500 w-5 h-5" />
          <span className="font-semibold text-sm">Latest News</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            theme === 'dark' 
              ? 'bg-green-900/30 text-green-300' 
              : 'bg-green-100 text-green-700'
          }`}>
            {data.news.length}
          </span>
        </div>
        <div className="overflow-y-auto h-80 pr-2">
          {data.news.length > 0 ? (
            data.news.map((article, index) => (
              <NewsCard key={index} article={article} />
            ))
          ) : (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Globe className="text-2xl mb-2 opacity-50" />
              <p className="text-sm">No news found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Helper to merge and sort tweets/news by date
  const getMergedFeed = () => {
    const tweets: Tweet[] = [];
    const news: NewsArticle[] = [];
    if (data?.entityData) {
      tweets.push(...data.entityData.tweets);
      news.push(...data.entityData.news);
    }
    if (data?.beneficialOwnerData) {
      tweets.push(...data.beneficialOwnerData.tweets);
      news.push(...data.beneficialOwnerData.news);
    }
    if (data?.addressData) {
      tweets.push(...data.addressData.tweets);
      news.push(...data.addressData.news);
    }
    // Remove duplicates by url/link
    const uniqueTweets = Array.from(new Map(tweets.map(t => [t.url, t])).values());
    const uniqueNews = Array.from(new Map(news.map(n => [n.link, n])).values());
    // Sort by date (desc)
    uniqueTweets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    uniqueNews.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    return { tweets: uniqueTweets, news: uniqueNews };
  };

  if (!address) {
    return (
      <div className={`rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center ${
        theme === 'dark' 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div>
          <h4 className={`text-xl font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <Globe className="mr-2 w-5 h-5" />
            {title}
          </h4>
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Globe className={`text-2xl ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            <h5 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>No Address</h5>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Enter an address to view social media and news mentions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-6 h-full ${
      theme === 'dark' 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`text-xl font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Globe className="inline-block w-5 h-5 mr-2 align-text-bottom" />
          {title}
        </h4>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          theme === 'dark' 
            ? 'bg-green-900/30 text-green-300 border border-green-700/50' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          Live Feed
        </span>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Filter:</span>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as 'all' | 'entity' | 'beneficial_owner' | 'address')}
          className={`rounded border px-2 py-1 text-sm ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
        >
          <option value="all">All</option>
          <option value="entity">Entity</option>
          <option value="beneficial_owner">Beneficial Owner</option>
          <option value="address">Address</option>
        </select>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <LoaderCircle className={`w-8 h-8 mb-3 animate-spin ${theme === 'dark' ? 'text-brand-primary' : 'text-brand-primary'}`} />
          <span className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>Loading social media data...</span>
        </div>
      ) : error ? (
        <div className={`text-center py-8 ${
          theme === 'dark' ? 'text-red-400' : 'text-red-600'
        }`}>
          <p className="text-sm mb-2">Error loading data</p>
          <p className="text-xs opacity-75">{error.message || 'Failed to fetch data'}</p>
        </div>
      ) : data && (data.addressData || data.beneficialOwnerData || data.entityData) ? (
        (() => {
          let feed: SocialMediaData | { tweets: Tweet[]; news: NewsArticle[] } | undefined;
          if (filter === 'all') {
            feed = getMergedFeed();
          } else if (filter === 'entity' && data.entityData) {
            feed = data.entityData;
          } else if (filter === 'beneficial_owner' && data.beneficialOwnerData) {
            feed = data.beneficialOwnerData;
          } else if (filter === 'address' && data.addressData) {
            feed = data.addressData;
          } else {
            feed = { tweets: [], news: [] };
          }
          return <FeedTab data={feed} />;
        })()
      ) : (
        <div className={`text-center py-8 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <Globe className="w-8 h-8 mb-2 opacity-50 mx-auto" />
          <p className="text-sm">No social media data found</p>
          <p className="text-xs mt-1">Try searching for a different address</p>
        </div>
      )}
    </div>
  );
};

export default SocialMediaFeed; 