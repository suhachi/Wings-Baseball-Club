import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Check, CheckCircle2, PlusCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface MemberPickerProps {
    selectedMemberIds: string[];
    onSelectionChange: (ids: string[]) => void;
    maxSelection?: number;
    label?: string;
}

export const MemberPicker: React.FC<MemberPickerProps> = ({
    selectedMemberIds,
    onSelectionChange,
    maxSelection = 10,
    label = '멤버 선택',
}) => {
    const { members } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter members based on search term
    const filteredMembers = members.filter(
        (member) =>
            member.status === 'active' &&
            (member.realName.includes(searchTerm) ||
                member.nickname?.includes(searchTerm))
    );

    const toggleSelection = (memberId: string) => {
        if (selectedMemberIds.includes(memberId)) {
            onSelectionChange(selectedMemberIds.filter((id) => id !== memberId));
        } else {
            if (selectedMemberIds.length >= maxSelection) {
                return; // Max selection reached
            }
            onSelectionChange([...selectedMemberIds, memberId]);
        }
    };

    const removeSelection = (memberId: string) => {
        onSelectionChange(selectedMemberIds.filter((id) => id !== memberId));
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label} ({selectedMemberIds.length})
                </label>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    type="button"
                >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    추가
                </Button>
            </div>

            {/* Selected Members Chips */}
            <div className="flex flex-wrap gap-2">
                {selectedMemberIds.length === 0 && (
                    <span className="text-sm text-gray-400">선택된 멤버가 없습니다.</span>
                )}
                {selectedMemberIds.map((id) => {
                    const member = members.find((m) => m.id === id);
                    if (!member) return null;
                    return (
                        <div
                            key={id}
                            className="flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full text-sm"
                        >
                            <span>{member.realName}</span>
                            <button
                                onClick={() => removeSelection(id)}
                                className="hover:text-purple-900 dark:hover:text-purple-100"
                                type="button"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Picker Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 w-full max-w-md flex flex-col rounded-t-[20px] sm:rounded-2xl shadow-xl overflow-hidden max-h-[85vh]"
                        >
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">멤버 선택</h3>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="이름 또는 닉네임 검색"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                                {filteredMembers.map((member) => {
                                    const isSelected = selectedMemberIds.includes(member.id);
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => toggleSelection(member.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isSelected
                                                ? 'bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                                                    {member.realName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{member.realName}</p>
                                                    <p className="text-xs text-gray-500">{member.nickname}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t dark:border-gray-800">
                                <Button className="w-full" onClick={() => setIsOpen(false)}>
                                    완료 ({selectedMemberIds.length})
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
