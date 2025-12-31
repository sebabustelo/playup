import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { COLLECTIONS, APP_CONFIG } from '@/utils/constants';

// Hook para obtener canchas con filtros
export const useCanchas = (filtros = {}) => {
    return useQuery({
        queryKey: ['canchas', filtros],
        queryFn: async () => {
            let canchas = [];
            
            // Si se filtra por ciudad, primero buscar predios en esa ciudad
            if (filtros.ciudad) {
                const prediosQuery = query(
                    collection(db, COLLECTIONS.PREDIOS),
                    where('ciudad', '==', filtros.ciudad)
                );
                const prediosSnapshot = await getDocs(prediosQuery);
                const prediosIds = prediosSnapshot.docs.map(doc => doc.id);
                
                if (prediosIds.length === 0) {
                    return []; // No hay predios en esa ciudad
                }
                
                // Buscar canchas de esos predios
                // Firestore limita 'in' a 10, así que hacemos múltiples queries si es necesario
                const canchasPromises = [];
                for (let i = 0; i < prediosIds.length; i += 10) {
                    const batch = prediosIds.slice(i, i + 10);
                    let q = query(
                        collection(db, COLLECTIONS.CANCHAS),
                        where('predioId', 'in', batch)
                    );
                    
                    if (filtros.deporte) {
                        q = query(q, where('deporte', '==', filtros.deporte));
                    }
                    if (filtros.tipo) {
                        q = query(q, where('tipos', 'array-contains', filtros.tipo));
                    }
                    
                    canchasPromises.push(getDocs(q));
                }
                
                const canchasSnapshots = await Promise.all(canchasPromises);
                canchasSnapshots.forEach(snapshot => {
                    canchas = canchas.concat(snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })));
                });
            } else {
                // Búsqueda normal sin filtro de ciudad
                let q = query(collection(db, COLLECTIONS.CANCHAS));

                if (filtros.predioId) {
                    q = query(q, where('predioId', '==', filtros.predioId));
                }
                if (filtros.deporte) {
                    q = query(q, where('deporte', '==', filtros.deporte));
                }
                if (filtros.tipo) {
                    q = query(q, where('tipos', 'array-contains', filtros.tipo));
                }

                const querySnapshot = await getDocs(q);
                canchas = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            // Enriquecer canchas con información del predio
            if (canchas.length > 0) {
                const prediosIds = [...new Set(canchas.map(c => c.predioId).filter(Boolean))];
                const prediosMap = {};
                
                // Cargar predios en paralelo
                const prediosPromises = prediosIds.map(async (predioId) => {
                    try {
                        const predioDoc = await getDoc(doc(db, COLLECTIONS.PREDIOS, predioId));
                        if (predioDoc.exists()) {
                            return { id: predioDoc.id, ...predioDoc.data() };
                        }
                    } catch (error) {
                        console.error(`Error cargando predio ${predioId}:`, error);
                    }
                    return null;
                });

                const predios = await Promise.all(prediosPromises);
                predios.forEach(predio => {
                    if (predio) {
                        prediosMap[predio.id] = predio;
                    }
                });

                // Enriquecer canchas con información del predio
                return canchas.map(cancha => ({
                    ...cancha,
                    predio: prediosMap[cancha.predioId] || null,
                    predioNombre: prediosMap[cancha.predioId]?.nombre || '',
                    predioDireccion: prediosMap[cancha.predioId]?.direccion || '',
                    predioCiudad: prediosMap[cancha.predioId]?.ciudad || '',
                    predioProvincia: prediosMap[cancha.predioId]?.provincia || ''
                }));
            }

            return canchas;
        },
        staleTime: APP_CONFIG.CACHE_TIME.MEDIUM,
        cacheTime: APP_CONFIG.CACHE_TIME.LONG,
    });
};

// Hook para obtener canchas con paginación infinita (mejor para UX)
export const useCanchasInfinite = (filtros = {}, pageSize = APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE) => {
    return useInfiniteQuery({
        queryKey: ['canchas', 'infinite', filtros, pageSize],
        queryFn: async ({ pageParam = null }) => {
            let q = query(
                collection(db, COLLECTIONS.CANCHAS),
                orderBy('nombre'), // Necesita índice compuesto
                limit(pageSize)
            );

            if (filtros.predioId) {
                q = query(q, where('predioId', '==', filtros.predioId));
            }
            if (filtros.deporte) {
                q = query(q, where('deporte', '==', filtros.deporte));
            }
            if (pageParam) {
                q = query(q, startAfter(pageParam));
            }

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

            return {
                data,
                lastDoc,
                hasMore: querySnapshot.docs.length === pageSize
            };
        },
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.lastDoc : undefined;
        },
        staleTime: APP_CONFIG.CACHE_TIME.MEDIUM,
    });
};

// Hook para obtener canchas con paginación tradicional
export const useCanchasPaginated = (filtros = {}, page = 1, pageSize = APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE) => {
    return useQuery({
        queryKey: ['canchas', 'paginated', filtros, page, pageSize],
        queryFn: async () => {
            let q = query(
                collection(db, COLLECTIONS.CANCHAS),
                orderBy('nombre'),
                limit(pageSize)
            );

            if (filtros.predioId) {
                q = query(q, where('predioId', '==', filtros.predioId));
            }
            if (filtros.deporte) {
                q = query(q, where('deporte', '==', filtros.deporte));
            }

            // Para páginas > 1, necesitarías guardar el lastDoc de la página anterior
            // Por ahora, cargamos todas y paginamos en memoria (OK para < 1000 docs)
            // TODO: Implementar paginación real cuando tengas muchos datos
            const querySnapshot = await getDocs(q);
            const allData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedData = allData.slice(startIndex, endIndex);

            return {
                data: paginatedData,
                total: allData.length,
                page,
                pageSize,
                hasMore: endIndex < allData.length
            };
        },
        staleTime: APP_CONFIG.CACHE_TIME.MEDIUM,
        keepPreviousData: true,
    });
};

// Hook para crear cancha
export const useCreateCancha = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (canchaData) => {
            const docRef = await addDoc(collection(db, COLLECTIONS.CANCHAS), {
                ...canchaData,
                creadoEn: new Date(),
                actualizadoEn: new Date()
            });
            return { id: docRef.id, ...canchaData };
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['canchas']);
        },
    });
};

// Hook para actualizar cancha
export const useUpdateCancha = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }) => {
            await updateDoc(doc(db, COLLECTIONS.CANCHAS, id), {
                ...data,
                actualizadoEn: new Date()
            });
            return { id, ...data };
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['canchas']);
        },
    });
};

// Hook para eliminar cancha
export const useDeleteCancha = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            await deleteDoc(doc(db, COLLECTIONS.CANCHAS, id));
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['canchas']);
        },
    });
};

