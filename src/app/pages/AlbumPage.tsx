import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { createPost } from '../../lib/firebase/firestore.service';
import { useClub } from '../contexts/ClubContext';
import { uploadAlbumMedia } from '../../lib/firebase/storage.service';

interface PhotoItem {
  id: string;
  url: string;
  postId: string;
  authorName: string;
  createdAt: Date;
}

export const AlbumPage: React.FC = () => {
  const { posts } = useData();
  const { user } = useAuth();
  const { currentClubId } = useClub();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Extract all images from posts
  const allPhotos: PhotoItem[] = posts
    .filter(post => post.images && post.images.length > 0)
    .flatMap(post =>
      (post.images || []).map((img, idx) => ({
        id: `${post.id}-${idx}`,
        url: img,
        postId: post.id,
        authorName: post.author.name,
        createdAt: post.createdAt
      }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !currentClubId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드해주세요');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadAlbumMedia(file, 'photo');

      // Create a simple post for the image
      await createPost(currentClubId, {
        authorId: user.id,
        authorName: user.realName || user.nickname || 'Unknown',
        authorPhotoURL: user.photoURL,
        content: '사진을 업로드했습니다.',
        type: 'free', // lowercase
        title: '사진 업로드',
        images: [imageUrl],
        likes: [],
      });

      toast.success('사진이 업로드되었습니다');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('업로드 실패');
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex < allPhotos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  return (
    <div className="pb-20 pt-16 min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold">앨범</h1>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="album-upload"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <label
            htmlFor="album-upload"
            className={`flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isUploading ? (
              '업로드 중...'
            ) : (
              <>
                <Plus className="w-4 h-4" />
                사진 추가
              </>
            )}
          </label>
        </div>
      </div>

      {allPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <ImageIcon className="w-12 h-12 mb-4 text-gray-300" />
          <p>등록된 사진이 없습니다.</p>
          <p className="text-sm mt-1">첫 번째 사진을 올려보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {allPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative aspect-square cursor-pointer overflow-hidden bg-gray-200 dark:bg-gray-800"
              onClick={() => setSelectedPhotoIndex(index)}
            >
              <img
                src={photo.url}
                alt={`Photo by ${photo.authorName}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-20"
              onClick={() => setSelectedPhotoIndex(null)}
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Buttons */}
            {selectedPhotoIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-20"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {selectedPhotoIndex < allPhotos.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-20"
                onClick={handleNext}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div
              className="w-full max-w-4xl max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={allPhotos[selectedPhotoIndex].url}
                alt="Full size"
                className="w-full h-full object-contain max-h-[85vh] rounded-lg"
              />
              <div className="absolute bottom-4 left-0 right-0 text-center text-white/90 bg-black/50 py-2 rounded-b-lg backdrop-blur-sm mx-auto w-fit px-4">
                <p className="font-medium text-sm">{allPhotos[selectedPhotoIndex].authorName}</p>
                <p className="text-xs text-white/70">
                  {formatDistanceToNow(allPhotos[selectedPhotoIndex].createdAt, { addSuffix: true, locale: ko })}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
