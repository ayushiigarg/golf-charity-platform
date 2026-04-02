import { createContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Create the context object
export const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Supabase auth user
  const [profile, setProfile] = useState(null) // profiles table row
  const [loading, setLoading] = useState(true)

  const createProfile = useCallback(async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const fullName = user?.user_metadata?.full_name || 'User'

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          role: 'user'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        setProfile(null)
      } else {
        console.log('Profile created:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Unexpected error creating profile:', error)
      setProfile(null)
    }
  }, [])

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)

        // If profile doesn't exist → create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating one...')
          await createProfile(userId)
        } else {
          setProfile(null)
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [createProfile])

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  async function signOut() {
    await supabase.auth.signOut()
  }

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await fetchProfile(user.id)
  }, [user, fetchProfile])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}