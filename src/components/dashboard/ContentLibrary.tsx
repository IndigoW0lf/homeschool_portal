'use client';

import { useState } from 'react';
import { Plus, Books, PencilSimple, File, FunnelSimple, PushPin, DotsSixVertical } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Lesson, AssignmentItemRow } from '@/types';
import { ActivityModal } from './ActivityModal';
import { QuickStartPanel } from './QuickStartPanel';
import { LunaraTitle } from '@/components/ui/LunaraTitle';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { togglePinLesson, updateLessonOrder, togglePinAssignment, updateAssignmentOrder } from '@/lib/supabase/mutations';
import { toast } from 'sonner';

interface ContentLibraryProps {
  lessons: Lesson[];
  assignments: AssignmentItemRow[];
  kids: { id: string; name: string; gradeBand?: string; grades?: string[] }[];
  onViewLesson?: (id: string) => void;
  onViewAssignment?: (id: string) => void;
}

type ContentType = 'all' | 'lesson' | 'assignment' | 'worksheet';

interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'assignment' | 'worksheet';
  subtitle: string;
  category?: string | null;
  is_pinned?: boolean;
  display_order?: number;
  originalItem: Lesson | AssignmentItemRow;
}

// Sortable Item Component
function SortableItem({ item, onClick, onPin }: { item: ContentItem; onClick: () => void; onPin: (e: React.MouseEvent) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'lesson': return <Books size={16} weight="duotone" className="text-[var(--celestial-500)]" />;
      case 'assignment': return <PencilSimple size={16} weight="duotone" className="text-[var(--nebula-purple)]" />;
      case 'worksheet': return <File size={16} weight="duotone" className="text-[var(--success)]" />;
    }
  };

  const getTypeBadgeClass = (type: ContentItem['type']) => {
    switch (type) {
      case 'lesson': return 'badge-celestial';
      case 'assignment': return 'badge-purple';
      case 'worksheet': return 'badge-success';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full p-4 flex items-center gap-4 hover:bg-[var(--hover-overlay)] transition-colors text-left bg-[var(--surface)] border-b border-[var(--border)] group",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted opacity-0 group-hover:opacity-100 transition-opacity">
        <DotsSixVertical size={20} />
      </div>

      <button onClick={onClick} className="flex-1 flex items-center gap-4 min-w-0 text-left">
        <div className="flex-shrink-0">
          {getTypeIcon(item.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-heading truncate flex items-center gap-2">
            {item.title}
            {item.is_pinned && <PushPin size={12} weight="fill" className="text-ember-gold" />}
          </h4>
          <p className="text-xs text-muted truncate">{item.subtitle}</p>
        </div>
      </button>

      <div className="flex items-center gap-2">
        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getTypeBadgeClass(item.type))}>
          {item.type}
        </span>
        <button 
           onClick={onPin}
           className={cn(
             "p-1 rounded hover:bg-[var(--hover-overlay)] transition-colors",
             item.is_pinned ? "text-ember-gold" : "text-muted hover:text-foreground alpha-0 group-hover:alpha-100 opacity-20 group-hover:opacity-100"
           )}
           title={item.is_pinned ? "Unpin" : "Pin to top"}
        >
          <PushPin size={16} weight={item.is_pinned ? "fill" : "regular"} />
        </button>
      </div>
    </div>
  );
}

