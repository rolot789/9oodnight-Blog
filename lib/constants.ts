const BASE_CATEGORIES = [
  "Mathematics",
  "Development",
  "DevOps",
  "Computer Science",
  "Crypto",
  "Research",
] as const

export const CATEGORIES = [...BASE_CATEGORIES, "General", "Draft"] as const

export const TODO_CATEGORIES = ["Draft", "General", ...BASE_CATEGORIES] as const

export const POST_CATEGORIES: string[] = [...BASE_CATEGORIES]

export const FILTER_CATEGORIES = ["All", ...BASE_CATEGORIES] as const

export const STATUSES = ["Icebox", "Draft", "Planned", "In Progress", "Done"] as const

export const STATUS_LABELS: Record<string, string> = {
  Icebox: "Icebox",
  Draft: "Draft",
  Planned: "진행예정",
  "In Progress": "진행중",
  Done: "완료",
}

export const CATEGORY_COLORS: Record<string, string> = {
  Draft: "text-gray-500 border-gray-500",
  General: "text-[#6096ba] border-[#6096ba]",
  Mathematics: "text-purple-600 border-purple-600",
  Development: "text-emerald-600 border-emerald-600",
  DevOps: "text-orange-600 border-orange-600",
  "Computer Science": "text-blue-600 border-blue-600",
  Crypto: "text-yellow-600 border-yellow-600",
  Research: "text-rose-600 border-rose-600",
}

export const DEFAULT_IMAGES = {
  THUMBNAIL: "/Thumbnail.jpg",
  PLACEHOLDER: "/placeholder.svg",
}
