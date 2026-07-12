import { useMemo } from 'react';
import EmptyState from './EmptyState';
import { DashboardSkeleton } from './LoadingSkeleton';

export default function Table({ 
  columns, 
  data, 
  loading, 
  emptyIcon, 
  emptyTitle, 
  emptyMessage, 
  onRowClick,
  rowKey = 'id'
}) {
  const renderedContent = useMemo(() => {
    if (loading) {
      return (
        <div className="p-6">
          <DashboardSkeleton />
        </div>
      );
    }
    
    if (!data || data.length === 0) {
      return (
        <div className="p-12 animate-fade-in-up">
          <EmptyState 
            icon={emptyIcon} 
            title={emptyTitle || 'No data found'} 
            message={emptyMessage} 
          />
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse responsive-table">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  className={`p-4 text-xs font-semibold text-text-dim uppercase tracking-wider ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {data.map((row, rowIndex) => {
              const staggerClass = rowIndex < 5 ? `animate-stagger-${rowIndex + 1}` : '';
              
              return (
                <tr 
                  key={row[rowKey] || rowIndex} 
                  onClick={() => onRowClick?.(row)}
                  className={`table-row-hover animate-fade-in-up ${staggerClass} ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={`p-4 ${col.cellClassName || ''}`}
                      data-label={col.header}
                    >
                      {col.render ? col.render(row, rowIndex) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }, [columns, data, loading, emptyIcon, emptyTitle, emptyMessage, onRowClick, rowKey]);

  return (
    <div className="w-full bg-transparent">
      {renderedContent}
    </div>
  );
}
