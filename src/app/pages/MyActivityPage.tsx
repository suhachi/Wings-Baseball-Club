import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export const MyActivityPage: React.FC = () => {
    const { user } = useAuth();
    const { posts, comments } = useData();
    const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

    if (!user) {
        console.log('[MyActivityPage] No user found');
        return null;
    }

    // Safe sorting helper
    const getPoolDate = (item: any) => {
        if (item.createdAt instanceof Date) return item.createdAt;
        if (item.createdAt && typeof item.createdAt.toDate === 'function') return item.createdAt.toDate();
        if (item.createdAt && typeof item.createdAt.seconds === 'number') return new Date(item.createdAt.seconds * 1000);
        return new Date(0); // Fallback
    };

    // Filter my posts
    const myPosts = posts
        .filter(post => post.author.id === user.id) // Use author.id
        .sort((a, b) => getPoolDate(b).getTime() - getPoolDate(a).getTime());

    // Filter my comments
    const myComments = Object.entries(comments).flatMap(([postId, postComments]) =>
        postComments
            .filter((comment: any) => comment.author.id === user.id)
            .map((comment: any) => ({ ...comment, postId }))
    ).sort((a: any, b: any) => getPoolDate(b).getTime() - getPoolDate(a).getTime());

    return (
        <div className="pb-20 pt-16">
            {/* Header handled by App.tsx TopBar */}

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-10">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'posts'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        내 게시글 ({myPosts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'comments'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        내 댓글 ({myComments.length})
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {activeTab === 'posts' ? (
                    <>
                        {myPosts.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                작성한 게시글이 없습니다.
                            </div>
                        ) : (
                            myPosts.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md font-medium">
                                            {(post as any).category || '자유'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatDistanceToNow(getPoolDate(post), { addSuffix: true, locale: ko })}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                                        {post.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {post.commentCount || 0}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </>
                ) : (
                    <>
                        {myComments.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                작성한 댓글이 없습니다.
                            </div>
                        ) : (
                            myComments.map((comment: any, index) => (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
                                >
                                    <div className="text-xs text-gray-500 mb-1">
                                        {formatDistanceToNow(getPoolDate(comment), { addSuffix: true, locale: ko })}
                                    </div>
                                    <p className="text-gray-800 dark:text-gray-200 mb-2">
                                        {comment.content}
                                    </p>
                                    <div className="text-xs text-blue-500">
                                        게시글 보러가기 →
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
