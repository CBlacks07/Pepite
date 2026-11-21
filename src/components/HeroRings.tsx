/** Motif décoratif de l'accueil : dix membres en cercle, le premier en or. */
export function HeroRings() {
  const dots = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 10;
    return { cx: (100 + 70 * Math.cos(a)).toFixed(1), cy: (100 + 70 * Math.sin(a)).toFixed(1), gold: i === 0 };
  });
  return (
    <svg className="rings" viewBox="0 0 200 200" aria-hidden>
      <circle cx="100" cy="100" r="44" />
      <circle cx="100" cy="100" r="70" />
      {dots.map((d, i) => (
        <circle key={i} className={`d${d.gold ? ' g' : ''}`} cx={d.cx} cy={d.cy} r={d.gold ? 6 : 4.5} />
      ))}
    </svg>
  );
}
