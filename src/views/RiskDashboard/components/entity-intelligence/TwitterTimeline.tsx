import React, { useEffect, useRef, useState } from 'react';

import { TwitterOutlined } from '@ant-design/icons';

import { useTheme } from '../../../../context/ThemeContext';

interface TwitterTimelineProps {
  username: string | null;
  title?: string;
}

declare global {
  interface Window {
    twttr: any;
  }
}

const TwitterTimeline: React.FC<TwitterTimelineProps> = ({ 
  username,
  title = "Twitter Feed"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const loadTwitterScript = () => {
      return new Promise<void>((resolve) => {
        if (window.twttr) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };

    const embedTweets = async () => {
      if (!username || !containerRef.current) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await loadTwitterScript();

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create container for tweets
        const tweetsContainer = document.createElement('div');
        tweetsContainer.className = 'tweets-container space-y-4';
        containerRef.current.appendChild(tweetsContainer);

        // Create embedded tweets using blockquote approach
        const cleanUsername = username.replace('@', '');
        const userUrl = `https://twitter.com/${cleanUsername}`;
        
        // This creates a blockquote for the user's timeline
        tweetsContainer.innerHTML = `
          <blockquote class="twitter-tweet" data-theme="dark" data-cards="hidden">
            <a href="${userUrl}"></a>
          </blockquote>
          <blockquote class="twitter-tweet" data-theme="dark" data-cards="hidden">
            <a href="${userUrl}"></a>
          </blockquote>
          <blockquote class="twitter-tweet" data-theme="dark" data-cards="hidden">
            <a href="${userUrl}"></a>
          </blockquote>
        `;

        // Load the widgets
        if (window.twttr?.widgets) {
          await window.twttr.widgets.load(containerRef.current);
        }
      } catch (error) {
        console.error('Error loading tweets:', error);
      } finally {
        setLoading(false);
      }
    };

    embedTweets();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [username]);

  if (!username) {
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
            <TwitterOutlined className="mr-2" />
            {title}
          </h4>
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <TwitterOutlined className={`text-2xl ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            <h5 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>No Twitter Feed</h5>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No Twitter handle available for this entity
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
          <TwitterOutlined className="mr-2" />
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
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3 ${
            theme === 'dark' ? 'border-brand-primary' : 'border-brand-primary'
          }`}></div>
          <span className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>Loading tweets...</span>
        </div>
      ) : (
        <div 
          ref={containerRef} 
          className="twitter-timeline-container"
          style={{ maxHeight: '600px', overflowY: 'auto' }}
        />
      )}
    </div>
  );
};

export default TwitterTimeline; 