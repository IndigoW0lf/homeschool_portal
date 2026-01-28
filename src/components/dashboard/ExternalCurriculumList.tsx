'use client';

import { useState, useTransition } from 'react';
import { CaretDown, CaretUp, Trash, Warning } from '@phosphor-icons/react';
import { deleteExternalCurriculumItem } from '@/app/actions/import';
import { toast } from 'sonner';

interface CurriculumItem {
    id: string;
    task_name: string;
    course: string;
    subject: string;
    date: string;
    score: number | null;
    item_type: string;
    source: string;
}

interface ExternalCurriculumListProps {
    items: CurriculumItem[];
    kidName: string;
}

export function ExternalCurriculumList({ items: initialItems, kidName }: ExternalCurriculumListProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [items, setItems] = useState(initialItems);
    const [deleteTarget, setDeleteTarget] = useState<CurriculumItem | null>(null);
    const [isPending, startTransition] = useTransition();

    const displayItems = isExpanded ? items : items.slice(0, 5);
    const hasMore = items.length > 5;

    const handleDelete = (item: CurriculumItem) => {
        setDeleteTarget(item);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        const itemId = deleteTarget.id;
        startTransition(async () => {
            const result = await deleteExternalCurriculumItem(itemId);
            if (result.success) {
                setItems(prev => prev.filter(i => i.id !== itemId));
                toast.success('Item deleted');
            } else {
                toast.error(result.error || 'Failed to delete');
            }
            setDeleteTarget(null);
        });
    };

    if (items.length === 0) {
        return (
            <p className="text-sm text-muted italic">
                No imported curriculum data yet.
            </p>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-heading dark:text-muted">
                    Recent Activity
                </h4>
                <span className="text-xs text-muted">
                    {items.length} items
                </span>
            </div>

            <div className="space-y-1">
                {displayItems.map((item) => (
                    <div
                        key={item.id}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)]/50 text-sm"
                    >
                        <span>🏫</span>
                        <span className="flex-1 truncate text-heading dark:text-muted">
                            {item.task_name}
                        </span>
                        <span className="text-xs text-muted">
                            {new Date(item.date).toLocaleDateString()}
                        </span>
                        {item.score !== null && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${item.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                item.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {item.score}%
                            </span>
                        )}
                        <button
                            onClick={() => handleDelete(item)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-red-500 transition-opacity"
                            title="Delete item"
                        >
                            <Trash size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Expand/Collapse Toggle */}
            {hasMore && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-2 py-2 text-sm text-[var(--nebula-purple)] dark:text-[var(--nebula-purple)] hover:bg-[var(--nebula-purple)]/10 dark:hover:bg-[var(--nebula-purple)]/15 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                    {isExpanded ? (
                        <>
                            <CaretUp size={16} weight="bold" />
                            Show Less
                        </>
                    ) : (
                        <>
                            <CaretDown size={16} weight="bold" />
                            Show All {items.length} Items
                        </>
                    )}
                </button>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--background-elevated)] rounded-xl shadow-xl max-w-sm w-full p-5 animate-in zoom-in-95 fade-in duration-200">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
                            <Warning size={24} weight="fill" />
                            <h3 className="text-lg font-bold text-heading">
                                Delete Item?
                            </h3>
                        </div>
                        <p className="text-muted text-sm mb-4">
                            Are you sure you want to delete <strong>&quot;{deleteTarget.task_name}&quot;</strong> from {kidName}&apos;s curriculum?
                        </p>
                        <p className="text-xs text-muted mb-4">
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={isPending}
                                className="px-4 py-2 text-muted hover:bg-[var(--hover-overlay)] rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isPending}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-[var(--foreground)] rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isPending ? (
                                    <>Deleting...</>
                                ) : (
                                    <>
                                        <Trash size={16} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
