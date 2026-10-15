interface InviteInput {
  url: string;
  password: string;
  expiresAt: string;
  maxSelection?: number | null;
}

function formatCzDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

export function formatGalleryInvite({ url, password, expiresAt, maxSelection }: InviteInput): string {
  const lines = [
    "Dobrý den,",
    "",
    "vaše fotky jsou připravené. Najdete je v online galerii:",
    url,
    "",
    `Heslo: ${password}`,
    `Galerie je dostupná do ${formatCzDate(expiresAt)}.`,
  ];
  if (maxSelection) {
    lines.push(`Do výběru můžete označit nejvýše ${maxSelection} fotek.`);
  }
  lines.push("", "Tomáš");
  return lines.join("\n");
}
