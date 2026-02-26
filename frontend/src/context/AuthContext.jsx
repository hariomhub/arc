import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API = '/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => sessionStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // On mount, verify token and load user
    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                } else {
                    sessionStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [token]);

    const login = async (email, password) => {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        sessionStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password, role, organization_name, gst, pan, incorporation_number, phone) => {
        const payload = { name, email, password, role, organization_name, gst, pan, incorporation_number, phone };
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        sessionStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    // Role helpers
    const isAdmin = user?.role === 'admin' || user?.role === 'executive';
    const isMember = user?.role === 'member' || isAdmin;
    const isUniversity = user?.role === 'university';
    const isCompany = user?.role === 'company';
    const isLoggedIn = !!user;

    // Authenticated fetch helper — does NOT set Content-Type for FormData
    const authFetch = (url, options = {}) => {
        const isFormData = options.body instanceof FormData;
        return fetch(url, {
            ...options,
            headers: {
                ...(!isFormData && { 'Content-Type': 'application/json' }),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers
            }
        });
    };

    return (
        <AuthContext.Provider value={{
            user, token, loading,
            login, register, logout,
            isAdmin, isMember, isUniversity, isCompany, isLoggedIn,
            authFetch,
            API
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export default AuthContext;