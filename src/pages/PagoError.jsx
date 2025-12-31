import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from '@/context';
import { verificarEstadoPago } from '@/services/mercadopagoService';
import { COLLECTIONS, ESTADOS_PARTIDO, ESTADOS_PAGO } from '@/utils/constants';
import LoadingSpinner from '@/components/LoadingSpinner';
import './PagoResultado.css';

const PagoError = () => {
    const { id: partidoId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        procesarPago();
    }, []);

    const procesarPago = async () => {
        try {
            // Obtener parámetros de la URL
            const paymentId = searchParams.get('payment_id');
            const status = searchParams.get('status');
            const externalReference = searchParams.get('external_reference');
            const merchantOrderId = searchParams.get('merchant_order_id');
            const collectionId = searchParams.get('collection_id');
            const collectionStatus = searchParams.get('collection_status');

            console.log('Parámetros de retorno de MercadoPago (Error):', {
                paymentId,
                status,
                externalReference,
                merchantOrderId,
                collectionId,
                collectionStatus,
                partidoId
            });

            // Validar que tenemos el partidoId
            if (!partidoId) {
                throw new Error('No se encontró el ID del partido');
            }

            // Obtener el partido de Firestore
            const partidoRef = doc(db, COLLECTIONS.PARTIDOS, partidoId);
            const partidoDoc = await getDoc(partidoRef);

            if (!partidoDoc.exists()) {
                throw new Error('Partido no encontrado');
            }

            const partido = { id: partidoDoc.id, ...partidoDoc.data() };

            // Verificar el estado del pago con MercadoPago (opcional, para confirmar)
            let estadoPagoConfirmado = status || collectionStatus;
            if (paymentId) {
                try {
                    const resultadoVerificacion = await verificarEstadoPago(paymentId);
                    if (resultadoVerificacion.success) {
                        estadoPagoConfirmado = resultadoVerificacion.status;
                        console.log('Estado del pago confirmado por MercadoPago:', estadoPagoConfirmado);
                    }
                } catch (error) {
                    console.warn('No se pudo verificar el estado del pago con MercadoPago:', error);
                    // Continuamos con el estado de la URL
                }
            }

            // Actualizar el partido y el pago en Firestore
            const actualizaciones = {
                estado: ESTADOS_PARTIDO.PENDIENTE, // Mantener pendiente si el pago falló
                actualizadoEn: new Date()
            };

            // Actualizar información del pago
            if (partido.pago) {
                actualizaciones.pago = {
                    ...partido.pago,
                    estado: ESTADOS_PAGO.RECHAZADO,
                    paymentId: paymentId || partido.pago.paymentId,
                    merchantOrderId: merchantOrderId || partido.pago.merchantOrderId,
                    collectionId: collectionId || partido.pago.collectionId,
                    fechaIntento: new Date(),
                    metodo: 'mercadopago',
                    motivoRechazo: `Pago rechazado. Status: ${estadoPagoConfirmado || 'unknown'}`
                };
            } else {
                // Si no existe el objeto pago, crearlo
                actualizaciones.pago = {
                    tipo: partido.predioSeleccionado?.tipoPago || 'total',
                    montoTotal: partido.precioTotal || 0,
                    montoAPagar: partido.precioTotal || 0,
                    montoPagado: 0,
                    estado: ESTADOS_PAGO.RECHAZADO,
                    paymentId: paymentId,
                    merchantOrderId: merchantOrderId,
                    collectionId: collectionId,
                    fechaIntento: new Date(),
                    metodo: 'mercadopago',
                    motivoRechazo: `Pago rechazado. Status: ${estadoPagoConfirmado || 'unknown'}`
                };
            }

            await updateDoc(partidoRef, actualizaciones);

            addToast('El pago fue rechazado. Puedes intentar nuevamente.', 'warning');
            setProcesando(false);

        } catch (error) {
            console.error('Error procesando pago rechazado:', error);
            setError(error.message);
            addToast('Error al procesar el resultado del pago: ' + error.message, 'error');
            setProcesando(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading || procesando) {
        return (
            <div className="pago-resultado">
                <div className="pago-resultado-content">
                    <LoadingSpinner size="large" />
                    <h2>Procesando resultado del pago...</h2>
                    <p>Por favor espera mientras procesamos la información.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pago-resultado">
            <div className="pago-resultado-content pago-error">
                <i className="fas fa-times-circle"></i>
                <h2>Pago Rechazado</h2>
                <p>Lo sentimos, tu pago no pudo ser procesado.</p>
                <p className="pago-mensaje-detalle">
                    Por favor, verifica los datos de tu tarjeta o método de pago e intenta nuevamente.
                </p>
                <div className="pago-acciones">
                    <button onClick={() => navigate(`/partido/${partidoId}`)} className="btn-primary">
                        Ver Partido
                    </button>
                    <button onClick={() => navigate('/crear-partido')} className="btn-secondary">
                        Crear Nuevo Partido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PagoError;


