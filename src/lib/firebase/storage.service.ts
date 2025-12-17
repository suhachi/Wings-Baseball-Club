// Firebase Storage Service
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask,
} from 'firebase/storage';
import { storage } from './config';

/**
 * 프로필 사진 업로드
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `profiles/${userId}/${fileName}`);

    if (onProgress) {
      // 진행률 추적
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      // 진행률 추적 없이 업로드
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
}

/**
 * 앨범 미디어 업로드
 */
export async function uploadAlbumMedia(
  file: File,
  type: 'photo' | 'video',
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `albums/${year}/${month}/${fileName}`);

    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
  } catch (error) {
    console.error('Error uploading album media:', error);
    throw error;
  }
}

/**
 * 게시글 첨부파일 업로드
 */
export async function uploadPostAttachment(
  postId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `posts/${postId}/${fileName}`);

    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
  } catch (error) {
    console.error('Error uploading post attachment:', error);
    throw error;
  }
}

/**
 * 파일 삭제
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * 폴더 내 파일 목록 가져오기
 */
export async function listFiles(folderPath: string): Promise<string[]> {
  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    
    const urls = await Promise.all(
      result.items.map((item) => getDownloadURL(item))
    );
    
    return urls;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * 이미지 리사이즈 (클라이언트 사이드)
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        } else {
          reject(new Error('Failed to resize image'));
        }
      }, file.type);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 파일 유효성 검사
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } {
  // 타입 검사
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `허용되지 않는 파일 형식입니다. (${allowedTypes.join(', ')})`,
    };
  }

  // 크기 검사
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. (최대 ${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * 이미지 파일 유효성 검사
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  return validateFile(
    file,
    ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    10 // 10MB
  );
}

/**
 * 비디오 파일 유효성 검사
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  return validateFile(
    file,
    ['video/mp4', 'video/webm', 'video/quicktime'],
    100 // 100MB
  );
}
