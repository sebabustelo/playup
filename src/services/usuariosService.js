import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { COLLECTIONS } from '@/utils/constants';

// Crear o actualizar usuario en Firestore
export const crearOActualizarUsuario = async (usuarioData) => {
    try {
        const { id, ...data } = usuarioData;
        const collectionName = COLLECTIONS.USUARIOS || COLLECTIONS.USERS || 'users';
        const userRef = doc(db, collectionName, id);
        
        // Verificar si el usuario ya existe
        const userSnap = await getDoc(userRef);
        const existe = userSnap.exists();
        
        // Preparar datos para guardar
        const datosAGuardar = {
            ...data,
            actualizadoEn: serverTimestamp()
        };
        
        // Solo agregar creadoEn si es un usuario nuevo
        if (!existe) {
            datosAGuardar.creadoEn = serverTimestamp();
        }
        
        // Usar setDoc con merge para crear o actualizar
        await setDoc(userRef, datosAGuardar, { merge: true });
        
        console.log('✅ Usuario creado/actualizado en Firestore:', id, datosAGuardar);
        return { success: true, id };
    } catch (error) {
        console.error('❌ Error creando/actualizando usuario:', error);
        return { success: false, error: error.message };
    }
};

// Obtener usuario por ID
export const obtenerUsuario = async (userId) => {
    try {
        if (!userId) return null;
        const collectionName = COLLECTIONS.USUARIOS || COLLECTIONS.USERS || 'users';
        const userRef = doc(db, collectionName, userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return null;
    }
};

// Obtener todos los usuarios
export const obtenerUsuarios = async () => {
    try {
        console.log('🔍 Obteniendo usuarios de Firestore...');
        const collectionName = COLLECTIONS.USUARIOS || COLLECTIONS.USERS || 'users';
        console.log('📂 Colección:', collectionName);
        const querySnapshot = await getDocs(collection(db, collectionName));
        const usuarios = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ Usuarios obtenidos: ${usuarios.length}`, usuarios);
        return usuarios;
    } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        return [];
    }
};

// Actualizar roles de un usuario
export const actualizarRolesUsuario = async (userId, roles, prediosAsignados = []) => {
    try {
        const collectionName = COLLECTIONS.USUARIOS || COLLECTIONS.USERS || 'users';
        const userRef = doc(db, collectionName, userId);
        await updateDoc(userRef, {
            roles: roles,
            prediosAsignados: prediosAsignados, // Solo para admin_predios
            actualizadoEn: new Date()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error actualizando roles:', error);
        return { success: false, error: error.message };
    }
};

// Verificar si un usuario tiene un rol específico
export const tieneRol = (usuario, rol) => {
    if (!usuario || !usuario.roles) return false;
    
    const roleNames = usuario.roles.map(r => 
        typeof r === 'string' ? r : r.name
    );
    
    return roleNames.includes(rol);
};

// Verificar si un usuario es admin de un predio específico
export const esAdminPredio = (usuario, predioId) => {
    if (!usuario) return false;
    
    // Si es admin principal, puede gestionar todos los predios
    if (tieneRol(usuario, 'admin')) {
        return true;
    }
    
    // Si es admin_predios, verificar si tiene acceso a este predio
    if (tieneRol(usuario, 'admin_predios')) {
        const prediosAsignados = usuario.prediosAsignados || [];
        return prediosAsignados.includes(predioId);
    }
    
    return false;
};

// Obtener usuarios por rol
export const obtenerUsuariosPorRol = async (rol) => {
    try {
        const usuarios = await obtenerUsuarios();
        return usuarios.filter(usuario => tieneRol(usuario, rol));
    } catch (error) {
        console.error('Error obteniendo usuarios por rol:', error);
        return [];
    }
};

