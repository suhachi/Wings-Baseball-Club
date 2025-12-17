import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, Image as ImageIcon, Video, Play, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileUploadModal } from '../components/FileUploadModal';
import Masonry from 'react-responsive-masonry';

export const AlbumPage: React.FC = () => {
  const { posts } = useData();
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Filter album posts
  const albumPosts = posts.filter(p => p.type === 'album');
  const photos = albumPosts.filter(p => p.mediaType === 'photo');
  const videos = albumPosts.filter(p => p.mediaType === 'video');

  // Mock media data (since we don't have real uploads)
  const mockPhotos = Array.from({ length: 12 }, (_, i) => ({
    id: `photo${i}`,
    url: `https://picsum.photos/seed/${i}/400/600`,
    author: '김태준',
    date: new Date(2024, 11, 15 - i),
    likes: Math.floor(Math.random() * 20),
    comments: Math.floor(Math.random() * 10),
  }));

  const mockVideos = Array.from({ length: 4 }, (_, i) => ({
    id: `video${i}`,
    thumbnail: `https://picsum.photos/seed/video${i}/400/300`,
    author: '박민수',
    date: new Date(2024, 11, 20 - i),
    duration: '2:34',
    likes: Math.floor(Math.random() * 30),
    comments: Math.floor(Math.random() * 15),
  }));

  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto">
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="w-full sticky top-14 z-30 bg-white dark:bg-gray-900 border-b">
            <TabsTrigger value="photos" className="flex-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              사진 ({mockPhotos.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex-1 flex items-center gap-2">
              <Video className="w-4 h-4" />
              영상 ({mockVideos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="p-2 mt-0">
            <Masonry columnsCount={3} gutter="8px">
              {mockPhotos.map((photo, index) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onClick={() => setSelectedMedia(photo)}
                />
              ))}
            </Masonry>
          </TabsContent>

          <TabsContent value="videos" className="p-4 space-y-3 mt-0">
            {mockVideos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                index={index}
                onClick={() => setSelectedMedia(video)}
              />
            ))}
          </TabsContent>
        </Tabs>

        {/* FAB - Upload */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setUploadModalOpen(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
        >
          <Upload className="w-6 h-6" />
        </motion.button>

        {/* Media Detail Modal */}
        {selectedMedia && (
          <MediaDetailModal
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
          />
        )}

        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          type="album"
        />
      </div>
    </div>
  );
};

// Photo Card Component
const PhotoCard: React.FC<{
  photo: any;
  index: number;
  onClick: () => void;
}> = ({ photo, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index }}
      onClick={onClick}
      className="relative cursor-pointer group overflow-hidden rounded-lg"
    >
      <img
        src={photo.url}
        alt=""
        className="w-full h-auto object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
          <div className="text-xs">{photo.author}</div>
        </div>
      </div>
    </motion.div>
  );
};

// Video Card Component
const VideoCard: React.FC<{
  video: any;
  index: number;
  onClick: () => void;
}> = ({ video, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={onClick}
      >
        <div className="relative">
          <img
            src={video.thumbnail}
            alt=""
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
            {video.duration}
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {video.author}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {video.date.toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Media Detail Modal
const MediaDetailModal: React.FC<{
  media: any;
  onClose: () => void;
}> = ({ media, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        {media.url && (
          <img
            src={media.url}
            alt=""
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        )}

        {/* Video Thumbnail */}
        {media.thumbnail && (
          <div className="relative">
            <img
              src={media.thumbnail}
              alt=""
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-gray-900 ml-1" />
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 bg-white/10 backdrop-blur-xl rounded-lg p-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <div className="font-semibold">{media.author}</div>
              <div className="text-sm opacity-75">
                {media.date.toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span>❤️ {media.likes}</span>
              <span>💬 {media.comments}</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
};