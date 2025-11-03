'use client'

import React, { useState } from 'react'
import { useHabits } from '@/hooks/useHabits'
import { Plus, Check, Trash2, Edit } from 'lucide-react'
import { CreateHabitRequest } from '@/lib/types'

export default function Dashboard() {
  const { habits, loading, error, createHabit, completeHabit, deleteHabit } = useHabits()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newHabit, setNewHabit] = useState<CreateHabitRequest>({
    title: '',
    description: '',
    category: 'general'
  })

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newHabit.title || !newHabit.description) {
      alert('Please fill in all fields')
      return
    }

    const success = await createHabit(newHabit)
    
    if (success) {
      setNewHabit({ title: '', description: '', category: 'general' })
      setShowCreateForm(false)
    }
  }

  const handleCompleteHabit = async (id: number) => {
    await completeHabit(id)
  }

  const handleDeleteHabit = async (id: number) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      await deleteHabit(id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your habits...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Your Habits Dashboard</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Habit
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Create Habit Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Create New Habit</h2>
              <form onSubmit={handleCreateHabit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newHabit.title}
                    onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Morning Water"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    value={newHabit.description}
                    onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Drink a glass of water after waking up"
                    rows={3}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Category
                  </label>
                  <select
                    value={newHabit.category}
                    onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="health">Health</option>
                    <option value="fitness">Fitness</option>
                    <option value="learning">Learning</option>
                    <option value="productivity">Productivity</option>
                    <option value="mindfulness">Mindfulness</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Habit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => (
            <div key={habit.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{habit.title}</h3>
                  <p className="text-white/80 text-sm">{habit.description}</p>
                </div>
                <span className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full text-xs">
                  {habit.category}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-white">
                  <span className="text-2xl font-bold">{habit.streak}</span>
                  <span className="text-sm text-white/60 ml-1">day streak</span>
                </div>
                {habit.completedToday && (
                  <div className="bg-green-500/20 text-green-200 px-2 py-1 rounded-full text-xs">
                    ✓ Completed Today
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCompleteHabit(habit.id)}
                  disabled={habit.completedToday}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
                    habit.completedToday
                      ? 'bg-green-500/20 text-green-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {habit.completedToday ? 'Done' : 'Complete'}
                </button>
                <button
                  onClick={() => handleDeleteHabit(habit.id)}
                  className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {habits.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-white/60 text-xl mb-4">No habits yet!</div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Create Your First Habit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}