import { Fragment } from 'react';

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={key}
          className='rounded bg-[#161B22] px-1 py-0.5 text-[#79C0FF] text-[13px]'
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className='text-[#E6EDF3] font-semibold'>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function FindingsText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className='space-y-2 text-[13px] leading-relaxed text-[#8B949E]'>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        const key = `line-${idx}`;

        if (!trimmed) return null;

        if (trimmed.startsWith('### ')) {
          return (
            <p key={key} className='text-[#E6EDF3] font-semibold mt-3'>
              {renderInline(trimmed.slice(4), key)}
            </p>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={key} className='flex gap-2 pl-1'>
              <span className='text-[#316DCA] select-none'>›</span>
              <span>{renderInline(trimmed.slice(2), key)}</span>
            </div>
          );
        }

        return <p key={key}>{renderInline(trimmed, key)}</p>;
      })}
    </div>
  );
}
