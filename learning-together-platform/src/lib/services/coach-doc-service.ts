import { PrismaClient } from '@prisma/client'
import { 
  AgendaItem, 
  SessionNotes, 
  ActionItem, 
  Quiz, 
  ProofChecklist,
  SprintType 
} from '@/types'
import { SprintTemplateService } from './sprint-template-service'
import { 
  validateCoachDocCreation, 
  validateCoachDocUpdate,
  validateAgendaTiming,
  validateQuizAnswers,
  validateActionItemAssignments,
  validateProofChecklistCompletion
} from '@/lib/validations/coach-doc-validation'

const prisma = new PrismaClient()

export interface CreateCoachDocData {
  sessionId: string
  version?: number
  agenda?: AgendaItem[]
  notes?: SessionNotes
  actionItems?: ActionItem[]
  quiz?: Quiz
  proofChecklist?: ProofChecklist
}

export interface UpdateCoachDocData {
  agenda?: AgendaItem[]
  notes?: SessionNotes
  actionItems?: ActionItem[]
  quiz?: Quiz
  proofChecklist?: ProofChecklist
}

export interface CoachDocWithDetails {
  id: string
  sessionId: string
  version: number
  agenda?: AgendaItem[]
  notes?: SessionNotes
  actionItems?: ActionItem[]
  quiz?: Quiz
  proofChecklist?: ProofChecklist
  createdAt: Date
  session?: {
    id: string
    scheduledAt: Date
    pod: {
      id: string
      sprintType: string
      memberships: Array<{
        userId: string
        user: { id: string; name?: string }
      }>
    }
  }
}

export class CoachDocService {
  /**
   * Create a new coach document
   */
  static async createCoachDoc(data: CreateCoachDocData): Promise<CoachDocWithDetails> {
    // Validate input data
    const validation = validateCoachDocCreation(data)
    if (!validation.success) {
      throw new Error(`Invalid coach document data: ${validation.error.message}`)
    }

    // Verify session exists
    const session = await prisma.learningSession.findUnique({
      where: { id: data.sessionId },
      include: {
        pod: {
          include: {
            memberships: {
              include: { user: { select: { id: true, name: true } } }
            }
          }
        }
      }
    })

    if (!session) {
      throw new Error('Session not found')
    }

    // Validate agenda timing if provided
    if (data.agenda) {
      const timingValidation = validateAgendaTiming(data.agenda)
      if (!timingValidation.isValid) {
        throw new Error(timingValidation.message)
      }
    }

    // Validate quiz answers if provided
    if (data.quiz) {
      const quizValidation = validateQuizAnswers(data.quiz)
      if (!quizValidation.isValid) {
        throw new Error(`Quiz validation failed: ${quizValidation.errors.join(', ')}`)
      }
    }

    // Validate action item assignments if provided
    if (data.actionItems) {
      const participantIds = session.pod.memberships.map((m: { userId: string }) => m.userId)
      const assignmentValidation = validateActionItemAssignments(data.actionItems, participantIds)
      if (!assignmentValidation.isValid) {
        throw new Error(`Action item validation failed: ${assignmentValidation.errors.join(', ')}`)
      }
    }

    // Get next version number
    const latestDoc = await prisma.coachDoc.findFirst({
      where: { sessionId: data.sessionId },
      orderBy: { version: 'desc' }
    })
    const version = data.version || (latestDoc ? latestDoc.version + 1 : 1)

    // Create the coach document
    const coachDoc = await prisma.coachDoc.create({
      data: {
        sessionId: data.sessionId,
        version,
        agenda: JSON.parse(JSON.stringify(data.agenda || [])),
        notes: data.notes ? JSON.parse(JSON.stringify(data.notes)) : null,
        actionItems: JSON.parse(JSON.stringify(data.actionItems || [])),
        quiz: data.quiz ? JSON.parse(JSON.stringify(data.quiz)) : null,
        proofChecklist: data.proofChecklist ? JSON.parse(JSON.stringify(data.proofChecklist)) : null
      },
      include: {
        session: {
          include: {
            pod: {
              include: {
                memberships: {
                  include: { user: { select: { id: true, name: true } } }
                }
              }
            }
          }
        }
      }
    })

    return this.mapToCoachDocWithDetails(coachDoc)
  }

