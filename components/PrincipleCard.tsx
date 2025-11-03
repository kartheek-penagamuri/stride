import React from 'react'

interface PrincipleCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export const PrincipleCard: React.FC<PrincipleCardProps> = ({ icon, title, description }: PrincipleCardProps) => {
  return (
    <div className="card-hover bg-white rounded-2xl p-8 text-center border-l-4 border-indigo-500 shadow-lg">
      <div className="text-5xl mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}