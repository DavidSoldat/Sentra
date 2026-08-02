export default function TierBadge({
  tier,
  cancelAt,
}: {
  tier: 'FREE' | 'PRO';
  cancelAt: string | null;
}) {
  if (tier === 'PRO' && cancelAt) {
    const date = new Date(cancelAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return (
      <span className='font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'>
        PRO · ends {date}
      </span>
    );
  }
  return (
    <span
      className={`font-mono text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
        tier === 'PRO'
          ? 'bg-[#316dca]/15 text-[#316dca] border border-[#316dca]/30'
          : 'bg-[#21262d] text-[#6e7681] border border-[#2d333b]'
      }`}
    >
      {tier}
    </span>
  );
}
