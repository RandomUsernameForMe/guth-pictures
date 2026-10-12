interface Props {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  savingLabel: string;
  className: string;
}

export function SaveSelectionButton({ saving, saved, onClick, savingLabel, className }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`${className} bg-white text-black text-sm font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors`}
    >
      {saving ? savingLabel : saved ? "✓ Uloženo" : "Uložit výběr"}
    </button>
  );
}
