import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';

interface EmptyStateProps {
  type?: 'empty' | 'error';
  message?: string;
  icon?: React.ElementType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'empty',
  message,
  icon: Icon = FileText,
}) => {
  const defaultMessage = type === 'error' 
    ? '데이터를 불러오는 중 오류가 발생했습니다'
    : '데이터가 없습니다';

  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        {type === 'error' ? (
          <AlertCircle className="w-12 h-12 text-red-500" />
        ) : (
          <Icon className="w-12 h-12 text-gray-400" />
        )}
        <p className="text-gray-500 dark:text-gray-400">
          {message || defaultMessage}
        </p>
      </div>
    </Card>
  );
};

