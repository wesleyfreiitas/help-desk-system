'use client';

import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface StatusChartProps {
  data: { name: string; value: number; color: string }[];
}

export default function StatusChart({ data }: StatusChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: '12px',
        color: 'var(--text-muted)'
      }}>
        Nenhum dado encontrado para exibição.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 400, marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#cbd5e1'} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              backgroundColor: 'var(--bg-card)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
