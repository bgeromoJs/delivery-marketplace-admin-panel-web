import React from 'react';
import LoadingSkeleton from 'react-loading-skeleton';

export function Skeleton({ className = '' }: { className?: string }) {
  return <LoadingSkeleton aria-hidden className={`admin-skeleton ${className}`} baseColor="var(--admin-skeleton-base)" highlightColor="var(--admin-skeleton-highlight)" duration={1.25} />;
}

export function TableSkeleton({ columns, rows = 7 }: { columns: number; rows?: number }) {
  return <section className="admin-card admin-list-card admin-skeleton-card" role="status" aria-label="Carregando lista">
    <span className="admin-sr-only">Carregando dados</span>
    <div className="approval-table-wrap"><table className="approval-table admin-skeleton-table"><thead><tr>{Array.from({ length: columns }, (_, i) => <th key={i}><Skeleton className="skeleton-heading" /></th>)}</tr></thead>
      <tbody>{Array.from({ length: rows }, (_, row) => <tr key={row}>{Array.from({ length: columns }, (_, col) => <td key={col}><Skeleton className={col === 0 ? 'skeleton-primary' : ''} /></td>)}</tr>)}</tbody>
    </table></div>
    <div className="admin-skeleton-pagination"><Skeleton /><Skeleton /></div>
  </section>;
}

export function DetailSkeleton() {
  return <div className="admin-skeleton-detail" role="status" aria-label="Carregando cadastro">
    <span className="admin-sr-only">Carregando cadastro</span>
    <section className="admin-card"><Skeleton className="skeleton-title" /><div className="admin-skeleton-grid">{Array.from({ length: 8 }, (_, i) => <div key={i}><Skeleton className="skeleton-label" /><Skeleton className="skeleton-value" /></div>)}</div></section>
    <section className="admin-card"><Skeleton className="skeleton-title" /><div className="admin-skeleton-lines">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} />)}</div></section>
  </div>;
}

export function DashboardSkeleton() {
  return <div className="admin-skeleton-dashboard" role="status" aria-label="Carregando fila do suporte">
    <span className="admin-sr-only">Carregando fila do suporte</span>
    <div className="admin-skeleton-stats">{Array.from({ length: 2 }, (_, i) => <div className="admin-skeleton-stat" key={i}><Skeleton className="skeleton-stat-number" /><Skeleton className="skeleton-stat-label" /></div>)}</div>
    <section className="admin-card support-queue admin-skeleton-queue"><div className="admin-skeleton-workspace"><div className="admin-skeleton-task-list">{Array.from({ length: 4 }, (_, i) => <div className="admin-skeleton-task" key={i}><Skeleton className="skeleton-priority-mark" /><div><Skeleton className="skeleton-primary" /><Skeleton className="skeleton-secondary" /></div><Skeleton className="skeleton-action" /></div>)}</div><div className="admin-card admin-skeleton-task-detail"><Skeleton className="skeleton-primary" /><Skeleton className="skeleton-secondary" /><div className="admin-skeleton-detail-fields">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} />)}</div><Skeleton className="skeleton-action" /></div></div></section>
  </div>;
}

export function SettingsSkeleton() {
  return <div className="admin-skeleton-settings" role="status" aria-label="Carregando configurações">
    <span className="admin-sr-only">Carregando configurações</span>
    {Array.from({ length: 4 }, (_, card) => <section className="admin-card" key={card}><Skeleton className="skeleton-title" /><Skeleton className="skeleton-label skeleton-description" /><div className="admin-skeleton-grid">{Array.from({ length: card === 2 ? 4 : 3 }, (_, i) => <div key={i}><Skeleton className="skeleton-label" /><Skeleton className="skeleton-value" /></div>)}</div></section>)}
  </div>;
}
