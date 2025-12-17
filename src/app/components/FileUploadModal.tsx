import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Video, File, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'sonner';
import { Button } from './ui/button';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'album' | 'post';
  postId?: string;
  onUploadComplete?: (urls: string[]) => void;
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  type,
  postId,
  onUploadComplete,
}) => {
  const { user } = useAuth();
  const { uploadFile, addPost } = useData();
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = type === 'album' ? 'image/*,video/*' : 'image/*';
  const maxFiles = type === 'album' ? 10 : 5;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`최대 ${maxFiles}개 파일만 업로드 가능합니다`);
      return;
    }

    const newPreviews: FilePreview[] = [];
    
    selectedFiles.forEach((file) => {
      // 파일 크기 체크 (20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}은(는) 20MB를 초과합니다`);
        return;
      }

      // 파일 타입 체크
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : null;
      
      if (!fileType) {
        toast.error(`${file.name}은(는) 지원하지 않는 형식입니다`);
        return;
      }

      // 미리보기 생성
      const preview = URL.createObjectURL(file);
      newPreviews.push({ file, preview, type: fileType });
    });

    setFiles(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('파일을 선택해주세요');
      return;
    }

    if (type === 'album' && !title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }

    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadedUrls: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const filePreview = files[i];
        const path = type === 'album' 
          ? `albums/${user.id}/${Date.now()}_${filePreview.file.name}`
          : `posts/${postId || 'temp'}/${Date.now()}_${filePreview.file.name}`;

        const url = await uploadFile(filePreview.file, path);
        uploadedUrls.push(url);
        
        // 진행률 업데이트
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      // 앨범 타입이면 게시글 생성
      if (type === 'album') {
        await addPost({
          type: 'album',
          title: title.trim(),
          content: description.trim(),
          images: uploadedUrls,
        });
        toast.success('앨범이 업로드되었습니다');
      } else {
        // 게시글 첨부용
        onUploadComplete?.(uploadedUrls);
        toast.success('파일이 업로드되었습니다');
      }

      // 초기화
      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {type === 'album' ? '앨범 업로드' : '파일 업로드'}
                </h2>
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Title & Description (Album only) */}
              {type === 'album' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">제목 *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                      placeholder="앨범 제목을 입력하세요"
                      disabled={uploading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">설명 (선택)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
                      placeholder="설명을 입력하세요"
                      disabled={uploading}
                    />
                  </div>
                </div>
              )}

              {/* File Upload Area */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  uploading
                    ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-50'
                    : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      파일을 드래그하거나 클릭하여 선택
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {type === 'album' ? '사진, 동영상' : '이미지'} (최대 {maxFiles}개, 각 20MB 이하)
                    </p>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedTypes}
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>

              {/* File Previews */}
              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">
                      선택된 파일 ({files.length}/{maxFiles})
                    </p>
                    {!uploading && (
                      <button
                        onClick={() => {
                          files.forEach(f => URL.revokeObjectURL(f.preview));
                          setFiles([]);
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        전체 삭제
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.map((filePreview, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group"
                      >
                        {filePreview.type === 'image' ? (
                          <img
                            src={filePreview.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {!uploading && (
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* File Type Badge */}
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white flex items-center gap-1">
                          {filePreview.type === 'image' ? (
                            <ImageIcon className="w-3 h-3" />
                          ) : (
                            <Video className="w-3 h-3" />
                          )}
                          {filePreview.type}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">업로드 중...</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={uploading}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || files.length === 0 || (type === 'album' && !title.trim())}
                  className="flex-1"
                >
                  {uploading ? `업로드 중 (${progress}%)` : '업로드'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
