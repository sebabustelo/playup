import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    crearServicio,
    obtenerServicios,
    actualizarServicio,
    eliminarServicio,
    agregarServicioAPartido,
    obtenerServiciosPartido,
    eliminarServicioPartido
} from '@/services/serviciosService';
import { APP_CONFIG } from '@/utils/constants';

// Hook para obtener servicios globales
export const useServicios = () => {
    return useQuery({
        queryKey: ['servicios'],
        queryFn: obtenerServicios,
        staleTime: APP_CONFIG.CACHE_TIME.LONG,
    });
};

// Hook para crear servicio
export const useCreateServicio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: crearServicio,
        onSuccess: () => {
            queryClient.invalidateQueries(['servicios']);
        },
    });
};

// Hook para actualizar servicio
export const useUpdateServicio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => actualizarServicio(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['servicios']);
        },
    });
};

// Hook para eliminar servicio
export const useDeleteServicio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: eliminarServicio,
        onSuccess: () => {
            queryClient.invalidateQueries(['servicios']);
        },
    });
};

// Hook para obtener servicios de un partido
export const useServiciosPartido = (partidoId, options = {}) => {
    return useQuery({
        queryKey: ['servicios', 'partido', partidoId],
        queryFn: () => obtenerServiciosPartido(partidoId),
        enabled: !!partidoId,
        staleTime: APP_CONFIG.CACHE_TIME.SHORT,
        ...options,
    });
};

// Hook para agregar servicio a partido
export const useAgregarServicioAPartido = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ partidoId, servicioId, precio }) =>
            agregarServicioAPartido(partidoId, servicioId, precio),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['servicios', 'partido', variables.partidoId]);
            queryClient.invalidateQueries(['partidos', variables.partidoId]);
        },
    });
};

// Hook para eliminar servicio de partido
export const useEliminarServicioPartido = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ partidoId, servicioId }) =>
            eliminarServicioPartido(partidoId, servicioId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['servicios', 'partido', variables.partidoId]);
            queryClient.invalidateQueries(['partidos', variables.partidoId]);
        },
    });
};