export function ContentLibrary({ 
  lessons, 
  assignments, 
  kids,
  onViewLesson,
  onViewAssignment 
}: ContentLibraryProps) {
  const [filter, setFilter] = useState<ContentType>('all');
  const [showModal, setShowModal] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  // Combine and sort content
  // We maintain local state for optimistic UI updates? 
  // For now, simpler to just derive from props, but DND requires state.
  // Actually, to support DND we must have local state that initializes from props.
  // However, props update when strict mode runs or revalidation happens.
  
  const mapToContentItem = (l: Lesson | AssignmentItemRow) => {
     const isLesson = 'instructions' in l; // duck typing
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const type = isLesson ? 'lesson' : (l as any).worksheet_data ? 'worksheet' : 'assignment';
     
     return {
       id: l.id,
       title: l.title,
       type: type as ContentItem['type'],
       subtitle: isLesson ? (l as Lesson).type || 'Lesson' : (l as AssignmentItemRow).type || 'Assignment',
       category: isLesson ? (l as Lesson).type : (l as AssignmentItemRow).type,
       is_pinned: (l as any).is_pinned,
       display_order: (l as any).display_order || 0,
       originalItem: l
     };
  };

  const [localItems, setLocalItems] = useState<ContentItem[]>(() => {
    const all = [
      ...lessons.map(mapToContentItem),
      ...assignments.map(mapToContentItem)
    ];
    // Initial sort: Pinned first, then display_order
    return all.sort((a, b) => {
      if (a.is_pinned === b.is_pinned) {
        return (a.display_order || 0) - (b.display_order || 0);
      }
      return a.is_pinned ? -1 : 1;
    });
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync state with props when they change (e.g. after mutation)
  // This might clear local drag state if not careful, but usually fine for this app
  // We can use a useEffect to reconcile if needed, or just rely on key changes.
  // For simplicity, we'll assume the parent re-renders passed new filtered lists.
  // But since we have local state for DND, we verify if we need to update it.
  // We'll skip complex synchronization for this iteration and assume simple updates.
  
  // Actually, we must allow props to update the list, but preserve order?
  // Let's rely on props-based derivation for now, but DND requires we control the array order.
  // If we rely on props, the list snaps back until the server mutation returns.
  // So we use local state + server action.

  const filteredItems = localItems.filter(c => filter === 'all' || c.type === filter);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over?.id);
      
      const newItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newItems); // Optimistic update
      
      const movedItem = newItems[newIndex];
      
      // Determine new display order
      // We'll just update the display_order of the moved item and its neighbors?
      // Or we can just send the whole list's new order for the affected type?
      // Simplified strategy: Update everyone's display_order in the list to match index
      // But we have mixed types.
      
      // Filter to same type as moved item to normalize orders?
      // If I move a Lesson, I want to update its order relative to other Lessons.
      // But in the mixed list, I see them interleaved.
      // If I move L1 between L2 and A1. 
      // It's hard to define "order" for the DB unless I update the whole visual list's indices?
      // Let's just update the specific item's order to be between neighbors if possible, or just index
      
      // "Correct" way for this UI: Update order of ALL items of that TYPE based on their new relative positions.
      const typeItems = newItems.filter(i => i.type === movedItem.type || (movedItem.type === 'worksheet' && i.type === 'assignment')); // grouping assignment/worksheet
      
      const updates = typeItems.map((item, index) => ({
        id: item.id,
        display_order: index
      }));
      
      try {
        if (movedItem.type === 'lesson') {
          await updateLessonOrder(updates);
        } else {
          await updateAssignmentOrder(updates);
        }
        // toast.success('Order updated');
      } catch (err) {
        toast.error('Failed to save order');
        console.error(err);
      }
    }
  };

  const handlePin = async (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();
    const newPinned = !item.is_pinned;
    
    // Optimistic update with re-sort
    setLocalItems(prev => {
      const updated = prev.map(i => i.id === item.id ? { ...i, is_pinned: newPinned } : i);
      return updated.sort((a, b) => {
        if (a.is_pinned === b.is_pinned) return (a.display_order || 0) - (b.display_order || 0);
        return a.is_pinned ? -1 : 1;
      });
    });

    try {
      if (item.type === 'lesson') {
        await togglePinLesson(item.id, newPinned);
      } else {
        await togglePinAssignment(item.id, newPinned);
      }
      toast.success(newPinned ? 'Pinned to top' : 'Unpinned');
    } catch (err) {
      toast.error('Failed to update pin');
      setLocalItems(localItems); // Revert
    }
  };
  
  const handleItemClick = (item: ContentItem) => {
    if (item.type === 'lesson' && onViewLesson) {
      onViewLesson(item.id);
    } else if ((item.type === 'assignment' || item.type === 'worksheet') && onViewAssignment) {
      onViewAssignment(item.id);
    }
  };

  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center gap-3">
            <LunaraTitle 
              gradient="herbal-bloom" 
              size="md"
            >
              Lessons
            </LunaraTitle>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <FunnelSimple size={16} className="text-muted" />
            {(['all', 'lesson', 'assignment', 'worksheet'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-all capitalize",
                  filter === type
                    ? "bg-[var(--celestial-500)] text-white shadow-md"
                    : "bg-[var(--background-secondary)] text-muted hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
                )}
              >
                {type === 'all' ? 'All' : type + 's'}
              </button>
            ))}
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} weight="bold" />
            New Activity
          </button>
        </div>

        {/* Quick Start Toggle */}
        <div className="px-4 py-2 border-b border-[var(--border)]">
          <button
            onClick={() => setShowQuickStart(!showQuickStart)}
            className="text-sm text-ember-gold font-medium flex items-center gap-2 hover:text-[var(--ember-gold-600)] transition-colors"
          >
            ⚡ Quick Start Templates
            <span className={cn("transition-transform", showQuickStart && "rotate-180")}>▼</span>
          </button>
          {showQuickStart && (
            <div className="mt-3">
              <QuickStartPanel kids={kids} compact />
            </div>
          )}
        </div>

        {/* Content List */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar bg-[var(--surface)]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <p>No content found. Create your first activity!</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={filteredItems.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredItems.map(item => (
                  <SortableItem 
                    key={item.id} 
                    item={item} 
                    onClick={() => handleItemClick(item)} 
                    onPin={(e) => handlePin(e, item)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Unified Activity Modal */}
      <ActivityModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        kids={kids}
      />
    </>
  );
}
