# Atomic Habits Tracker - Hackathon Pitch Deck

---

## Slide 1: The Problem

**82% of people fail their New Year's resolutions by February.**

Why?
- Goals are vague ("get healthier")
- No clear action plan
- No tracking system
- Overwhelming to start

[IMAGE: Person overwhelmed looking at generic goal list]

---

## Slide 2: Why This Matters

**Habits shape our lives.**

- Small daily actions compound into massive results
- But most people don't know HOW to build effective habits
- Existing apps are either too simple (checkboxes) or too complex (gamification overload)

**We needed something different.**

[IMAGE: Graph showing compound effect of small habits over time]

---

## Slide 3: Our Solution

**AI-powered habit builder based on proven science.**

Transform any goal → Actionable atomic habits

- Powered by James Clear's Atomic Habits framework
- AI generates personalized habit stacks
- Zero-friction tracking
- Built with Kiro

[IMAGE: Screenshot of goal input → generated habits flow]

---

## Slide 4: How We Built It - Spec-Driven Development

**Started with clarity, not code.**

Kiro's spec system:
- `requirements.md` → What we're building
- `design.md` → How it works
- `tasks.md` → Step-by-step implementation

**Result:** Clear roadmap before writing a single line of code.

[IMAGE: Split screen showing spec files and generated code]

---

## Slide 5: How We Built It - Steering Docs

**Taught Kiro our project DNA.**

3 steering documents:
- `tech.md` → Stack decisions (Next.js, SQLite, OpenAI)
- `structure.md` → Code organization patterns
- `product.md` → User experience principles

**Result:** Consistent code across 40+ files, zero context switching.

[IMAGE: Steering docs → consistent codebase visualization]

---

## Slide 6: How We Built It - Autopilot Mode

**From spec to working feature in minutes.**

Kiro Autopilot:
- Read specs → Generate code → Run tests → Fix issues
- Built entire AI habit generation system semi-autonomously
- Database layer with 15+ operations
- Full authentication flow

**Result:** 10x faster than traditional development.

[IMAGE: Time comparison - traditional vs Kiro Autopilot]

---

## Slide 7: How We Built It - Model Selection

**Right AI for the right job.**

Kiro's flexible model selection:
- Claude for detailed code generation
- Mostly used "Auto" mode to let Kiro decide the model 
- Switched models mid-development based on task

**Result:** Optimal quality and cost balance.

[IMAGE: Different models used for different features]

---

## Slide 8: What We Built

**Full-stack habit tracker in 72 hours:**

✓ AI habit generation with clarifying questions
✓ SQLite database with 15+ operations
✓ Streak tracking & progress visualization
✓ Responsive UI with glass morphism
✓ Cookie-based authentication
✓ Property-based testing suite

**Tech:** Next.js 14, TypeScript, OpenAI, SQLite

**Try it:** [Demo Link]

[IMAGE: Dashboard screenshot showing habit stacks and streaks]

---

## Appendix: Key Metrics

- **40+ files** generated
- **2,000+ lines** of production code
- **15+ database** operations
- **3 major features** (Auth, AI Generation, Tracking)
- **72 hours** from idea to demo
- **Zero** runtime errors in production build

**Kiro made this possible.**
