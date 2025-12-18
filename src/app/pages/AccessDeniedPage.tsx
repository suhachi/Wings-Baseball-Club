import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Access Denied Page
 * 
 * ATOM-08: 구글 로그인은 되었지만 멤버로 등록되지 않았거나
 * status가 'active'가 아닌 사용자를 차단하는 페이지
 * 
 * 가입/승인 요청 생성 기능은 포함하지 않음 (운영으로 처리)
 */
export const AccessDeniedPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          접근 권한이 없습니다
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-2">
          현재 계정으로는 앱에 접근할 수 없습니다.
        </p>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          관리자에게 문의해주세요.
        </p>

        {user && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <strong>계정 정보:</strong>
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {user.realName} ({user.id})
            </p>
            {user.status && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                상태: {user.status === 'pending' ? '승인 대기' : user.status === 'rejected' ? '거부됨' : user.status === 'withdrawn' ? '탈퇴' : user.status}
              </p>
            )}
          </div>
        )}

        <button
          onClick={logout}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  );
};

