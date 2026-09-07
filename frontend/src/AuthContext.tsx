import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient, setUnauthorizedHandler } from "./lib/apiClient";

export interface User {
    id: number
    email: string
    name: string
    surname: string 
}

interface AuthContextType {
    user: User | null
    login: (user: User) => void
    logout: () => Promise<void>
    updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children} : {children: ReactNode}){
    
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    })

    const login = (newUser: User) => {
        localStorage.setItem('user', JSON.stringify(newUser))
        setUser(newUser)
    }

    const logout = async () => {
        try {
            await apiClient.post('/logout')
        } catch {
            // backende ulaşmasa bile frontend state'ini temizle
        }
        localStorage.removeItem('user')
        setUser(null)
    }

    useEffect(() => {
        setUnauthorizedHandler(() => {
            logout()
        })
    }, [])

    const updateUser = (updatedUser: User) => {
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
    }

    return (
        <AuthContext.Provider value={{user, login, logout, updateUser}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if(!context){
        throw new Error ('useAuth, AuthProvider içinde kullanılmalı')
    }

    return context
}