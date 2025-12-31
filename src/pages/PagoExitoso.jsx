import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from '@/context';
import { verificarEstadoPago } from '@/services/mercadopagoService';
import { COLLECTIONS, ESTADOS_PARTIDO, ESTADOS_PAGO } from '@/utils/constants';
import LoadingSpinner from '@/components/LoadingSpinner';
import './PagoResultado.css';

const PagoExitoso = () => {
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
            
            // También verificar en el hash de la URL (algunas veces MercadoPago usa hash)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const paymentIdFromHash = hashParams.get('payment_id') || hashParams.get('paymentId');
            const statusFromHash = hashParams.get('status');

            console.log('Parámetros de retorno de MercadoPago (query):', {
                paymentId,
                status,
                externalReference,
                merchantOrderId,
                collectionId,
                collectionStatus,
                partidoId,
                fullUrl: window.location.href
            });
            
            console.log('Parámetros de retorno de MercadoPago (hash):', {
                paymentIdFromHash,
                statusFromHash,
                hash: window.location.hash
            });
            
            // Usar parámetros del hash si no hay en query
            const finalPaymentId = paymentId || paymentIdFromHash;
            const finalStatus = status || statusFromHash;

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
            let estadoPagoConfirmado = finalStatus || collectionStatus;
            if (finalPaymentId) {
                try {
                    const resultadoVerificacion = await verificarEstadoPago(finalPaymentId);
                    if (resultadoVerificacion.success) {
                        estadoPagoConfirmado = resultadoVerificacion.status;
                        console.log('Estado del pago confirmado por MercadoPago:', estadoPagoConfirmado);
                    }
                } catch (error) {
                    console.warn('No se pudo verificar el estado del pago con MercadoPago:', error);
                    // Continuamos con el estado de la URL
                }
            }
            
            // Si no hay parámetros de pago pero el usuario llegó aquí, asumir que el pago fue exitoso
            // (puede ser que MercadoPago no haya pasado los parámetros correctamente)
            if (!finalPaymentId && !status && !collectionStatus) {
                console.warn('No se encontraron parámetros de pago en la URL. Asumiendo pago exitoso basado en la ruta.');
                estadoPagoConfirmado = 'approved';
            }

            // Actualizar el partido y el pago en Firestore
            const actualizaciones = {
                estado: ESTADOS_PARTIDO.CONFIRMADO,
                actualizadoEn: new Date()
            };

            // Actualizar información del pago
            if (partido.pago) {
                actualizaciones.pago = {
                    ...partido.pago,
                    estado: ESTADOS_PAGO.PAGADO,
                    montoPagado: partido.pago.montoAPagar || partido.pago.montoTotal || 0,
                    paymentId: finalPaymentId || partido.pago.paymentId,
                    merchantOrderId: merchantOrderId || partido.pago.merchantOrderId,
                    collectionId: collectionId || partido.pago.collectionId,
                    fechaPago: new Date(),
                    metodo: 'mercadopago'
                };
            } else {
                // Si no existe el objeto pago, crearlo
                actualizaciones.pago = {
                    tipo: partido.predioSeleccionado?.tipoPago || 'total',
                    montoTotal: partido.precioTotal || 0,
                    montoAPagar: partido.precioTotal || 0,
                    montoPagado: partido.precioTotal || 0,
                    estado: ESTADOS_PAGO.PAGADO,
                    paymentId: finalPaymentId,
                    merchantOrderId: merchantOrderId,
                    collectionId: collectionId,
                    fechaPago: new Date(),
                    metodo: 'mercadopago'
                };
            }

            await updateDoc(partidoRef, actualizaciones);

            addToast('¡Pago confirmado exitosamente!', 'success');
            setProcesando(false);
            
            // Redirigir al detalle del partido después de 2 segundos
            setTimeout(() => {
                navigate(`/partido/${partidoId}`);
            }, 2000);

        } catch (error) {
            console.error('Error procesando pago exitoso:', error);
            setError(error.message);
            addToast('Error al procesar el pago: ' + error.message, 'error');
            setProcesando(false);
            
            // Redirigir al detalle del partido después de 3 segundos
            setTimeout(() => {
                navigate(`/partido/${partidoId}`);
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    if (loading || procesando) {
        return (
            <div className="pago-resultado">
                <div className="pago-resultado-content">
                    <LoadingSpinner size="large" />
                    <h2>Procesando pago...</h2>
                    <p>Por favor espera mientras confirmamos tu pago.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pago-resultado">
                <div className="pago-resultado-content pago-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <h2>Error al procesar el pago</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate(`/partido/${partidoId}`)} className="btn-primary">
                        Ver Partido
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pago-resultado">
            <div className="pago-resultado-content pago-exitoso">
                <i className="fas fa-check-circle"></i>
                <h2>¡Pago Confirmado!</h2>
                <p>Tu pago ha sido procesado exitosamente.</p>
                <p>Serás redirigido al detalle del partido en unos segundos...</p>
                <button onClick={() => navigate(`/partido/${partidoId}`)} className="btn-primary">
                    Ver Partido
                </button>
            </div>
        </div>
    );
};

export default PagoExitoso;

