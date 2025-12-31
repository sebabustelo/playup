import React from 'react';
import { usePagosPartido } from '@/hooks/usePagos';
import { ESTADOS_PAGO } from '@/utils/constants';
import './ResumenPagos.css';

const ResumenPagos = ({ partidoId }) => {
    const { data: pagos = [] } = usePagosPartido(partidoId);

    const resumen = React.useMemo(() => {
        const totalPendiente = pagos
            .filter(p => p.estado === ESTADOS_PAGO.PENDIENTE)
            .reduce((sum, p) => sum + (p.monto || 0), 0);
        const totalPagado = pagos
            .filter(p => p.estado === ESTADOS_PAGO.PAGADO)
            .reduce((sum, p) => sum + (p.monto || 0), 0);
        const totalRechazado = pagos
            .filter(p => p.estado === ESTADOS_PAGO.RECHAZADO)
            .reduce((sum, p) => sum + (p.monto || 0), 0);

        return {
            total: pagos.length,
            pendientes: pagos.filter(p => p.estado === ESTADOS_PAGO.PENDIENTE).length,
            pagados: pagos.filter(p => p.estado === ESTADOS_PAGO.PAGADO).length,
            rechazados: pagos.filter(p => p.estado === ESTADOS_PAGO.RECHAZADO).length,
            montoTotalPendiente: totalPendiente,
            montoTotalPagado: totalPagado,
            montoTotalRechazado: totalRechazado,
            montoTotal: totalPendiente + totalPagado + totalRechazado
        };
    }, [pagos]);

    if (pagos.length === 0) {
        return null;
    }

    return (
        <div className="resumen-pagos">
            <h3>Resumen de Pagos</h3>
            <div className="resumen-grid">
                <div className="resumen-card pendiente">
                    <div className="resumen-header">
                        <i className="fas fa-clock"></i>
                        <span>Pendientes</span>
                    </div>
                    <div className="resumen-content">
                        <div className="resumen-cantidad">{resumen.pendientes}</div>
                        <div className="resumen-monto">${resumen.montoTotalPendiente.toFixed(2)}</div>
                    </div>
                </div>

                <div className="resumen-card pagado">
                    <div className="resumen-header">
                        <i className="fas fa-check-circle"></i>
                        <span>Pagados</span>
                    </div>
                    <div className="resumen-content">
                        <div className="resumen-cantidad">{resumen.pagados}</div>
                        <div className="resumen-monto">${resumen.montoTotalPagado.toFixed(2)}</div>
                    </div>
                </div>

                <div className="resumen-card total">
                    <div className="resumen-header">
                        <i className="fas fa-dollar-sign"></i>
                        <span>Total</span>
                    </div>
                    <div className="resumen-content">
                        <div className="resumen-cantidad">{resumen.total}</div>
                        <div className="resumen-monto">${resumen.montoTotal.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {resumen.pendientes > 0 && (
                <div className="resumen-alerta">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Tienes {resumen.pendientes} pago(s) pendiente(s) por un total de ${resumen.montoTotalPendiente.toFixed(2)}</span>
                </div>
            )}
        </div>
    );
};

export default ResumenPagos;


