import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'sonner';

interface CommentFormProps {
  postId: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({ postId }) => {
  const { user } = useAuth();
  const { addComment } = useData();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('댓글 내용을 입력해주세요');
      return;
    }

    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setLoading(true);

    try {
      await addComment({
        postId,
        content: content.trim(),
      });

      setContent('');
      toast.success('댓글이 작성되었습니다');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('댓글 작성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {user?.name?.charAt(0) || '?'}
          </div>
        </div>

        {/* Input */}
        <div className="flex-1 flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
            rows={2}
            disabled={loading}
          />
          
          <motion.button
            type="submit"
            disabled={loading || !content.trim()}
            whileTap={{ scale: 0.95 }}
            className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </form>
  );
};
