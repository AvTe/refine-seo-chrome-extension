import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}

export default function SectionCard({
  title,
  children,
  badge,
  defaultOpen = true,
  collapsible = true,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="card animate-fade-in">
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</h3>
          {badge}
        </div>
        {collapsible && (
          <ChevronDown
            size={16}
            className={`text-gray-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}
