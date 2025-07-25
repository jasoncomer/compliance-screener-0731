import React from 'react';
import { Globe, FileText, LoaderCircle, Twitter } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { useSocialMediaData } from '../../../../hooks/useSocialMedia';

// Types
interface NewsArticle {
  title: string;
  link: string;
  published: string;
  source?: string;
  description?: string;
  logoUrl?: string; // Add logoUrl for type safety
}

interface Tweet {
  content: string;
  url: string;
  date: string;
  username: string;
  userDisplayName?: string;
  retweetCount?: number;
  likeCount?: number;
}

interface NewsData {
  news: NewsArticle[];
  tweets: Tweet[];
  searchContext: 'address' | 'beneficial_owner' | 'entity' | 'all';
  searchTerm: string;
}

interface NewsFeedProps {
  address: string;
  title?: string;
  maxHeight?: number;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ 
  address,
  title = "News & Social Media Feed",
  maxHeight
}) => {
  const { theme } = useTheme();
  const { data, isLoading: loading, error } = useSocialMediaData(address);
  const [filter, setFilter] = React.useState<'all' | 'entity' | 'beneficial_owner' | 'address'>('all');

  // Debug logging
  console.log('NewsFeed - Debug Info:', {
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

  const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <div className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start space-x-3">
        {article.logoUrl ? (
          <img
            src={article.logoUrl}
            alt="News source logo"
            className="w-8 h-8 rounded-full object-cover bg-white border"
            style={{ minWidth: 32, minHeight: 32 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-green-600' : 'bg-green-500'
          }`}>
            <FileText className="text-white w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`font-semibold text-sm ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {article.source || 'News Source'}
            </span>
          </div>
          <h4 className={`font-medium text-sm mb-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <a 
              href={article.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {truncateText(article.title, 120)}
            </a>
          </h4>
          {article.description && (
            <p className={`text-sm mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {truncateText(article.description, 100)}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatDate(article.published)}
            </span>
            <a 
              href={article.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-xs ${
                theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              } hover:underline`}
            >
              Read More →
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const TweetCard: React.FC<{ tweet: Tweet }> = ({ tweet }) => (
    <div className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
        }`}>
          <Twitter className="text-white w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`font-semibold text-sm ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              @{tweet.userDisplayName || tweet.username}
            </span>
          </div>
          <p className={`text-sm mb-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {truncateText(tweet.content, 120)}
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatDate(tweet.date)}
            </span>
            <a 
              href={tweet.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-xs ${
                theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              } hover:underline`}
            >
              View Tweet →
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const FeedTab: React.FC<{ data: NewsData; maxHeight?: number }> = ({ data, maxHeight }) => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Tweets Column */}
        <div className="flex flex-col border rounded-lg overflow-hidden">
          <h4 className={`font-semibold text-sm p-3 border-b flex-shrink-0 flex items-center ${
            theme === 'dark' ? 'text-white border-gray-600 bg-gray-800' : 'text-gray-900 border-gray-200 bg-gray-50'
          }`}>
            <Twitter className="w-4 h-4 mr-2" />
            Latest Tweets ({data.tweets.length})
          </h4>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 min-h-0" style={maxHeight ? { maxHeight: maxHeight - 56 - 48 - 16 - 12 } : {}}>
            {/* 56px = h4 header height (p-3 + border), 48px = container padding (p-6 top + p-6 bottom), 16px = title mb-4, 12px = filter mb-3 */}
            {data.tweets.length === 0 ? (
              <div className={`text-center py-8 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Twitter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No tweets found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.tweets.map((tweet, index) => (
                  <TweetCard key={`${tweet.url}-${index}`} tweet={tweet} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Latest News Column */}
        <div className="flex flex-col border rounded-lg overflow-hidden">
          <h4 className={`font-semibold text-sm p-3 border-b flex-shrink-0 flex items-center ${
            theme === 'dark' ? 'text-white border-gray-600 bg-gray-800' : 'text-gray-900 border-gray-200 bg-gray-50'
          }`}>
            <Globe className="w-4 h-4 mr-2" />
            Latest News ({data.news.length})
          </h4>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 min-h-0" style={maxHeight ? { maxHeight: maxHeight - 56 - 48 - 16 - 12 } : {}}>
            {/* 56px = h4 header height (p-3 + border), 48px = container padding (p-6 top + p-6 bottom), 16px = title mb-4, 12px = filter mb-3 */}
            {data.news.length === 0 ? (
              <div className={`text-center py-8 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No news articles found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.news.map((article, index) => (
                  <NewsCard key={`${article.link}-${index}`} article={article} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getFilteredData = () => {
    if (!data) return null;

    switch (filter) {
      case 'address':
        return data.addressData;
      case 'beneficial_owner':
        return data.beneficialOwnerData;
      case 'entity':
        return data.entityData;
      case 'all':
      default:
        // Merge all available data
        const allNews: NewsArticle[] = [];
        
        if (data.addressData) {
          allNews.push(...data.addressData.news);
        }
        if (data.beneficialOwnerData) {
          allNews.push(...data.beneficialOwnerData.news);
        }
        if (data.entityData) {
          allNews.push(...data.entityData.news);
        }

        // Remove duplicates based on link
        const uniqueNews = allNews.filter((article, index, self) => 
          index === self.findIndex(a => a.link === article.link)
        );

        // Also merge tweets
        const allTweets: Tweet[] = [];
        
        if (data.addressData) {
          allTweets.push(...data.addressData.tweets);
        }
        if (data.beneficialOwnerData) {
          allTweets.push(...data.beneficialOwnerData.tweets);
        }
        if (data.entityData) {
          allTweets.push(...data.entityData.tweets);
        }

        // Remove duplicate tweets based on URL
        const uniqueTweets = allTweets.filter((tweet, index, self) => 
          index === self.findIndex(t => t.url === tweet.url)
        );

        return {
          news: uniqueNews,
          tweets: uniqueTweets,
          searchContext: 'all' as const,
          searchTerm: 'all'
        };
    }
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-center py-8">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-500" />
          <span className={`ml-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Loading news...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="text-center py-8">
          <div className={`text-red-500 mb-2 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-600'
          }`}>
            Error loading news
          </div>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'address', label: 'Address' },
              { key: 'beneficial_owner', label: 'Beneficial Owner' },
              { key: 'entity', label: 'Entity' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  filter === key
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        {filteredData ? (
          <FeedTab data={filteredData} maxHeight={maxHeight} />
        ) : (
          <div className={`text-center py-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No news data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed; 