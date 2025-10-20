'use client'

import { useState, useEffect } from 'react'
import { SprintTemplate, ApiResponse } from '@/types'
import { SprintTemplateCard } from './SprintTemplateCard'
import { Loader2, AlertCircle, Target, CheckCircle } from 'lucide-react'

interface SprintTemplateSelectionProps {
  selectedTemplateId?: string
  onTemplateSelect: (template: SprintTemplate) => void
  className?: string
}

export function SprintTemplateSelection({ 
  selectedTemplateId, 
  onTemplateSelect,
  className = ''
}: SprintTemplateSelectionProps) {
  const [templates, setTemplates] = useState<SprintTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sprint-templates')
      const data: ApiResponse<SprintTemplate[]> = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch templates')
      }

      setTemplates(data.data || [])
    } catch (err) {
      console.error('Error fetching sprint templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      onTemplateSelect(template)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading sprint templates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`py-12 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Templates
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTemplates}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className={`py-12 ${className}`}>
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Templates Available
          </h3>
          <p className="text-gray-600">
            Sprint templates are currently being prepared. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Sprint
        </h2>
        <p className="text-gray-600">
          Select a sprint template that matches your learning goals. Each sprint includes structured sessions, 
          accountability partners, and AI-powered coaching.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((template) => (
          <SprintTemplateCard
            key={template.id}
            template={template}
            selected={selectedTemplateId === template.id}
            onSelect={handleTemplateSelect}
          />
        ))}
      </div>

      {selectedTemplateId && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-800 font-medium">
              Sprint template selected! Continue to set up your schedule.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}