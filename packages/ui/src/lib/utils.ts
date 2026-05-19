type ClassValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | ClassValue[]
  | { [key: string]: any }

function toClassNames(value: ClassValue): string[] {
  if (!value) return []
  if (typeof value === "string" || typeof value === "number") return [`${value}`]
  if (Array.isArray(value)) return value.flatMap(toClassNames)
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
  }
  return []
}

export function cn(...inputs: ClassValue[]) {
  return inputs.flatMap(toClassNames).join(" ")
}

