'use client';

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function TimeSeriesChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Line type="monotone" dataKey="abertos" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Abertos (diário)" />
          <Line type="monotone" dataKey="fechados" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Fechados (diário)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProductRankingChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <BarChart layout="vertical" data={data} margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={100} tickLine={false} axisLine={false} />
          <Tooltip 
             contentStyle={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
             cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
          />
          <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SLARingChart({ percentage }: { percentage: number }) {
  const data = [
    { name: 'Cumprido', value: percentage },
    { name: 'Atrasado', value: 100 - percentage }
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            <Cell fill="#6366f1" />
            <Cell fill="#ef4444" />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{percentage}%</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cumprido</div>
      </div>
    </div>
  );
}

export function ProductDistributionPie({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="count"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
