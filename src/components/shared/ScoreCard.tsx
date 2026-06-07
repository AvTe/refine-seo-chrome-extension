import { getScoreColor } from '@/utils/scoring';

interface ScoreCardProps {
  label: string;
  score: number;
  subtitle?: string;
  compact?: boolean;
}

export default function ScoreCard({ label, score, subtitle, compact = false }: ScoreCardProps) {
  const color = getScoreColor(score);

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${score}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-sm font-semibold tabular-nums w-7 text-right" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color }}>
            {score}
            <span className="text-sm font-normal text-gray-400"> / 100</span>
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full border-[3px] flex items-center justify-center" style={{ borderColor: color }}>
          <span className="text-xs font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
    </div>
  );
}