  /**
   * Get coach document by session and version
   */
  static async getCoachDoc(sessionId: string, version?: number): Promise<CoachDocWithDetails | null> {
    const where: Record<string, unknown> = { sessionId }
    if (version) {
      where.version = version
    }

    const coachDoc = await prisma.coachDoc.findFirst({
      where,
      include: {
        session: {
          include: {
            pod: {
              include: {
                memberships: {
                  include: { user: { select: { id: true, name: true } } }
                }
              }
            }
          }
        }
      },
      orderBy: version ? undefined : { version: 'desc' }
    })

    return coachDoc ? this.mapToCoachDocWithDetails(coachDoc) : null
  }

  /**
   * Get all versions of coach documents for a session
   */
  static async getCoachDocVersions(sessionId: string): Promise<CoachDocWithDetails[]> {
    const coachDocs = await prisma.coachDoc.findMany({
      where: { sessionId },
      include: {
        session: {
          include: {
            pod: {
              include: {
                memberships: {
                  include: { user: { select: { id: true, name: true } } }
                }
              }
            }
          }
        }
      },
      orderBy: { version: 'desc' }
    })

    return coachDocs.map(this.mapToCoachDocWithDetails)
  }

  /**
   * Update coach document
   */
  static async updateCoachDoc(
    sessionId: string, 
    version: number, 
    updates: UpdateCoachDocData
  ): Promise<CoachDocWithDetails> {
    // Validate updates
    const validation = validateCoachDocUpdate(updates)
    if (!validation.success) {
      throw new Error(`Invalid update data: ${validation.error.message}`)
    }

    // Check if coach document exists
    const existingDoc = await prisma.coachDoc.findUnique({
      where: { sessionId_version: { sessionId, version } },
      include: {
        session: {
          include: {
            pod: {
              include: {
                memberships: { select: { userId: true } }
              }
            }
          }
        }
      }
    })
    
    if (!existingDoc) {
      throw new Error('Coach document not found')
    }

    // Validate agenda timing if being updated
    if (updates.agenda) {
      const timingValidation = validateAgendaTiming(updates.agenda)
      if (!timingValidation.isValid) {
        throw new Error(timingValidation.message)
      }
    }

    // Validate quiz answers if being updated
    if (updates.quiz) {
      const quizValidation = validateQuizAnswers(updates.quiz)
      if (!quizValidation.isValid) {
        throw new Error(`Quiz validation failed: ${quizValidation.errors.join(', ')}`)
      }
    }

    // Validate action item assignments if being updated
    if (updates.actionItems) {
      const participantIds = existingDoc.session.pod.memberships.map((m: { userId: string }) => m.userId)
      const assignmentValidation = validateActionItemAssignments(updates.actionItems, participantIds)
      if (!assignmentValidation.isValid) {
        throw new Error(`Action item validation failed: ${assignmentValidation.errors.join(', ')}`)
      }
    }

    const updatedDoc = await prisma.coachDoc.update({
      where: { sessionId_version: { sessionId, version } },
      data: {
        ...updates,
        agenda: updates.agenda ? JSON.parse(JSON.stringify(updates.agenda)) : undefined,
        notes: updates.notes ? JSON.parse(JSON.stringify(updates.notes)) : undefined,
        actionItems: updates.actionItems ? JSON.parse(JSON.stringify(updates.actionItems)) : undefined,
        quiz: updates.quiz ? JSON.parse(JSON.stringify(updates.quiz)) : undefined,
        proofChecklist: updates.proofChecklist ? JSON.parse(JSON.stringify(updates.proofChecklist)) : undefined
      },
      include: {
        session: {
          include: {
            pod: {
              include: {
                memberships: {
                  include: { user: { select: { id: true, name: true } } }
                }
              }
            }
          }
        }
      }
    })

    return this.mapToCoachDocWithDetails(updatedDoc)
  }

