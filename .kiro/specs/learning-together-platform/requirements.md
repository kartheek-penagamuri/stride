# Requirements Document

## Introduction

The Learning Together Platform (Pactly) is a web-based application that helps people learn better together through small pods (2-4 people), structured sessions, and an AI Session Coach. The platform focuses on transforming solo intent into consistent action via social accountability, structure, and AI scaffolding. The MVP targets narrow outcomes like 30-day discipline sprints (e.g., Gym 3×/week) and skill sprints (e.g., .NET Prompting in 4 weeks).

## Requirements

### Requirement 1: User Onboarding and Goal Setup

**User Story:** As a learner, I want to choose a sprint template and define a concrete plan with scheduled sessions, so that I can start my learning journey with clear structure and accountability.

#### Acceptance Criteria

1. WHEN a user accesses the onboarding flow THEN the system SHALL present available sprint templates (Gym 3×/week, Prompting)
2. WHEN a user selects a sprint template THEN the system SHALL display a form to define an If-Then plan with 3 default time slots and 1 backup slot
3. WHEN a user submits the onboarding form THEN the system SHALL validate all required fields (sprint type, schedule, proof method)
4. IF the form validation passes THEN the system SHALL create a Goal record with schedule and fallback options
5. WHEN goal creation is successful THEN the system SHALL redirect the user to the matching process

### Requirement 2: Pod Matching System

**User Story:** As a learner, I want to be matched into a small pod (2-4 people) based on my preferences and availability, so that I can work with compatible learning partners.

#### Acceptance Criteria

1. WHEN a user completes goal setup THEN the system SHALL initiate the matching process using availability windows, timezone, experience level, and collaboration style
2. WHEN the matching algorithm runs THEN the system SHALL generate pod suggestions with compatibility scores above the minimum threshold
3. IF a suitable match is found within 24 hours THEN the system SHALL send a pod invitation to the user
4. IF no match is found within 24 hours THEN the system SHALL automatically add the user to a waitlist and send a notification
5. WHEN a user receives a pod invitation THEN the system SHALL allow them to accept or request a rematch with one click
6. WHEN a user accepts a pod invitation THEN the system SHALL add them to the pod and notify other pod members

### Requirement 3: Session Management and Orchestration

**User Story:** As a pod member, I want to receive timely reminders and easily join scheduled sessions, so that I can participate consistently without missing meetings.

#### Acceptance Criteria

1. WHEN a session is scheduled THEN the system SHALL send reminders at T-60 minutes and T-10 minutes before the session start time
2. WHEN a user receives a session reminder THEN the system SHALL provide a one-click "Start Session" or "Join Session" button
3. WHEN a user clicks to start/join a session THEN the system SHALL transition the session state from scheduled to active
4. WHEN a session becomes active THEN the system SHALL provide access to embedded video (Jitsi) or external video links (Zoom/Meet)
5. WHEN a session is completed THEN the system SHALL transition the session state to completed and log the attendance
6. WHEN session state changes occur THEN the system SHALL ensure all transitions are idempotent and audit-logged

### Requirement 4: AI Session Coach Integration

**User Story:** As a pod member, I want an AI coach to provide structured agendas and capture session progress, so that our meetings are productive and progress is tracked systematically.

#### Acceptance Criteria

1. WHEN a session starts THEN the AI Coach SHALL generate a pre-session agenda based on the sprint template and previous session progress
2. WHEN the agenda is generated THEN the system SHALL display 3-5 structured steps with timers and a wrap-up checklist
3. WHEN a session is in progress THEN the AI Coach SHALL take structured notes in bullet format
4. WHEN a session ends THEN the AI Coach SHALL propose two specific action items for pod members
5. WHEN action items are created THEN the AI Coach SHALL generate a micro-quiz (3 questions) or proof-of-effort checklist for the next day
6. WHEN Coach outputs are generated THEN the system SHALL store them as versioned CoachDoc records that reference prior session artifacts

### Requirement 5: Daily Check-ins and Progress Tracking

**User Story:** As a learner, I want to submit daily proof-of-effort and reflections, so that I can maintain accountability and track my progress consistently.

#### Acceptance Criteria

