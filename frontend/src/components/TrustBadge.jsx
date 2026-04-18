// src/components/TrustBadge.jsx - Visual trust score indicator
export default function TrustBadge({ score, small = false }) {
  // Determine color and label based on score range
  const getLevel = (s) => {
    if (s >= 80) return { label: 'Trusted', color: 'bg-green-100 text-green-700', icon: '⭐' };
    if (s >= 60) return { label: 'Reliable', color: 'bg-ocean-100 text-ocean-700', icon: '👍' };
    if (s >= 40) return { label: 'New', color: 'bg-sand-100 text-yellow-700', icon: '🌱' };
    return { label: 'Low', color: 'bg-red-100 text-red-600', icon: '⚠️' };
  };

  const level = getLevel(score);

  if (small) {
    return (
      <span className={`trust-badge ${level.color} text-xs`}>
        {level.icon} {score}
      </span>
    );
  }

  return (
    <div className={`trust-badge ${level.color} gap-2 px-3 py-1.5`}>
      <span>{level.icon}</span>
      <span className="font-semibold">{score} — {level.label}</span>
    </div>
  );
}
