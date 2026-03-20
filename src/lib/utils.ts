export type ClassValue = string | number | null | undefined | false | ClassDictionary | Array<ClassValue>
export interface ClassDictionary {
  [id: string]: unknown
}

function toVal(mix: ClassValue): string {
  if (mix === null || mix === undefined || mix === false) return ""
  if (typeof mix === "string" || typeof mix === "number") return String(mix)
  if (Array.isArray(mix)) return mix.map(toVal).filter(Boolean).join(" ")
  if (typeof mix === "object") {
    return Object.keys(mix)
      .filter((k) => (mix as ClassDictionary)[k])
      .join(" ")
  }
  return ""
}

export function cn(...inputs: ClassValue[]) {
  return inputs.map(toVal).filter(Boolean).join(" ")
}
