import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    crearFranjaHoraria,
    obtenerFranjasHorarias,
    actualizarFranjaHoraria,
    eliminarFranjaHoraria
} from '@/services/franjasHorariasService';
import { APP_CONFIG } from '@/utils/constants';

// Hook para obtener franjas horarias
export const useFranjasHorarias = () => {
    return useQuery({
        queryKey: ['franjasHorarias'],
        queryFn: obtenerFranjasHorarias,
        staleTime: APP_CONFIG.CACHE_TIME.LONG, // Raramente cambian
    });
};

// Hook para crear franja horaria
export const useCreateFranjaHoraria = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: crearFranjaHoraria,
        onSuccess: () => {
            queryClient.invalidateQueries(['franjasHorarias']);
        },
    });
};

// Hook para actualizar franja horaria
export const useUpdateFranjaHoraria = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => actualizarFranjaHoraria(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['franjasHorarias']);
        },
    });
};

// Hook para eliminar franja horaria
export const useDeleteFranjaHoraria = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: eliminarFranjaHoraria,
        onSuccess: () => {
            queryClient.invalidateQueries(['franjasHorarias']);
        },
    });
};


