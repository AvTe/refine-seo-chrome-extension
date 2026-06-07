import { Check, X, AlertTriangle, Info } from 'lucide-react';

interface StatusCheckProps {
  label: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  detail?: string;
}

const statusConfig = {
  pass: {
    icon: <Check size={14} />,
    label: 'Enabled',
    classes: 'text-green-600 bg-green-50',
    dotColor: 'bg-green-500',
  },
  fail: {
    icon: <X size={14} />,
    label: 'Missing',
    classes: 'text-red-600 bg-red-50',
    dotColor: 'bg-red-500',
  },
  warning: {
    icon: <AlertTriangle size={14} />,
    label: 'Warning',
    classes: 'text-amber-600 bg-amber-50',
    dotColor: 'bg-amber-500',
  },
  info: {
    icon: <Info size={14} />,
    label: 'Info',
    classes: 'text-blue-600 bg-blue-50',
    dotColor: 'bg-blue-500',
  },
};

export default function StatusCheck({ label, status, detail }: StatusCheckProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface transition-colors">
      <div className="flex items-center gap-2.5">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${config.classes}`}>
          {config.icon}
        </div>
        <div>
          <span className="text-sm text-gray-700">{label}</span>
          {detail && (
            <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
          )}
        </div>
      </div>
      <span className={`badge ${status === 'pass' ? 'badge-success' : status === 'fail' ? 'badge-danger' : status === 'warning' ? 'badge-warning' : 'badge-info'}`}>
        {config.label}
      </span>
    </div>
  );
}
