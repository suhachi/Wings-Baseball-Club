import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, MessageSquare, Calendar, Users, BarChart3, Trophy, Plus, Pin, MessageCircle } from 'lucide-react';
import { useData, PostType, Post } from '../contexts/DataContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CreatePostModal } from '../components/CreatePostModal';
import { EditPostModal } from '../components/EditPostModal';
import { PostDetailModal } from '../components/PostDetailModal';
import { PollVoteModal } from '../components/PollVoteModal';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { toast } from 'sonner';

export const BoardsPage: React.FC = () => {
  const { posts, deletePost } = useData();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPostType, setCreatePostType] = useState<PostType>('free');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<Post | null>(null);

  // Filter posts by type
  const notices = posts.filter(p => p.type === 'notice').sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const freePosts = posts.filter(p => p.type === 'free');
  const meetupPosts = posts.filter(p => p.type === 'meetup');
  const polls = posts.filter(p => p.type === 'poll');
  const games = posts.filter(p => p.type === 'game');

  const handleCreatePost = (type: PostType) => {
    setCreatePostType(type);
    setCreateModalOpen(true);
  };

  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto">
        <Tabs defaultValue="notice" className="w-full">
          <TabsList className="w-full sticky top-14 z-30 bg-white dark:bg-gray-900 border-b grid grid-cols-5 h-auto p-0">
            <TabsTrigger value="notice" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <Bell className="w-4 h-4" />
              <span className="text-xs">공지</span>
            </TabsTrigger>
            <TabsTrigger value="free" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs">자유</span>
            </TabsTrigger>
            <TabsTrigger value="meetup" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <Users className="w-4 h-4" />
              <span className="text-xs">기타</span>
            </TabsTrigger>
            <TabsTrigger value="poll" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">투표</span>
            </TabsTrigger>
            <TabsTrigger value="game" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <Trophy className="w-4 h-4" />
              <span className="text-xs">경기</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notice" className="p-4 space-y-3 mt-0">
            <PostList
              posts={notices}
              type="notice"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>

          <TabsContent value="free" className="p-4 space-y-3 mt-0">
            <PostList
              posts={freePosts}
              type="free"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>

          <TabsContent value="meetup" className="p-4 space-y-3 mt-0">
            <PostList
              posts={meetupPosts}
              type="meetup"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>

          <TabsContent value="poll" className="p-4 space-y-3 mt-0">
            <PostList
              posts={polls}
              type="poll"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>

          <TabsContent value="game" className="p-4 space-y-3 mt-0">
            <PostList
              posts={games}
              type="game"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>
        </Tabs>

        {/* FAB - Create Post */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
          onClick={() => handleCreatePost('free')}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>

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

      {/* Poll Vote Modal */}
      {selectedPoll && (
        <PollVoteModal
          poll={selectedPoll}
          isOpen={selectedPoll !== null}
          onClose={() => setSelectedPoll(null)}
        />
      )}
    </div>
  );
};

// Post List Component
const PostList: React.FC<{ posts: any[]; type: PostType; onPostClick: (post: Post) => void; onPollClick: (post: Post) => void }> = ({ posts, type, onPostClick, onPollClick }) => {
  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500">
        게시글이 없습니다
      </Card>
    );
  }

  return (
    <>
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} index={index} type={type} onPostClick={onPostClick} onPollClick={onPollClick} />
      ))}
    </>
  );
};

// Post Card Component
const PostCard: React.FC<{ post: any; index: number; type: PostType; onPostClick: (post: Post) => void; onPollClick: (post: Post) => void }> = ({ post, index, type, onPostClick, onPollClick }) => {
  const getTypeInfo = () => {
    switch (type) {
      case 'notice':
        return { icon: Bell, color: 'from-red-500 to-orange-500', label: '공지' };
      case 'free':
        return { icon: MessageSquare, color: 'from-blue-500 to-blue-600', label: '자유' };
      case 'meetup':
        return { icon: Users, color: 'from-green-500 to-green-600', label: '기타' };
      case 'poll':
        return { icon: BarChart3, color: 'from-purple-500 to-purple-600', label: '투표' };
      case 'game':
        return { icon: Trophy, color: 'from-yellow-500 to-orange-500', label: '경기' };
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
      onClick={() => {
        if (type === 'poll') {
          onPollClick(post);
        } else {
          onPostClick(post);
        }
      }}
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
              {type === 'poll' && post.closed && (
                <Badge variant="outline" className="text-xs">마감</Badge>
              )}
              {type === 'game' && post.recordingLocked && (
                <Badge variant="outline" className="text-xs">🔒 LOCK</Badge>
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

            {/* Poll specific */}
            {type === 'poll' && post.choices && (
              <div className="mt-3 space-y-1">
                {post.choices.slice(0, 2).map((choice: any) => (
                  <div key={choice.id} className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center px-2 text-xs text-white"
                        style={{
                          width: `${Math.max((choice.count / 20) * 100, 10)}%`
                        }}
                      >
                        {choice.label}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
                      {choice.count}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Game specific */}
            {type === 'game' && post.score && (
              <div className="mt-2 flex items-center gap-3">
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                  {post.opponent}
                </Badge>
                <span className="font-bold text-lg">
                  {post.score.our} - {post.score.opp}
                </span>
                <Badge variant={post.score.our > post.score.opp ? 'default' : 'secondary'} className={post.score.our > post.score.opp ? 'bg-green-600' : 'bg-red-600'}>
                  {post.score.our > post.score.opp ? '승' : post.score.our < post.score.opp ? '패' : '무'}
                </Badge>
              </div>
            )}

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