import { useState, useCallback } from 'react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export interface PaginationState {
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  loading: boolean;
}

export interface UsePaginationReturn {
  pagination: PaginationState;
  setLastDoc: (doc: QueryDocumentSnapshot<DocumentData> | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const usePagination = (): UsePaginationReturn => {
  const [pagination, setPagination] = useState<PaginationState>({
    lastDoc: null,
    hasMore: true,
    loading: false,
  });

  const setLastDoc = useCallback((doc: QueryDocumentSnapshot<DocumentData> | null) => {
    setPagination((prev) => ({ ...prev, lastDoc: doc }));
  }, []);

  const setHasMore = useCallback((hasMore: boolean) => {
    setPagination((prev) => ({ ...prev, hasMore }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setPagination((prev) => ({ ...prev, loading }));
  }, []);

  const reset = useCallback(() => {
    setPagination({
      lastDoc: null,
      hasMore: true,
      loading: false,
    });
  }, []);

  return {
    pagination,
    setLastDoc,
    setHasMore,
    setLoading,
    reset,
  };
};

