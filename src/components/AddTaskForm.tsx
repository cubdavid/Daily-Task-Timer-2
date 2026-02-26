import React, { useState } from 'react';
import { Plus, Bell, Play, Infinity } from 'lucide-react';
import { Task } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AddTaskFormProps {
  onAdd: (task: Omit<Task, 'id' | 'timeSpent' | 'sortOrder'>, startNow: boolean) => void;
}

export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [name, setName] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [isNotify, setIsNotify] = useState(false);
  const [startNow, setStartNow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const goalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;
    
    onAdd({
      name,
      goalSeconds,
      isIndefinite,
      isNotify,
    }, startNow);

    // Reset form
    setName('');
    setHours('0');
    setMinutes('0');
    setIsIndefinite(false);
    setIsNotify(false);
    setStartNow(false);
  };

  return (
    <div className="timer-card p-8 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <Plus className="w-5 h-5 text-brand-deep" />
        <h2 className="text-xl font-serif font-bold text-brand-deep">Add New Task</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Task Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Design Landing Page"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-deep/20 transition-all"
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Goal (H)
          </label>
          <input
            type="number"
            min="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-deep/20 transition-all"
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Goal (M)
          </label>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-deep/20 transition-all"
          />
        </div>

        <div className="md:col-span-5 flex flex-wrap items-center gap-6 pb-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isIndefinite}
                onChange={(e) => setIsIndefinite(e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                "w-5 h-5 border-2 rounded transition-all flex items-center justify-center",
                isIndefinite ? "bg-brand-deep border-brand-deep" : "border-slate-300 group-hover:border-slate-400"
              )}>
                {isIndefinite && <Infinity className="w-3 h-3 text-white" />}
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Indefinite</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isNotify}
                onChange={(e) => setIsNotify(e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                "w-5 h-5 border-2 rounded transition-all flex items-center justify-center",
                isNotify ? "bg-brand-deep border-brand-deep" : "border-slate-300 group-hover:border-slate-400"
              )}>
                {isNotify && <Bell className="w-3 h-3 text-white" />}
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Notify</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={startNow}
                onChange={(e) => setStartNow(e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                "w-5 h-5 border-2 rounded transition-all flex items-center justify-center",
                startNow ? "bg-brand-deep border-brand-deep" : "border-slate-300 group-hover:border-slate-400"
              )}>
                {startNow && <Play className="w-3 h-3 text-white fill-current" />}
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Start Now</span>
          </label>

          <button type="submit" className="btn-primary ml-auto">
            <Plus className="w-4 h-4" />
            ADD TASK
          </button>
        </div>
      </form>
    </div>
  );
}
