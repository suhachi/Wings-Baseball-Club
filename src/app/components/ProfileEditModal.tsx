import React, { useState, useRef } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { uploadProfilePhoto } from '../../lib/firebase/storage.service';
import { toast } from 'sonner';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [position, setPosition] = useState(user?.position || '');
  const [backNumber, setBackNumber] = useState(user?.backNumber?.toString() || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);

  const positions = [
    '투수', '포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수'
  ];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);

    try {
      const updates: any = {
        nickname: nickname.trim() || user.nickname,
        phone: phone.trim() || user.phone,
        position: position || user.position,
        backNumber: backNumber ? parseInt(backNumber) : user.backNumber,
      };

      // Upload photo if selected
      if (photoFile) {
        const photoURL = await uploadProfilePhoto(user.id, photoFile);
        updates.photoURL = photoURL;
      }

      await updateUser(updates);
      toast.success('프로필이 업데이트되었습니다');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('프로필 업데이트에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[20px] sm:rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">프로필 수정</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">클릭하여 사진 변경 (최대 5MB)</p>
              </div>

              {/* Name (Read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2">이름</label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="w-full px-4 py-3 border rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">실명은 변경할 수 없습니다</p>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium mb-2">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="닉네임을 입력하세요"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">연락처</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="010-1234-5678"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium mb-2">포지션</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                >
                  <option value="">포지션 선택</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Back Number */}
              <div>
                <label className="block text-sm font-medium mb-2">등번호</label>
                <input
                  type="number"
                  value={backNumber}
                  onChange={(e) => setBackNumber(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="등번호"
                  min="0"
                  max="99"
                />
              </div>

              {/* Role (Read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2">역할</label>
                <input
                  type="text"
                  value={user.role === 'PRESIDENT' ? '회장' :
                    user.role === 'DIRECTOR' ? '감독' :
                      user.role === 'TREASURER' ? '총무' :
                        user.role === 'ADMIN' ? '관리자' : '일반회원'}
                  disabled
                  className="w-full px-4 py-3 border rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">역할은 관리자만 변경할 수 있습니다</p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-4 bg-white dark:bg-gray-900 border-t">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};