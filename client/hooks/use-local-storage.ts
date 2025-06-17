"use client"

import { useState, useEffect } from 'react'

// Hook for working with localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State for storing value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Initialization of storage on first render
  useEffect(() => {
    try {
      // Get value from localStorage or use initialValue
      const item = window.localStorage.getItem(key)
      const value = item ? JSON.parse(item) : initialValue
      setStoredValue(value)
    } catch (error) {
      console.error(`Error getting value from localStorage for key "${key}":`, error)
      setStoredValue(initialValue)
    }
  }, [key, initialValue])

  // Function to update value in localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Get new value depending on the type of argument
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save in localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error saving value to localStorage for key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}
