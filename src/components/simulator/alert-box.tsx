import { Info, TriangleAlert } from 'lucide-react';

type AlertType = 'info' | 'warning';

interface AlertBoxProps {
  type: AlertType;
  title: string;
  message: string;
}

const alertStyles = {
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-blue-700',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    message: 'text-amber-700',
  },
};

export default function AlertBox({ type, title, message }: AlertBoxProps) {
  const styles = alertStyles[type];
  const Icon = type === 'info' ? Info : TriangleAlert;

  return (
    <div className={`rounded-xl border ${styles.container} p-6`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.icon} mt-0.5 shrink-0`} />
        <div>
          <h3 className={`text-sm font-semibold ${styles.title} mb-1`}>
            {title}
          </h3>
          <p className={`text-sm ${styles.message}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
