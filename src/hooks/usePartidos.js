import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase';
import { COLLECTIONS, APP_CONFIG } from '@/utils/constants';

// Hook para obtener partidos de un usuario
export const usePartidosUsuario = (userId, options = {}) => {
    return useQuery({
        queryKey: ['partidos', 'usuario', userId],
        queryFn: async () => {
            if (!userId) return [];

            const q = query(
                collection(db, COLLECTIONS.PARTIDOS),
                where('creadorId', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        },
        enabled: !!userId,
        staleTime: APP_CONFIG.CACHE_TIME.SHORT,
        ...options,
    });
};

// Hook para obtener un partido específico
export const usePartido = (partidoId, options = {}) => {
    return useQuery({
        queryKey: ['partidos', partidoId],
        queryFn: async () => {
            if (!partidoId) return null;

            const docRef = doc(db, COLLECTIONS.PARTIDOS, partidoId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        },
        enabled: !!partidoId,
        staleTime: APP_CONFIG.CACHE_TIME.SHORT,
        ...options,
    });
};

// Hook para crear partido
export const useCreatePartido = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (partidoData) => {
            const docRef = await addDoc(collection(db, COLLECTIONS.PARTIDOS), {
                ...partidoData,
                creadoEn: new Date(),
                estado: 'activo'
            });
            return { id: docRef.id, ...partidoData };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['partidos']);
            queryClient.setQueryData(['partidos', data.id], data);
        },
    });
};

// Hook para agregar jugador a partido
export const useAgregarJugador = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ partidoId, jugador }) => {
            const partidoRef = doc(db, COLLECTIONS.PARTIDOS, partidoId);
            await updateDoc(partidoRef, {
                jugadores: arrayUnion({
                    ...jugador,
                    agregadoEn: new Date()
                })
            });
            return { partidoId, jugador };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['partidos', data.partidoId]);
            queryClient.invalidateQueries(['partidos', 'usuario']);
        },
    });
};


