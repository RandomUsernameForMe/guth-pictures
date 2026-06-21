"use client";

import { COMPOSITIONS } from "./compositions";

interface Props {
  num: string;
  title: string;
  /** Short intro line shown above the chips. */
  intro: string;
  selected: number;
  onSelect: (i: number) => void;
  onHover: (i: number | null) => void;
  active: boolean;
}

export function CompositionPicker({ num, title, intro, selected, onSelect, onHover, active }: Props) {
  const sel = COMPOSITIONS[selected];
  return (
    <div className={`f101-card${active ? " f101-card--active" : ""}`}>
      <div className="f101-card-num">{num}</div>
      <h2 className="f101-card-title">{title}</h2>
      <p className="f101-card-body">{intro}</p>
      <div className="f101-chips" onMouseLeave={() => onHover(null)}>
        {COMPOSITIONS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={`f101-chip${i === selected ? " f101-chip--on" : ""}`}
            aria-pressed={i === selected}
            onClick={() => onSelect(i)}
            onMouseEnter={() => onHover(i)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="f101-card-body">{sel.body}</p>
    </div>
  );
}
