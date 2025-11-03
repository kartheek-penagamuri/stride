import React from 'react'

interface StackItemProps {
  number: number
  text: string
}

interface HabitStackProps {
  title: string
  items: string[]
}

const StackItem: React.FC<StackItemProps> = ({ number, text }: StackItemProps) => (
  <div className="flex items-center p-4 bg-white/5 rounded-xl mb-3">
    <div className="bg-yellow-400 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">
      {number}
    </div>
    <div className="text-white">{text}</div>
  </div>
)

export const HabitStack: React.FC<HabitStackProps> = ({ title, items }: HabitStackProps) => {
  return (
    <div className="glass rounded-2xl p-6 border-l-4 border-yellow-400">
      <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
      {items.map((item: string, index: number) => (
        <StackItem key={index} number={index + 1} text={item} />
      ))}
    </div>
  )
}