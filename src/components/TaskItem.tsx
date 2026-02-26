import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  GripVertical,
  Bell,
  Infinity as InfinityIcon
} from 'lucide-react';
import { Task } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onToggle: () => void;
  onReset: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

export default function TaskItem({ 
  task, 
  isActive, 
  onToggle, 
  onReset, 
  onDelete,
  onUpdate
}: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatGoal = (seconds: number) => {
    if (task.isIndefinite) return 'INDEFINITE';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const progress = task.isIndefinite ? 0 : Math.min((task.timeSpent / task.goalSeconds) * 100, 100);

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group grid grid-cols-12 items-center gap-4 py-4 px-6 border-b border-slate-100 transition-colors",
        isActive ? "bg-brand-light" : "hover:bg-slate-50/50",
        isDragging && "opacity-50 shadow-lg bg-white"
      )}
    >
      <div className="col-span-1 flex items-center gap-3">
        <button 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="col-span-3">
        <div 
          className="font-medium text-slate-800 cursor-pointer hover:text-brand-deep"
          onDoubleClick={() => {
            const newName = prompt('Edit Task Name', task.name);
            if (newName) onUpdate({ name: newName });
          }}
        >
          {task.name}
        </div>
      </div>

      <div className="col-span-2 font-mono text-sm text-slate-500">
        {formatTime(task.timeSpent)}
      </div>

      <div className="col-span-2">
        <div 
          className="text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-brand-deep"
          onDoubleClick={() => {
            const newGoal = prompt('Edit Goal (minutes)', Math.floor(task.goalSeconds / 60).toString());
            if (newGoal) onUpdate({ goalSeconds: parseInt(newGoal) * 60 });
          }}
        >
          {formatGoal(task.goalSeconds)}
        </div>
      </div>

      <div className="col-span-2">
        {!task.isIndefinite && (
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                progress >= 100 ? "bg-emerald-500" : "bg-brand-deep"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {task.isIndefinite && (
           <div className="flex justify-center">
             <InfinityIcon className="w-4 h-4 text-slate-300" />
           </div>
        )}
      </div>

      <div className="col-span-2 flex items-center justify-end gap-2">
        <button 
          onClick={onToggle}
          className={cn(
            "p-2 rounded-lg transition-all",
            isActive 
              ? "bg-amber-100 text-amber-600 hover:bg-amber-200" 
              : "bg-brand-deep text-white hover:bg-opacity-90"
          )}
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
        </button>
        <button 
          onClick={onReset}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
