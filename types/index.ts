export interface Principle {
  icon: React.ReactNode
  title: string
  description: string
}

export interface HabitStackData {
  title: string
  items: string[]
}

export interface NavigationItem {
  label: string
  href: string
  onClick?: () => void
}