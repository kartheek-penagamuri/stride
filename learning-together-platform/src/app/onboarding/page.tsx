'use client'

import { useState } from 'react'
import { SprintTemplate } from '@/types'
import { SprintTemplateSelection } from '@/components/onboarding/SprintTemplateSelection'
import { IfThenPlanBuilder } from '@/components/onboarding/IfThenPlanBuilder'
import { GoalCreation } from '@/components/onboarding/GoalCreation'
import { IfThenPlanInput } from '@/lib/validations/schedule-validation'

export default function OnboardingPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<SprintTemplate | null>(null)
  const [ifThenPlan, setIfThenPlan] = useState<IfThenPlanInput | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  const handleTemplateSelect = (template: SprintTemplate) => {
    setSelectedTemplate(template)
  }

  const handleContinue = () => {
    if (selectedTemplate && currentStep === 1) {
      setCurrentStep(2)
    }
  }

  const handlePlanComplete = (plan: IfThenPlanInput) => {
    setIfThenPlan(plan)
    setCurrentStep(3)
  }

  const handleGoalCreated = (goalId: string) => {
    // Redirect to matching or dashboard
    window.location.href = `/dashboard?goalCreated=${goalId}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                1
              </div>
              <span className={`text-sm ${currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Choose Sprint
              </span>
            </div>
            
            <div className="flex-1 mx-4 h-px bg-gray-200"></div>
            
            <div className="flex items-center space-x-4">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                2
              </div>
              <span className={`text-sm ${currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Set Schedule
              </span>
            </div>
            
            <div className="flex-1 mx-4 h-px bg-gray-200"></div>
            
            <div className="flex items-center space-x-4">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                3
              </div>
              <span className={`text-sm ${currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Create Goal
              </span>
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentStep === 1 && (
            <>
              <SprintTemplateSelection
                selectedTemplateId={selectedTemplate?.id}
                onTemplateSelect={handleTemplateSelect}
              />
              
              {selectedTemplate && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                  >
                    Continue to Schedule Setup
                  </button>
                </div>
              )}
            </>
          )}

          {currentStep === 2 && selectedTemplate && (
            <IfThenPlanBuilder
              template={selectedTemplate}
              onPlanComplete={handlePlanComplete}
            />
          )}

          {currentStep === 3 && selectedTemplate && ifThenPlan && (
            <GoalCreation
              template={selectedTemplate}
              plan={ifThenPlan}
              onGoalCreated={handleGoalCreated}
            />
          )}
        </div>
      </div>
    </div>
  )
}