1. WHEN a user has action items from a session THEN the system SHALL prompt for a daily check-in submission
2. WHEN submitting a check-in THEN the system SHALL require status confirmation, one win, and one tweak for improvement
3. WHEN submitting a check-in THEN the system SHALL optionally allow RPE (Rate of Perceived Exertion) on a 1-10 scale
4. WHEN submitting a check-in THEN the system SHALL allow optional file uploads or step descriptions as proof-of-effort
5. WHEN a check-in is overdue THEN the system SHALL provide a 12-hour grace window for late submissions
6. WHEN the grace window expires THEN the system SHALL mark the day as missed and suggest a make-up session

### Requirement 6: Streak Management and Make-up Sessions

**User Story:** As a learner, I want to see my progress streaks and schedule make-up sessions when I miss a day, so that I can maintain momentum and recover from setbacks.

#### Acceptance Criteria

1. WHEN a user completes daily check-ins THEN the system SHALL calculate and display current streak counts
2. WHEN a user misses a required session or check-in THEN the system SHALL break the streak and prompt for a make-up session
3. WHEN a make-up session is suggested THEN the system SHALL offer available time slots within the current week
4. WHEN a user schedules a make-up session THEN the system SHALL restore the streak if the make-up is completed successfully
5. WHEN calculating streaks THEN the system SHALL account for streak-freeze tokens (2 per month) that users can apply to maintain streaks during planned absences

### Requirement 7: Pod Safety and Rematch System

**User Story:** As a learner, I want to report problematic behavior and request new pod matches when needed, so that I can maintain a safe and productive learning environment.

#### Acceptance Criteria

1. WHEN a pod member has 2 consecutive no-shows THEN the system SHALL automatically offer rematch options to other pod members
2. WHEN a user requests a rematch THEN the system SHALL process the request within 24 hours SLA
3. WHEN a user encounters inappropriate behavior THEN the system SHALL provide one-click report and block functionality
4. WHEN a report is submitted THEN the system SHALL create an entry in the moderation queue for admin review
5. WHEN rematch requests are processed THEN the system SHALL avoid pairing users with previously blocked or reported members
6. WHEN safety issues are reported THEN the system SHALL implement content filtering and toxicity detection in chat communications

### Requirement 8: Payment and Credit System (Optional)

**User Story:** As a learner, I want to make refundable deposits for attendance insurance, so that I have financial motivation to complete my sprint while protecting against unfair penalties.

#### Acceptance Criteria

1. WHEN a user enrolls in a sprint THEN the system SHALL optionally allow them to make a refundable deposit
2. WHEN deposits are made THEN the system SHALL maintain a clear ledger of credits and transactions
3. WHEN a user completes the minimum required sessions (e.g., ≥9 out of 12) THEN the system SHALL automatically trigger a refund
4. WHEN refund conditions are met THEN the system SHALL process the refund according to the rules engine within 5 business days
5. WHEN payment processing occurs THEN the system SHALL integrate with Stripe for secure transaction handling
6. WHEN users view their account THEN the system SHALL display current credit balance and transaction history

### Requirement 9: Notification and Communication System

**User Story:** As a user, I want to receive timely notifications about sessions, matches, and progress updates through my preferred channels, so that I stay informed and engaged with my learning pod.

#### Acceptance Criteria

1. WHEN notification events occur THEN the system SHALL support email, push notifications (PWA), and optional SMS delivery
2. WHEN sending notifications THEN the system SHALL respect user-defined quiet hours based on their timezone
3. WHEN users join the platform THEN the system SHALL allow them to configure notification preferences for different event types
4. WHEN session reminders are sent THEN the system SHALL include session details, join links, and agenda previews
5. WHEN pod matches are made THEN the system SHALL notify all members with podmate information and introduction prompts
6. WHEN check-ins are overdue THEN the system SHALL send gentle reminder notifications with make-up session suggestions

### Requirement 10: Integration and Calendar Support

**User Story:** As a user, I want to sync my learning sessions with my personal calendar and connect relevant external tools, so that I can manage my schedule effectively and leverage existing workflows.

#### Acceptance Criteria

1. WHEN a user schedules sessions THEN the system SHALL provide ICS calendar export functionality
2. WHEN users want calendar integration THEN the system SHALL support Google Calendar and Microsoft Calendar OAuth connections
3. WHEN using the .NET Prompting track THEN the system SHALL allow users to link GitHub repositories for code collaboration
4. WHEN sessions use external video THEN the system SHALL support Zoom and Google Meet link integration
5. WHEN users track fitness activities THEN the system SHALL optionally integrate with Apple Health, Google Fit, or Strava for proof-of-effort
6. WHEN calendar events are created THEN the system SHALL include session agendas, pod member details, and join instructions