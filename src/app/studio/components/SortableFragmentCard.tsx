"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { FragmentCard } from "./FragmentCard";
import { Fragment, Tag } from "@/types";

interface SortableFragmentCardProps {
  fragment: Fragment;
  formattedDate: string;
  isSelected: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onAddTag?: (tagId: string) => void;
  onRemoveTag?: (tagId: string) => void;
  onTagClick?: (tagId: string) => void;
  availableTags?: Tag[];
  onCreateTag?: (name: string) => Promise<Tag | null>;
  index?: number;
  showDelete?: boolean;
  fixedHeight?: boolean;
}

export function SortableFragmentCard(props: SortableFragmentCardProps) {
  const {
    fragment,
    formattedDate,
    isSelected,
    onToggle,
    onDelete,
    onAddTag,
    onRemoveTag,
    onTagClick,
    availableTags,
    onCreateTag,
    index,
    showDelete,
    fixedHeight,
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: fragment.id,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  // 使用 CSS.Translate 只使用 translate，避免 scale 问题
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative h-full group"
    >
      {/* 删除按钮 - 在拖拽区域外 */}
      {(showDelete || !isSelected) && onDelete && (
        <motion.button
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            onDelete(); 
          }}
          className="
            absolute -top-2 -right-2 z-50 w-6 h-6 rounded-full 
            flex items-center justify-center text-xs shadow-sm
            bg-white text-muted hover:bg-red-500 hover:text-white 
            border border-border opacity-0 group-hover:opacity-100
            transition-opacity cursor-pointer
          "
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      )}
      
      {/* 可拖拽区域 */}
      <div
        className={`h-full ${isDragging ? 'cursor-grabbing z-40 opacity-40 scale-[1.02]' : 'cursor-grab'}`}
        {...attributes}
        {...listeners}
      >
        <FragmentCard
          fragment={fragment}
          formattedDate={formattedDate}
          isSelected={isSelected}
          onToggle={onToggle}
          onDelete={undefined}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onTagClick={onTagClick}
          availableTags={availableTags}
          onCreateTag={onCreateTag}
          index={index}
          showDelete={false}
          isDragging={isDragging}
          fixedHeight={fixedHeight}
        />
      </div>
    </div>
  );
}
