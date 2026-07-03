'use client';

interface TabsProps {
  active: 'chat' | 'review';
  onChange: (tab: 'chat' | 'review') => void;
}

const TABS: { id: 'chat' | 'review'; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'review', label: 'Review' },
];

export function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className='inline-flex rounded-md border border-[#2d333b] bg-[#0d1117] p-0.5 font-mono text-sm'>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1 rounded transition-colors ${
            active === tab.id
              ? 'bg-[#161b22] text-[#e6edf3]'
              : 'text-[#768390] hover:text-[#cdd9e5]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
