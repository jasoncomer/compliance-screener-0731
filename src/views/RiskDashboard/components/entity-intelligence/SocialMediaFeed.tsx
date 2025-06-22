import React from 'react';
import { Card, Typography, Empty, Tag, Spin, Alert } from 'antd';
import { TwitterOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface SocialMediaPost {
  id: string;
  user: string;
  text: string;
  time: string;
  likes: number;
  retweets: number;
  replies: number;
  platform?: 'twitter' | 'other';
}

interface SocialMediaFeedProps {
  posts: SocialMediaPost[];
  isRealData?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isMockData?: boolean;
  title?: string;
}

const SocialMediaFeed: React.FC<SocialMediaFeedProps> = ({ 
  posts, 
  isRealData = false, 
  loading = false, 
  error = null,
  onRetry,
  isMockData,
  title = "Social Media Feed"
}) => {
  if (loading) {
    return (
      <Card className="bg-gray-800 rounded-2xl border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            <TwitterOutlined /> {title}
          </Title>
          {isRealData && !isMockData && (
            <Tag color="green" className="text-xs">
              Real Data
            </Tag>
          )}
          {isMockData && (
            <Tag color="orange" className="text-xs">
              Mock Data
            </Tag>
          )}
        </div>
        <div className="flex justify-center items-center py-8">
          <Spin size="large" />
          <span className="ml-3 text-gray-500">Fetching posts...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800 rounded-2xl border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            <TwitterOutlined /> {title}
          </Title>
          {isRealData && !isMockData && (
            <Tag color="green" className="text-xs">
              Real Data
            </Tag>
          )}
          {isMockData && (
            <Tag color="orange" className="text-xs">
              Mock Data
            </Tag>
          )}
        </div>
        <Alert
          message="Error fetching posts"
          description={error}
          type="error"
          showIcon
          action={
            onRetry && (
              <button 
                onClick={onRetry}
                className="text-blue-500 hover:text-blue-400 flex items-center"
              >
                <ReloadOutlined className="mr-1" />
                Retry
              </button>
            )
          }
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
        {isRealData && !isMockData && (
          <Tag color="green" className="text-xs">
            Real Data
          </Tag>
        )}
        {isMockData && (
          <Tag color="orange" className="text-xs">
            Mock Data
          </Tag>
        )}
      </div>
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.id} className="mb-4 text-gray-500">
            <div className="text-white font-semibold">
              @{post.user} <span className="text-gray-500 font-normal text-xs">· {post.time}</span>
            </div>
            <div className="my-1">{post.text}</div>
            <div className="text-xs text-gray-500">
              💬 {post.replies}  🔁 {post.retweets}  ❤️ {post.likes}
            </div>
          </div>
        ))
      ) : (
        <Empty
          image={<TwitterOutlined style={{ fontSize: 40, color: '#6b7280' }} />}
          description={
            <span className="text-gray-500">
              {isRealData ? 'No recent posts available for this entity' : 'No posts available'}
            </span>
          }
          className="text-gray-500"
        />
      )}
    </Card>
  );
};

export default SocialMediaFeed; 