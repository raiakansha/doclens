import React from 'react';
import type { DocumentStatus } from '../types';

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

const config: Record<DocumentStatus, { label: string; classes: string; dot: string }> = {
  UPLOADING: {
    label: 'Uploading',
    classes: 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
    dot: 'bg-blue-400 animate-pulse',
  },
  PROCESSING: {
    label: 'Processing',
    classes: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
    dot: 'bg-amber-400 animate-pulse',
  },
  INDEXED: {
    label: 'Indexed',
    classes: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
    dot: 'bg-emerald-400',
  },
  FAILED: {
    label: 'Failed',
    classes: 'bg-red-900/40 text-red-300 border border-red-700/40',
    dot: 'bg-red-400',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const { label, classes, dot } = config[status] ?? config.FAILED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${classes} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

export default StatusBadge;
