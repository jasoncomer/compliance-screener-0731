import React, { useEffect, useRef, useState } from 'react';
import { Card, Typography, Empty, Tag, Spin } from 'antd';
import { TwitterOutlined } from '@ant-design/icons';

const { Title } = Typography;

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
      <Card className="bg-gray-800 rounded-2xl border-gray-700">
        <Title level={5} className="text-white mb-4">
          <TwitterOutlined /> {title}
        </Title>
        <Empty
          image={<TwitterOutlined style={{ fontSize: 40, color: '#6b7280' }} />}
          description={
            <span className="text-gray-500">
              No Twitter handle available for this entity
            </span>
          }
          className="text-gray-500"
        />
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 rounded-2xl border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <Title level={5} className="text-white mb-0">
          <TwitterOutlined /> {title}
        </Title>
        <Tag color="green" className="text-xs">
          Live Feed
        </Tag>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spin size="large" />
          <span className="ml-3 text-gray-500">Loading tweets...</span>
        </div>
      ) : (
        <div 
          ref={containerRef} 
          className="twitter-timeline-container"
          style={{ maxHeight: '600px', overflowY: 'auto' }}
        />
      )}
    </Card>
  );
};

export default TwitterTimeline; 