  /**
   * Generate agenda from sprint template
   */
  static async generateAgendaFromTemplate(sessionId: string): Promise<AgendaItem[]> {
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { pod: true }
    })

    if (!session) {
      throw new Error('Session not found')
    }

    // Sprint templates are handled in-memory by SprintTemplateService
    const template = await SprintTemplateService.getTemplatesByType(session.pod.sprintType as SprintType)
    const sprintTemplate = template[0] // Get first matching template

    if (!sprintTemplate || !sprintTemplate.agendaTemplate) {
      throw new Error('Sprint template not found or has no agenda template')
    }

    const templateItems = sprintTemplate.agendaTemplate as { items: Array<{ title: string; description?: string; duration?: number }> }
    return templateItems.items.map((item: { title: string; description?: string; duration?: number }, index: number) => ({
      id: `agenda-${index + 1}`,
      title: item.title,
      description: item.description || '',
      duration: item.duration || 30,
      order: index,
      completed: false
    }))
  }

  /**
   * Complete agenda item
   */
  static async completeAgendaItem(
    sessionId: string, 
    version: number, 
    agendaItemId: string
  ): Promise<CoachDocWithDetails> {
    const coachDoc = await this.getCoachDoc(sessionId, version)
    if (!coachDoc || !coachDoc.agenda) {
      throw new Error('Coach document or agenda not found')
    }

    const updatedAgenda = coachDoc.agenda.map(item => 
      item.id === agendaItemId ? { ...item, completed: true } : item
    )

    return this.updateCoachDoc(sessionId, version, { agenda: updatedAgenda })
  }

  /**
   * Complete action item
   */
  static async completeActionItem(
    sessionId: string, 
    version: number, 
    actionItemId: string
  ): Promise<CoachDocWithDetails> {
    const coachDoc = await this.getCoachDoc(sessionId, version)
    if (!coachDoc || !coachDoc.actionItems) {
      throw new Error('Coach document or action items not found')
    }

    const updatedActionItems = coachDoc.actionItems.map(item => 
      item.id === actionItemId ? { ...item, completed: true } : item
    )

    return this.updateCoachDoc(sessionId, version, { actionItems: updatedActionItems })
  }

  /**
   * Validate proof checklist completion
   */
  static async validateProofChecklistCompletion(
    sessionId: string, 
    version: number
  ): Promise<{ isValid: boolean; completionRate: number; message?: string }> {
    const coachDoc = await this.getCoachDoc(sessionId, version)
    if (!coachDoc || !coachDoc.proofChecklist) {
      return { isValid: true, completionRate: 100 }
    }

    const checklist = {
      ...coachDoc.proofChecklist,
      completionRequired: coachDoc.proofChecklist.completionRequired || 80,
      items: coachDoc.proofChecklist.items.map(item => ({
        ...item,
        required: item.required ?? true
      }))
    }
    return validateProofChecklistCompletion(checklist)
  }

  /**
   * Get coach document statistics for a pod
   */
  static async getPodCoachDocStats(podId: string) {
    const sessions = await prisma.learningSession.findMany({
      where: { podId },
      include: { coachDocs: true }
    })

    const totalSessions = sessions.length
    const sessionsWithDocs = sessions.filter((s: { coachDocs: unknown[] }) => s.coachDocs.length > 0).length
    const totalDocs = sessions.reduce((sum: number, s: { coachDocs: unknown[] }) => sum + s.coachDocs.length, 0)
    const avgDocsPerSession = totalSessions > 0 ? totalDocs / totalSessions : 0

    return {
      totalSessions,
      sessionsWithDocs,
      totalDocs,
      avgDocsPerSession,
      documentationRate: totalSessions > 0 ? (sessionsWithDocs / totalSessions) * 100 : 0
    }
  }

  private static mapToCoachDocWithDetails(coachDoc: Record<string, unknown>): CoachDocWithDetails {
    return {
      id: coachDoc.id as string,
      sessionId: coachDoc.sessionId as string,
      version: coachDoc.version as number,
      agenda: coachDoc.agenda as AgendaItem[] | undefined,
      notes: coachDoc.notes as SessionNotes | undefined,
      actionItems: coachDoc.actionItems as ActionItem[] | undefined,
      quiz: coachDoc.quiz as Quiz | undefined,
      proofChecklist: coachDoc.proofChecklist as ProofChecklist | undefined,
      createdAt: coachDoc.createdAt as Date,
      session: coachDoc.session as { id: string; scheduledAt: Date; pod: { id: string; sprintType: string; memberships: { userId: string; user: { id: string; name?: string } }[] } } | undefined
    }
  }
}