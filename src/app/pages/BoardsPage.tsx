import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, MessageSquare, Calendar, Plus, Users, Pin, MessageCircle } from 'lucide-react';
import { useData, PostType, Post } from '../contexts/DataContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
// import { Button } from '../components/ui/button'; // Unused
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CreatePostModal } from '../components/CreatePostModal';
import { EditPostModal } from '../components/EditPostModal';
import { PostDetailModal } from '../components/PostDetailModal';
import { EmptyState } from '../components/EmptyState';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { toast } from 'sonner';

import { useAuth } from '../contexts/AuthContext'; // Import Added

export const BoardsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { posts, deletePost } = useData();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPostType, setCreatePostType] = useState<PostType>('free');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<'notice' | 'free' | 'event'>('notice');

  // Filter posts by type
  const notices = posts.filter(p => p.type === 'notice').sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const freePosts = posts.filter(p => p.type === 'free');
  // μATOM-0535: 이벤트 리스트 정렬/표시 고정(startAt)
  const eventPosts = posts
    .filter(p => p.type === 'event')
    .sort((a, b) => {
      // startAt 기준 오름차순 (다가오는 일정이 먼저)
      const aTime = a.startAt?.getTime() || 0;
      const bTime = b.startAt?.getTime() || 0;
      return aTime - bTime;
    });

  const handleCreatePost = (type: PostType) => {
    setCreatePostType(type);
    setCreateModalOpen(true);
  };

  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'notice' | 'free' | 'event')} className="w-full">
          <TabsList className="w-full sticky top-14 z-30 bg-white dark:bg-gray-900 border-b grid grid-cols-3 h-auto p-0">
            <TabsTrigger value="notice" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <Bell className="w-4 h-4" />
              <span className="text-xs">공지</span>
            </TabsTrigger>
            <TabsTrigger value="free" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs">자유</span>
            </TabsTrigger>
            <TabsTrigger value="event" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">연습·시합</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notice" className="p-4 space-y-3 mt-0">
            <PostList
              posts={notices}
              type="notice"
              onPostClick={(post) => setSelectedPost(post)}
            />
          </TabsContent>

          <TabsContent value="free" className="p-4 space-y-3 mt-0">
            <PostList
              posts={freePosts}
              type="free"
              onPostClick={(post) => setSelectedPost(post)}
            />
          </TabsContent>

          <TabsContent value="event" className="p-4 space-y-3 mt-0">
            <PostList
              posts={eventPosts}
              type="event"
              onPostClick={(post) => setSelectedPost(post)}
            />
          </TabsContent>
        </Tabs>

        {/* FAB - Create Post (Tab-based visibility) */}
        {/* 공지/연습·시합: adminLike만 버튼 노출 */}
        {/* 자유: 멤버면 버튼 노출 */}
        {((activeTab === 'notice' || activeTab === 'event') && isAdmin() && user?.status === 'active') ||
         (activeTab === 'free' && user?.status === 'active') ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
            onClick={() => handleCreatePost(activeTab === 'free' ? 'free' : activeTab === 'notice' ? 'notice' : 'event')}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        ) : null}

        {/* Pending User Notice */}
        {user?.status === 'pending' && (
          <div className="fixed bottom-24 right-4 bg-gray-800 text-white text-xs px-3 py-2 rounded-full shadow-lg opacity-80 z-40">
            가입 승인 대기중 (글쓰기 제한)
          </div>
        )}

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          defaultType={createPostType}
        />

        {/* Edit Post Modal */}
        {editingPost && (
          <EditPostModal
            post={editingPost}
            isOpen={editingPost !== null}
            onClose={() => setEditingPost(null)}
          />
        )}

        {/* Post Detail Modal */}
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            isOpen={selectedPost !== null}
            onClose={() => setSelectedPost(null)}
            onEdit={(post) => {
              setSelectedPost(null);
              setEditingPost(post);
            }}
            onDelete={async () => {
              if (selectedPost) {
                await deletePost(selectedPost.id);
                toast.success('게시글이 삭제되었습니다');
              }
              setSelectedPost(null);
            }}
          />
        )}

      </div>
    </div>
  );
};

// Post List Component
const PostList: React.FC<{ posts: any[]; type: PostType; onPostClick: (post: Post) => void }> = ({ posts, type, onPostClick }) => {
  if (posts.length === 0) {
    return (
      <EmptyState 
        type="empty" 
        message="게시글이 없습니다"
      />
    );
  }

  return (
    <>
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} index={index} type={type} onPostClick={onPostClick} />
      ))}
    </>
  );
};

// Post Card Component
const PostCard: React.FC<{ post: any; index: number; type: PostType; onPostClick: (post: Post) => void }> = ({ post, index, type, onPostClick }) => {
  const getTypeInfo = () => {
    switch (type) {
      case 'notice':
        return { icon: Bell, color: 'from-red-500 to-orange-500', label: '공지' };
      case 'free':
        return { icon: MessageSquare, color: 'from-blue-500 to-blue-600', label: '자유' };
      case 'event':
        return { icon: Users, color: 'from-green-500 to-green-600', label: '이벤트' };
      default:
        return { icon: MessageSquare, color: 'from-gray-500 to-gray-600', label: '게시글' };
    }
  };

  const { icon: Icon, color, label } = getTypeInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      onClick={() => onPostClick(post)}
    >
      <Card className="p-4 hover:shadow-lg transition-all cursor-pointer">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 bg-gradient-to-br ${color} rounded-lg text-white flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={type === 'notice' ? 'default' : 'secondary'} className={type === 'notice' ? 'bg-red-500' : ''}>
                {label}
              </Badge>
              {post.pinned && (
                <Badge variant="outline" className="text-xs">
                  <Pin className="w-3 h-3 mr-1" />
                  고정
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
              {post.title}
            </h3>

            {/* Content Preview */}
            {post.content && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {post.content}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{post.author.name}</span>
              <span>•</span>
              <span>{format(post.createdAt, 'M월 d일', { locale: ko })}</span>
              {post.commentCount && post.commentCount > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <MessageCircle className="w-3 h-3" />
                    {post.commentCount}
                  </span>
                </>
              )}
            </div>


            {/* Push Status (Notice) */}
            {type === 'notice' && post.pushStatus && (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${post.pushStatus === 'SENT'
                    ? 'text-green-600 border-green-300'
                    : post.pushStatus === 'FAILED'
                      ? 'text-red-600 border-red-300'
                      : 'text-yellow-600 border-yellow-300'
                    }`}
                >
                  푸시: {post.pushStatus === 'SENT' ? '발송완료' : post.pushStatus === 'FAILED' ? '발송실패' : '발송중'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};