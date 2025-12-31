import React, { createContext, useContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const toastIdCounter = React.useRef(0);

    const addToast = useCallback((message, type = 'info') => {
        // Usar timestamp + contador para garantizar unicidad
        const id = `${Date.now()}-${++toastIdCounter.current}`;
        const newToast = { id, message, type };
        setToasts((prev) => [...prev, newToast]);
        
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const value = {
        toasts,
        addToast,
        removeToast
    };

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe usarse dentro de ToastProvider');
    }
    return context;
};




