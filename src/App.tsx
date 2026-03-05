import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { Task } from './types';
import TaskItem from './components/TaskItem';
import AddTaskForm from './components/AddTaskForm';
import TimeSpentChart from './components/TimeSpentChart';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'daily-task-timer-tasks';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function playCompletionSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch {
    // Audio not available
  }
}

function showBrowserNotification(taskName: string) {
  if (Notification.permission === 'granted') {
    new Notification('Task complete!', {
      body: `"${taskName}" has reached its goal.`,
      icon: '/Daily-Task-Timer-2/favicon.ico',
    });
  }
}

async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTasks = useCallback(() => {
    setTasks(loadTasks());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTaskId) {
      interval = setInterval(() => {
        setTasks(prev => {
          const updated = prev.map(t => {
            if (t.id === activeTaskId) {
              return { ...t, timeSpent: t.timeSpent + 1 };
            }
            return t;
          });
          saveTasks(updated);

          // Check for completion
          const active = updated.find(t => t.id === activeTaskId);
          if (active && !active.isIndefinite && active.timeSpent >= active.goalSeconds) {
            setActiveTaskId(null);
            playCompletionSound();
            showBrowserNotification(active.name);
          }

          return updated;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTaskId]);

  const handleAddTask = (taskData: Omit<Task, 'id' | 'timeSpent' | 'sortOrder'>, startNow: boolean) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      ...taskData,
      id,
      timeSpent: 0,
      sortOrder: tasks.length
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(updated);
    if (startNow) {
      requestNotificationPermission();
      setActiveTaskId(id);
    }
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    setTasks(updated);
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    if (activeTaskId === id) setActiveTaskId(null);
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  };

  const handleResetAll = () => {
    const updated = tasks.map(t => ({ ...t, timeSpent: 0 }));
    setTasks(updated);
    saveTasks(updated);
  };

  const handleDeleteAll = () => {
    setActiveTaskId(null);
    setTasks([]);
    saveTasks([]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items: Task[]) => {
        const oldIndex = items.findIndex((i) => i.id === String(active.id));
        const newIndex = items.findIndex((i) => i.id === String(over.id));
        const newItems = arrayMove(items, oldIndex, newIndex).map((t, i) => ({ ...t, sortOrder: i }));
        saveTasks(newItems);
        return newItems;
      });
    }
  };

  const toggleTimer = (id: string) => {
    if (activeTaskId === id) {
      setActiveTaskId(null);
    } else {
      requestNotificationPermission();
      setActiveTaskId(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-brand-deep p-3 rounded-xl shadow-lg shadow-brand-deep/20">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-serif font-bold text-brand-deep tracking-tight">Task Timer</h1>
        </div>
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
          Double-click any task name or goal to edit. Organize your workflow with drag-and-drop.
        </p>
      </header>

      {/* Global Actions */}
      <div className="flex justify-end gap-3 mb-6">
        <button onClick={handleResetAll} className="btn-secondary">
          <RotateCcw className="w-4 h-4" />
          RESET ALL
        </button>
        <button onClick={handleDeleteAll} className="btn-danger">
          <Trash2 className="w-4 h-4" />
          DELETE ALL
        </button>
      </div>

      {/* Task List Table */}
      <div className="timer-card">
        <div className="grid grid-cols-12 gap-4 py-4 px-6 bg-slate-50/50 border-b border-slate-100">
          <div className="col-span-1" />
          <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Task Name</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Time Spent</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Goal</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</div>
        </div>

        <div className="task-list-container max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center text-slate-400 italic font-serif">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-300 mb-2">Your list is empty</h3>
              <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">Add a task below to begin tracking</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence initial={false}>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <TaskItem
                        task={task}
                        isActive={activeTaskId === task.id}
                        onToggle={() => toggleTimer(task.id)}
                        onReset={() => handleUpdateTask(task.id, { timeSpent: 0 })}
                        onDelete={() => handleDeleteTask(task.id)}
                        onUpdate={(updates) => handleUpdateTask(task.id, updates)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Add Task Form */}
      <AddTaskForm onAdd={handleAddTask} />

      {/* Visualization */}
      <TimeSpentChart tasks={tasks} />
    </div>
  );
}
