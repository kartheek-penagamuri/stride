import { useState, useEffect } from 'react'
import { habitApi } from '@/lib/api'
import { Habit, CreateHabitRequest, UpdateHabitRequest } from '@/lib/types'

export function useHabits(currentUser?: { id: number }) {
    const [habits, setHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch all habits for the logged-in user
    const fetchHabits = async () => {
        if (!currentUser) {
            setHabits([])
            setLoading(false)
            setError(null)
            return
        }

        setLoading(true)
        setError(null)

        const { data, error: apiError } = await habitApi.getAll()

        if (apiError) {
            setError(apiError)
        } else if (data) {
            setHabits(data.habits)
        }

        setLoading(false)
    }

    // Create a new habit
    const createHabit = async (habitData: CreateHabitRequest) => {
        if (!currentUser) {
            setError('Please log in to save habits.')
            return false
        }

        const { data, error: apiError } = await habitApi.create(habitData)

        if (apiError) {
            setError(apiError)
            return false
        } else if (data) {
            setHabits(prev => [...prev, data.habit])
            return true
        }

        return false
    }

    // Update a habit
    const updateHabit = async (id: number, habitData: UpdateHabitRequest) => {
        if (!currentUser) {
            setError('Please log in to update habits.')
            return false
        }

        const { data, error: apiError } = await habitApi.update(id, habitData)

        if (apiError) {
            setError(apiError)
            return false
        } else if (data) {
            setHabits(prev => prev.map(habit =>
                habit.id === id ? { ...habit, ...data.habit } : habit
            ))
            return true
        }

        return false
    }

    // Delete a habit
    const deleteHabit = async (id: number) => {
        if (!currentUser) {
            setError('Please log in to delete habits.')
            return false
        }

        const { error: apiError } = await habitApi.delete(id)

        if (apiError) {
            setError(apiError)
            return false
        } else {
            setHabits(prev => prev.filter(habit => habit.id !== id))
            return true
        }
    }

    // Complete a habit
    const completeHabit = async (id: number) => {
        if (!currentUser) {
            setError('Please log in to complete habits.')
            return false
        }

        const { data, error: apiError } = await habitApi.complete(id)

        if (apiError) {
            setError(apiError)
            return false
        } else if (data) {
            setHabits(prev => prev.map(habit =>
                habit.id === id ? { ...habit, ...data.habit } : habit
            ))
            return true
        }

        return false
    }

    // Load habits when the user changes
    useEffect(() => {
        fetchHabits()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id])

    return {
        habits,
        loading,
        error,
        fetchHabits,
        createHabit,
        updateHabit,
        deleteHabit,
        completeHabit,
    }
}

// Hook for a single habit
export function useHabit(id: number, currentUser?: { id: number }) {
    const [habit, setHabit] = useState<Habit | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchHabit = async () => {
        if (!currentUser) {
            setHabit(null)
            setLoading(false)
            setError('Please log in to view this habit.')
            return
        }

        setLoading(true)
        setError(null)

        const { data, error: apiError } = await habitApi.getById(id)

        if (apiError) {
            setError(apiError)
        } else if (data) {
            setHabit(data.habit)
        }

        setLoading(false)
    }

    useEffect(() => {
        if (id && currentUser) {
            fetchHabit()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, currentUser?.id])

    return {
        habit,
        loading,
        error,
        refetch: fetchHabit,
    }
}
