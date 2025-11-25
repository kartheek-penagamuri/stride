# Implementation Plan

- [x] 1. Set up OpenAI SDK and environment configuration

  - Install openai and uuid packages via npm
  - Create .env.local file with OpenAI API key configuration
  - Add environment variable types to next-env.d.ts or create env.d.ts
  - _Requirements: 3.1_

- [x] 2. Create OpenAI service module

  - Create lib/services/openai.ts with OpenAI client initialization
  - Implement generateHabits() function with structured prompt engineering
  - Add API key validation function
  - Implement error handling for OpenAI API responses
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Create AI habit generation types and interfaces

  - Add AIGeneratedHabit interface to lib/types.ts
  - Add AtomicPrinciple enum to lib/types.ts
  - Add GenerateHabitsRequest and GenerateHabitsResponse types
  - Add OpenAIHabitResponse schema type
  - _Requirements: 3.2, 4.1, 4.2, 4.3, 4.4, 5.1_

- [x] 4. Implement AI habits API route

  - Create app/api/ai/generate-habits/route.ts
  - Implement POST handler with request validation
  - Integrate OpenAI service to generate habits
  - Add response formatting and error handling
  - Implement retry logic with exponential backoff
  - _Requirements: 3.1, 3.2, 3.5, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5. Create GoalForm component

  - Create components/GoalForm.tsx with textarea input
  - Implement character counter (500 char limit)
  - Add client-side validation for empty and length constraints
  - Add placeholder text with example goals
  - Implement submit handler with loading state
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Create LoadingState component

  - Create components/LoadingState.tsx with animated spinner
  - Add status messages for different loading phases
  - Implement 30-second timeout warning display
  - Style with Tailwind CSS matching existing design
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Create HabitReviewCard component

  - Create components/HabitReviewCard.tsx
  - Display habit title, cue, action, reward in structured format
  - Show suggested time with reasoning
  - Add checkbox for habit selection
  - Display atomic principles badges
  - Style with Tailwind CSS and glass morphism effects
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 6.1, 6.2_

- [x] 8. Create GoalInputModal component


  - Create components/GoalInputModal.tsx with modal overlay
  - Implement multi-step state management (input, loading, review, error)
  - Add modal open/close functionality with backdrop
  - Integrate GoalForm component
  - Integrate LoadingState component
  - Integrate HabitReviewCard list for review step
  - Implement habit selection logic with state management
  - Add error display with retry functionality
  - Prevent background interaction when modal is open
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3_

- [x] 9. Integrate modal with home page

  - Update app/page.tsx to import GoalInputModal
  - Add modal state management (isOpen)
  - Connect "Start Your Journey" button to open modal
  - Implement onClose handler
  - _Requirements: 1.1_

- [x] 10. Implement habit saving functionality

  - Add API call to save selected habits in GoalInputModal
  - Map AIGeneratedHabit to CreateHabitRequest format
  - Handle bulk habit creation via existing /api/habits endpoint
  - Add success feedback and redirect to dashboard
  - Implement error handling for save failures
  - _Requirements: 6.3, 6.4, 6.5, 8.1, 8.2_

- [x] 11. Add API client function for habit generation

  - Add generateHabitsFromGoal() function to lib/api.ts
  - Implement request/response handling
  - Add error handling and typing
  - _Requirements: 3.1, 3.5, 8.1_

- [x] 12. Implement comprehensive error handling

  - Add error message constants to lib/constants.ts or inline
  - Implement error state display in GoalInputModal
  - Add retry button functionality
  - Ensure all error types are handled with user-friendly messages
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13. Add responsive design and animations

  - Ensure modal is responsive on mobile devices
  - Add smooth transitions for modal open/close
  - Add loading animations and micro-interactions
  - Test on various screen sizes
  - _Requirements: 1.1, 7.1, 7.2_

- [x] 14. Create environment configuration documentation

  - Update README.md with OpenAI API key setup instructions
  - Document required environment variables
  - Add example .env.example file
  - _Requirements: 3.1_
