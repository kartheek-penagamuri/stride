import { useState, useEffect } from 'react'
import { habitApi } from '@/lib/api'
import { Habit, CreateHabitRequest, UpdateHabitRequest } from '@/lib/types'

export function useHabits() {
    const [habits, setHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch all habits
    const fetchHabits = async () => {
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

    // Load habits on mount
    useEffect(() => {
        fetchHabits()
    }, [])

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
export function useHabit(id: number) {
    const [habit, setHabit] = useState<Habit | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchHabit = async () => {
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
        if (id) {
            fetchHabit()
        }
    }, [id])

    return {
        habit,
        loading,
        error,
        refetch: fetchHabit,
    }
}