import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    crearPago,
    obtenerPagosPartido,
    actualizarEstadoPago,
    marcarPagoComoPagado
} from '@/services/pagosService';
import { APP_CONFIG } from '@/utils/constants';

// Hook para obtener pagos de un partido
export const usePagosPartido = (partidoId, options = {}) => {
    return useQuery({
        queryKey: ['pagos', 'partido', partidoId],
        queryFn: () => obtenerPagosPartido(partidoId),
        enabled: !!partidoId,
        staleTime: APP_CONFIG.CACHE_TIME.SHORT,
        ...options,
    });
};

// Hook para crear pago
export const useCreatePago = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ partidoId, pagoData }) => {
            const resultado = await crearPago(partidoId, pagoData);
            if (!resultado.success) {
                throw new Error(resultado.error || 'Error al crear pago');
            }
            return resultado;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['pagos', 'partido', variables.partidoId]);
            queryClient.invalidateQueries(['partidos', variables.partidoId]);
        },
    });
};

// Hook para actualizar estado de pago
export const useUpdateEstadoPago = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ partidoId, pagoId, estado, referencia }) =>
            actualizarEstadoPago(partidoId, pagoId, estado, referencia),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['pagos', 'partido', variables.partidoId]);
        },
    });
};

// Hook para marcar pago como pagado
export const useMarcarPagoComoPagado = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ partidoId, pagoId, referencia }) =>
            marcarPagoComoPagado(partidoId, pagoId, referencia),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['pagos', 'partido', variables.partidoId]);
        },
    });
};

