'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface BarChartProps {
  data: { name: string; value: number }[];
  color?: string;
}

export default function GenericBarChart({ data, color = 'var(--primary)' }: BarChartProps) {
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
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false} 
            tickLine={false}
            tick={{ fontSize: 12, fill: 'var(--text-main)', fontWeight: 500 }}
            width={150}
          />
          <Tooltip 
            cursor={{ fill: 'var(--bg-elevated)' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              backgroundColor: 'var(--bg-card)'
            }}
          />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.1)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
