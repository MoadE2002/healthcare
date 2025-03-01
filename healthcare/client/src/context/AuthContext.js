"use client"
import { createContext, useReducer, useEffect, useState } from "react";

export const AuthContext = createContext(); 

export const authReducer = (state, action) => {
    switch(action.type) {
        case 'LOGIN':
            return { user: action.payload };
        case 'LOGOUT':
            return { user: null };
        default:
            return state;
    }
}

export const AuthContextProvider = ({ children }) => { 
    const [state, dispatch] = useReducer(authReducer, {
        user: null
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                dispatch({ type: 'LOGIN', payload: user });
            }
            setIsLoaded(true);
        }
    }, []);

    if (!isLoaded) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
}