import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    agregarJugadorAPartido,
    obtenerJugadoresPartido,
    actualizarEstadoJugador,
    eliminarJugadorPartido
} from '@/services/jugadoresService';
import { APP_CONFIG } from '@/utils/constants';

// Hook para obtener jugadores de un partido
export const useJugadoresPartido = (partidoId, options = {}) => {
    return useQuery({
        queryKey: ['jugadores', 'partido', partidoId],
        queryFn: () => obtenerJugadoresPartido(partidoId),
        enabled: !!partidoId,
        staleTime: APP_CONFIG.CACHE_TIME.SHORT,
        ...options,
    });
};

// Hook para agregar jugador a partido
export const useAgregarJugadorAPartido = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ partidoId, jugadorData }) => 
            agregarJugadorAPartido(partidoId, jugadorData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['jugadores', 'partido', variables.partidoId]);
            queryClient.invalidateQueries(['partidos', variables.partidoId]);
        },
    });
};

// Hook para actualizar estado de jugador
export const useUpdateEstadoJugador = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ partidoId, jugadorId, estado }) =>
            actualizarEstadoJugador(partidoId, jugadorId, estado),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['jugadores', 'partido', variables.partidoId]);
        },
    });
};

// Hook para eliminar jugador de partido
export const useEliminarJugadorPartido = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ partidoId, jugadorId }) =>
            eliminarJugadorPartido(partidoId, jugadorId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['jugadores', 'partido', variables.partidoId]);
            queryClient.invalidateQueries(['partidos', variables.partidoId]);
        },
    });
};


