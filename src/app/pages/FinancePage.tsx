import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Filter,
  Wallet,
  CreditCard,
  ShoppingBag,
  Package,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClub } from '../contexts/ClubContext';
import {
  addFinance,
  getFinances,
} from '../../lib/firebase/firestore.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { FinanceDoc } from '../../lib/firebase/types';

type FilterType = 'all' | 'income' | 'expense';
type CategoryType = 'dues' | 'event' | 'equipment' | 'other';

interface FinancePageProps {
  onBack?: () => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({ onBack }) => {
  const { user, isTreasury } = useAuth();
  const { currentClubId } = useClub();
  const { members } = useData();
  const [finances, setFinances] = useState<FinanceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'event' as CategoryType,
    amount: '',
    description: '',
    duesPaidBy: '',
    duesMonth: format(new Date(), 'yyyy-MM'),
  });

  useEffect(() => {
    loadFinances();
  }, []);

  const loadFinances = async () => {
    setLoading(true);
    try {
      const data = await getFinances(currentClubId);
      setFinances(data);
    } catch (error) {
      console.error('Error loading finances:', error);
      toast.error('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFinance = async () => {
    if (!user) return;
    if (!formData.amount || !formData.description) {
      toast.error('금액과 설명을 입력하세요');
      return;
    }

    try {
      const newFinance: Omit<FinanceDoc, 'id' | 'createdAt'> = {
        type: formData.type,
        category: formData.category,
        amount: parseInt(formData.amount),
        description: formData.description,
        date: new Date(),
        createdBy: user.id,
        createdByName: user.realName,
      };

      // 회비인 경우 추가 정보
      if (formData.category === 'dues' && formData.duesPaidBy) {
        const paidByMember = members.find((m) => m.id === formData.duesPaidBy);
        newFinance.duesPaidBy = formData.duesPaidBy;
        newFinance.duesPaidByName = paidByMember?.realName || '';
        newFinance.duesMonth = formData.duesMonth;
      }

      await addFinance(currentClubId, newFinance);
      await loadFinances();
      setShowAddForm(false);
      resetForm();
      toast.success('등록되었습니다');
    } catch (error) {
      console.error('Error adding finance:', error);
      toast.error('등록 실패');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      category: 'event',
      amount: '',
      description: '',
      duesPaidBy: '',
      duesMonth: format(new Date(), 'yyyy-MM'),
    });
  };

  // Filter finances by type and month
  const filteredFinances = finances.filter((finance) => {
    const typeMatch = filter === 'all' || finance.type === filter;
    const monthMatch = isWithinInterval(finance.date, {
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth),
    });
    return typeMatch && monthMatch;
  });

  // Calculate statistics
  const stats = {
    totalIncome: finances
      .filter((f) => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0),
    totalExpense: finances
      .filter((f) => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0),
    monthlyIncome: filteredFinances
      .filter((f) => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0),
    monthlyExpense: filteredFinances
      .filter((f) => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0),
  };

  const categoryLabels: Record<CategoryType, string> = {
    dues: '회비',
    event: '행사비',
    equipment: '장비',
    other: '기타',
  };

  const categoryIcons: Record<CategoryType, typeof Wallet> = {
    dues: Wallet,
    event: Calendar,
    equipment: Package,
    other: MoreHorizontal,
  };

  if (!isTreasury()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-16 pb-20">
        <div className="text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">접근 권한 없음</h2>
          <p className="text-gray-600">총무만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-8 h-8" />
          <h1 className="text-2xl font-bold">회비/회계</h1>
        </div>
        <p className="text-green-100">동호회 수입/지출 관리</p>
      </div>

      {/* Stats Cards */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">
              {stats.totalIncome.toLocaleString()}원
            </p>
            <p className="text-sm opacity-90">총 수입</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <TrendingDown className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">
              {stats.totalExpense.toLocaleString()}원
            </p>
            <p className="text-sm opacity-90">총 지출</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg"
        >
          <Wallet className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-bold">
            {(stats.totalIncome - stats.totalExpense).toLocaleString()}원
          </p>
          <p className="text-sm opacity-90">잔액</p>
        </motion.div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSelectedMonth(
                new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1))
              )
            }
            className="px-3 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm"
          >
            ←
          </button>
          <div className="flex-1 text-center font-semibold">
            {format(selectedMonth, 'yyyy년 M월', { locale: ko })}
          </div>
          <button
            onClick={() =>
              setSelectedMonth(
                new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1))
              )
            }
            className="px-3 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm"
          >
            →
          </button>
        </div>

        {/* Add Button */}
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          내역 추가
        </Button>

        {/* Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 space-y-4"
          >
            <div className="flex gap-2">
              <button
                onClick={() => setFormData({ ...formData, type: 'income' })}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${formData.type === 'income'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
              >
                수입
              </button>
              <button
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${formData.type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
              >
                지출
              </button>
            </div>

            <div>
              <Label>카테고리</Label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as CategoryType,
                  })
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="dues">회비</option>
                <option value="event">행사비</option>
                <option value="equipment">장비</option>
                <option value="other">기타</option>
              </select>
            </div>

            {formData.category === 'dues' && (
              <>
                <div>
                  <Label>납부자</Label>
                  <select
                    value={formData.duesPaidBy}
                    onChange={(e) =>
                      setFormData({ ...formData, duesPaidBy: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">선택하세요</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.realName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>납부 월</Label>
                  <Input
                    type="month"
                    value={formData.duesMonth}
                    onChange={(e) =>
                      setFormData({ ...formData, duesMonth: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div>
              <Label>금액</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="10000"
              />
            </div>

            <div>
              <Label>설명</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="예: 3월 회비"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddFinance} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                추가
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
              ? 'bg-gray-800 dark:bg-gray-700 text-white'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${filter === 'income'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}
          >
            수입
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${filter === 'expense'
              ? 'bg-red-500 text-white'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}
          >
            지출
          </button>
        </div>

        {/* Finance List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
            </div>
          ) : filteredFinances.length === 0 ? (
            <div className="text-center py-20">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">내역이 없습니다</p>
            </div>
          ) : (
            filteredFinances.map((finance, index) => {
              const CategoryIcon = categoryIcons[finance.category];
              return (
                <motion.div
                  key={finance.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${finance.type === 'income'
                          ? 'bg-blue-100 dark:bg-blue-900/20'
                          : 'bg-red-100 dark:bg-red-900/20'
                          }`}
                      >
                        <CategoryIcon
                          className={`w-5 h-5 ${finance.type === 'income'
                            ? 'text-blue-600'
                            : 'text-red-600'
                            }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {finance.description}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${finance.type === 'income'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              }`}
                          >
                            {categoryLabels[finance.category]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {finance.createdByName}
                        </p>
                        {finance.duesPaidByName && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            납부자: {finance.duesPaidByName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {format(finance.date, 'yyyy-MM-dd HH:mm', {
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-right ${finance.type === 'income'
                        ? 'text-blue-600'
                        : 'text-red-600'
                        }`}
                    >
                      <p className="text-lg font-bold">
                        {finance.type === 'income' ? '+' : '-'}
                        {finance.amount.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
