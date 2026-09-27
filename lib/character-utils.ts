export function matchesCharacterTag(
  profile: { name: string; id?: string; aliases?: { name: string }[] },
  tag: string
): boolean {
  const normTag = tag.trim().toLowerCase();
  const normName = profile.name.trim().toLowerCase();
  const normId = (profile.id || "").trim().toLowerCase();
  if (normTag === normName || (normId && normTag === normId)) return true;

  if (normTag.includes(`(${normName})`) || normTag.startsWith(`${normName} (`)) return true;
  if (normId && (normTag.includes(`(${normId})`) || normTag.startsWith(`${normId} (`))) return true;

  if (profile.aliases) {
    for (const a of profile.aliases) {
      const an = a.name.trim().toLowerCase();
      if (normTag === an) return true;
      if (normTag.includes(`(${an})`) || normTag.startsWith(`${an} (`)) return true;
    }
  }

  return false;
}
