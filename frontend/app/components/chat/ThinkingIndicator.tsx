export function ThinkingIndicator() {
  return (
    <div className='flex flex-col gap-2'>
      <span className='font-mono text-[10px] font-semibold tracking-widest uppercase text-[#3fb950]'>
        sentra
      </span>
      <div className='flex items-center gap-1.5 py-1'>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className='w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse'
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
