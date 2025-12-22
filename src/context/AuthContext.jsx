import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../firebase';
import usersData from '../data/adminUsuarios.json';

export const AuthContext = createContext();

const buildUserFromFirebase = (firebaseUser) => {
    if (!firebaseUser) return null;

    const displayName =
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Usuario PlayUp';

    const defaultRoles = [
        {
            name: 'usuario',
            display_name: 'Usuario'
        }
    ];

    return {
        id: firebaseUser.uid,
        nombre: displayName,
        email: firebaseUser.email,
        roles: defaultRoles,
        roleNames: defaultRoles.map((role) => role.name),
        telefono: firebaseUser.phoneNumber || '',
        avatar: firebaseUser.photoURL || '',
        provider: firebaseUser.providerData[0]?.providerId || 'firebase'
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Primero verificar si hay un usuario guardado en localStorage (login local)
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setLoading(false);
                return;
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
            }
        }

        // Si no hay usuario local, verificar Firebase
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(buildUserFromFirebase(firebaseUser));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const register = async (email, password, nombre) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (nombre) {
                await updateProfile(userCredential.user, { displayName: nombre });
            }
            return { success: true, user: buildUserFromFirebase(userCredential.user) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const login = async (email, password) => {
        try {
            // Primero intentar login local con adminUsuarios.json
            const normalizedEmail = email?.trim().toLowerCase();
            const normalizedPassword = password?.trim();
            const credential = usersData?.credenciales?.find(
                (cred) => cred.email.trim().toLowerCase() === normalizedEmail
            );

            if (credential && (credential.password ?? '').trim() === normalizedPassword) {
                // Login local exitoso
                const persona = usersData?.personas?.find(
                    (item) => item.id === credential.persona_id
                );

                const rawRoles = credential.roles?.length
                    ? credential.roles
                    : persona?.roles || [];

                const roleObjects = rawRoles.map((role) => {
                    if (typeof role === 'string') {
                        return { name: role.toLowerCase(), display_name: role };
                    }
                    if (role && typeof role === 'object') {
                        return {
                            ...role,
                            name: (role.name || role.id || '').toLowerCase()
                        };
                    }
                    return { name: 'usuario', display_name: 'Usuario' };
                });

                const roleNames = roleObjects.map((role) => role.name);

                const userData = {
                    id: persona?.id ?? credential.persona_id,
                    persona_id: persona?.id ?? credential.persona_id,
                    nombre: persona?.nombre || "",
                    apellido: persona?.apellido || "",
                    name: `${persona?.nombre || ''} ${persona?.apellido || ''}`.trim() || persona?.nombre || credential.email,
                    email: credential.email,
                    roles: roleObjects,
                    roleNames,
                    tipo: persona?.tipo || "",
                    telefono: persona?.telefono || "",
                    dni: persona?.dni || "",
                    activo: persona?.activo ?? true
                };

                // Guardar en localStorage para mantener la sesión
                const tokenPayload = {
                    user: userData,
                    issuedAt: Date.now()
                };
                const encodedPayload = btoa(JSON.stringify(tokenPayload));
                const fakeToken = `local.${encodedPayload}.auth`;
                localStorage.setItem("token", fakeToken);
                localStorage.setItem("user", JSON.stringify(userData));

                setUser(userData);
                return { success: true, user: userData };
            }

            // Si no encuentra en local, intentar con Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: buildUserFromFirebase(userCredential.user) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: buildUserFromFirebase(result.user) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const loginWithFacebook = async () => {
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            return { success: true, user: buildUserFromFirebase(result.user) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            // Limpiar localStorage
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            
            // Cerrar sesión de Firebase si está autenticado
            if (auth.currentUser) {
                await signOut(auth);
            }
            
            setUser(null);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        loading,
        register,
        login,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        resetPassword
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

