import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            setLoading(true);
            try {
                if (authAPI.isAuthenticated()) {
                    const isValid = await authAPI.validateAndRefreshSession();
                    if (isValid) {
                        setUser(authAPI.getUser());
                        setIsAuthenticated(true);
                    } else {
                        authAPI.logout();
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await authAPI.login(email, password);
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
    };

    const logout = async () => {
        await authAPI.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, setIsAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
