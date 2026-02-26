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

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTaskId) {
      interval = setInterval(() => {
        setTasks(prev => prev.map(t => {
          if (t.id === activeTaskId) {
            const newTime = t.timeSpent + 1;
            // Sync with server occasionally or on pause
            return { ...t, timeSpent: newTime };
          }
          return t;
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTaskId]);

  // Sync active task time to server on pause or every 10 seconds
  useEffect(() => {
    if (!activeTaskId) return;
    const interval = setInterval(() => {
      const activeTask = tasks.find(t => t.id === activeTaskId);
      if (activeTask) {
        fetch(`/api/tasks/${activeTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSpent: activeTask.timeSpent })
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTaskId, tasks]);

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'timeSpent' | 'sortOrder'>, startNow: boolean) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      ...taskData,
      id,
      timeSpent: 0,
      sortOrder: tasks.length
    };

    setTasks([...tasks, newTask]);
    if (startNow) setActiveTaskId(id);

    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  };

  const handleDeleteTask = async (id: string) => {
    if (activeTaskId === id) setActiveTaskId(null);
    setTasks(prev => prev.filter(t => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  };

  const handleResetAll = async () => {
    setTasks(prev => prev.map(t => ({ ...t, timeSpent: 0 })));
    await fetch('/api/tasks/reset', { method: 'POST' });
  };

  const handleDeleteAll = async () => {
    setActiveTaskId(null);
    setTasks([]);
    await fetch('/api/tasks/clear', { method: 'POST' });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items: Task[]) => {
        const oldIndex = items.findIndex((i) => i.id === String(active.id));
        const newIndex = items.findIndex((i) => i.id === String(over.id));
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Sync reorder to server
        fetch('/api/tasks/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds: newItems.map(t => t.id) })
        });

        return newItems;
      });
    }
  };

  const toggleTimer = (id: string) => {
    if (activeTaskId === id) {
      // Sync time before pausing
      const task = tasks.find(t => t.id === id);
      if (task) {
        fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSpent: task.timeSpent })
        });
      }
      setActiveTaskId(null);
    } else {
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
