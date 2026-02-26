import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Task } from '../types';

interface TimeSpentChartProps {
  tasks: Task[];
}

const COLORS = ['#004d7a', '#0066a1', '#0080c9', '#0099f1', '#26b3ff', '#4dc7ff'];

export default function TimeSpentChart({ tasks }: TimeSpentChartProps) {
  const data = tasks
    .filter(t => t.timeSpent > 0)
    .map(t => ({
      name: t.name,
      value: t.timeSpent
    }));

  if (data.length === 0) {
    return (
      <div className="timer-card p-8 mt-8 flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-serif font-bold text-brand-deep mb-8 self-start uppercase tracking-tight">Time Spent on Tasks</h2>
        <div className="flex flex-col items-center opacity-20">
          <div className="w-48 h-48 rounded-full border-8 border-slate-200 flex items-center justify-center">
             <div className="w-32 h-32 rounded-full border-8 border-slate-200" />
          </div>
          <p className="mt-4 font-serif italic text-slate-400">No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timer-card p-8 mt-8">
      <h2 className="text-xl font-serif font-bold text-brand-deep mb-4 uppercase tracking-tight">Time Spent on Tasks</h2>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={140}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => {
                const h = Math.floor(value / 3600);
                const m = Math.floor((value % 3600) / 60);
                const s = value % 60;
                return `${h}h ${m}m ${s}s`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }} 
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
