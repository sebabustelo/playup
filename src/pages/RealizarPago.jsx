import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import { useToast } from '@/context';
import { crearPartido, obtenerCancha } from '@/services/partidosService';
import { crearPreferenciaPago } from '@/services/mercadopagoService';
import { useFranjasHorarias } from '@/hooks/useFranjasHorarias';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import './RealizarPago.css';

// Cargar Wallet de forma condicional (solo si el SDK está instalado)
let Wallet = null;
const loadWallet = async () => {
    try {
        const mercadoPagoModule = await import('@mercadopago/sdk-react');
        Wallet = mercadoPagoModule.Wallet;
        return true;
    } catch (error) {
        console.warn('SDK de MercadoPago no disponible. Se usará redirección directa.');
        return false;
    }
};

const RealizarPago = ({ partidoData, predio, onVolver, onPagoExitoso }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { data: franjasHorarias = [] } = useFranjasHorarias();
    const [metodoPago, setMetodoPago] = useState('mercadopago'); // 'mercadopago' | 'transferencia'
    const [datosTransferencia, setDatosTransferencia] = useState({
        comprobante: '',
        banco: '',
        numeroOperacion: ''
    });
    const [procesando, setProcesando] = useState(false);
    const [creandoPartido, setCreandoPartido] = useState(false);
    const [preferenceId, setPreferenceId] = useState(null);
    const [partidoId, setPartidoId] = useState(null);
    const [mostrarWallet, setMostrarWallet] = useState(false);
    const [walletAvailable, setWalletAvailable] = useState(false);

    // Intentar cargar el Wallet al montar el componente
    useEffect(() => {
        loadWallet().then(available => {
            setWalletAvailable(available);
        });
    }, []);

    const handleMetodoPagoChange = (e) => {
        setMetodoPago(e.target.value);
    };

    const handleTransferenciaChange = (e) => {
        setDatosTransferencia({
            ...datosTransferencia,
            [e.target.name]: e.target.value
        });
    };

    const crearPartidoYProcesarPago = async () => {
        if (!user) {
            addToast('Debes estar autenticado para crear un partido', 'error');
            return;
        }

        setCreandoPartido(true);
        try {
            // Primero crear el partido
            const cancha = await obtenerCancha(partidoData.canchaId);
            if (!cancha) {
                addToast('Cancha no encontrada', 'error');
                setCreandoPartido(false);
                return;
            }

            // Obtener la franja horaria para las horas
            const franjaHoraria = franjasHorarias.find(f => f.id === partidoData.franjaHorariaId);

            const partidoDataCompleto = {
                creadorId: user.id,
                creadorNombre: user.nombre || '',
                creadorEmail: user.email || '',
                canchaId: partidoData.canchaId,
                canchaNombre: cancha.nombre || '',
                canchaDireccion: cancha.direccion || cancha.ubicacion || '',
                predioId: cancha.predioId || '', // Agregar predioId para facilitar filtrado
                fecha: partidoData.fecha,
                hora: franjaHoraria?.horaInicio || '',
                horaFin: franjaHoraria?.horaFin || '',
                franjaHorariaId: partidoData.franjaHorariaId,
                tipo: partidoData.tipo,
                precioTotal: partidoData.precioTotal,
                precioPorJugador: partidoData.precioTotal / (parseInt(partidoData.tipo) * 2),
                precioId: partidoData.precioId || '',
                descripcion: partidoData.descripcion || '',
                jugadores: [],
                estado: 'activo',
                grupoTelegram: partidoData.crearGrupoTelegram && partidoData.linkGrupoTelegram ? {
                    link: partidoData.linkGrupoTelegram,
                    activo: true
                } : null,
                pago: {
                    tipo: partidoData.tipoPago,
                    montoTotal: partidoData.precioTotal,
                    montoAPagar: partidoData.montoAPagar,
                    montoPagado: 0,
                    metodo: metodoPago,
                    estado: metodoPago === 'transferencia' ? 'pendiente' : 'pendiente',
                    datosTransferencia: metodoPago === 'transferencia' ? datosTransferencia : null
                }
            };

            // Crear el partido solo cuando se confirma el pago
            // Para transferencia: se crea cuando se envía (se considera realizado cuando se envía)
            // Para MercadoPago: se crea cuando se envía (el pago se procesará después)
            const resultado = await crearPartido(partidoDataCompleto);
            
            if (!resultado.success) {
                addToast('Error al crear partido', 'error');
                setCreandoPartido(false);
                return;
            }

            const partidoId = resultado.id;

            // Si es transferencia, el partido ya está creado
            if (metodoPago === 'transferencia') {
                // TODO: Guardar datos de transferencia en Firestore
                addToast('Partido creado. Esperando confirmación del pago por transferencia.', 'success');
                if (onPagoExitoso) {
                    onPagoExitoso(partidoId);
                }
                return;
            }

            // Si es MercadoPago, crear la preferencia y mostrar el botón de Wallet
            setProcesando(true);
            const preferencia = await crearPreferenciaPago({
                partidoId: partidoId,
                pagoId: `pago-${partidoId}-${Date.now()}`,
                monto: partidoData.montoAPagar,
                nombre: user.nombre || 'Usuario',
                email: user.email || '',
                partidoNombre: partidoData.canchaNombre || 'Partido'
            });

            if (preferencia.success) {
                // Si el Wallet está disponible y tenemos preferenceId, mostrar el Wallet
                if (walletAvailable && preferencia.preferenceId) {
                    setPreferenceId(preferencia.preferenceId);
                    setPartidoId(partidoId);
                    setMostrarWallet(true);
                    setProcesando(false);
                } else if (preferencia.initPoint) {
                    // Si no hay Wallet, usar redirección directa
                    window.location.href = preferencia.initPoint;
                } else {
                    addToast('Error al procesar el pago con MercadoPago: no se recibió URL de pago', 'error');
                    setProcesando(false);
                }
            } else {
                addToast('Error al procesar el pago con MercadoPago: ' + (preferencia.error || 'Error desconocido'), 'error');
                setProcesando(false);
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al procesar el pago', 'error');
            setProcesando(false);
            setCreandoPartido(false);
        }
    };

    return (
        <div className="realizar-pago">
            <h2>Realizar Pago</h2>

            <div className="resumen-pago">
                <h3>Resumen del Partido</h3>
                <div className="resumen-item">
                    <span className="resumen-label">Cancha:</span>
                    <span className="resumen-value">{partidoData.canchaNombre}</span>
                </div>
                <div className="resumen-item">
                    <span className="resumen-label">Fecha:</span>
                    <span className="resumen-value">
                        {format(parseISO(partidoData.fecha), 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })}
                    </span>
                </div>
                <div className="resumen-item">
                    <span className="resumen-label">Precio Total:</span>
                    <span className="resumen-value">
                        ${partidoData.precioTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                {partidoData.tipoPago === 'reserva' && (
                    <div className="resumen-item destacado">
                        <span className="resumen-label">Monto a Pagar (Reserva):</span>
                        <span className="resumen-value-destacado">
                            ${partidoData.montoAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}
                {partidoData.tipoPago === 'total' && (
                    <div className="resumen-item destacado">
                        <span className="resumen-label">Monto a Pagar:</span>
                        <span className="resumen-value-destacado">
                            ${partidoData.montoAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}
            </div>

            <div className="metodos-pago">
                <h3>Selecciona Método de Pago</h3>
                <div className="metodos-pago-options">
                    <label className="metodo-pago-option">
                        <input
                            type="radio"
                            name="metodoPago"
                            value="mercadopago"
                            checked={metodoPago === 'mercadopago'}
                            onChange={handleMetodoPagoChange}
                        />
                        <div className="metodo-pago-content">
                            <i className="fab fa-cc-visa"></i>
                            <span>MercadoPago</span>
                            <small>Tarjetas, efectivo, transferencia</small>
                        </div>
                    </label>
                    <label className="metodo-pago-option">
                        <input
                            type="radio"
                            name="metodoPago"
                            value="transferencia"
                            checked={metodoPago === 'transferencia'}
                            onChange={handleMetodoPagoChange}
                        />
                        <div className="metodo-pago-content">
                            <i className="fas fa-university"></i>
                            <span>Transferencia Bancaria</span>
                            <small>Transferencia directa</small>
                        </div>
                    </label>
                </div>
            </div>

            {metodoPago === 'transferencia' && (
                <div className="datos-transferencia">
                    <h3>Datos para Transferencia</h3>
                    {predio?.email && (
                        <div className="info-transferencia">
                            <p><strong>Email para consultas:</strong> {predio.email}</p>
                            {predio.telefono && (
                                <p><strong>Teléfono:</strong> {predio.telefono}</p>
                            )}
                        </div>
                    )}
                    <div className="form-group">
                        <label>Banco</label>
                        <input
                            type="text"
                            name="banco"
                            value={datosTransferencia.banco}
                            onChange={handleTransferenciaChange}
                            placeholder="Ej: Banco Nación, Banco Provincia"
                        />
                    </div>
                    <div className="form-group">
                        <label>Número de Operación</label>
                        <input
                            type="text"
                            name="numeroOperacion"
                            value={datosTransferencia.numeroOperacion}
                            onChange={handleTransferenciaChange}
                            placeholder="Número de comprobante de transferencia"
                        />
                    </div>
                    <div className="form-group">
                        <label>Comprobante (URL o referencia)</label>
                        <input
                            type="text"
                            name="comprobante"
                            value={datosTransferencia.comprobante}
                            onChange={handleTransferenciaChange}
                            placeholder="Link a imagen del comprobante o referencia"
                        />
                    </div>
                </div>
            )}

            {/* Mostrar el botón de Wallet de MercadoPago si la preferencia fue creada y el SDK está disponible */}
            {mostrarWallet && preferenceId && Wallet && metodoPago === 'mercadopago' && (
                <div className="mercado-pago-wallet-container">
                    <h3>Completa tu pago</h3>
                    <p>Haz clic en el botón de MercadoPago para continuar con el pago</p>
                    <div className="wallet-wrapper">
                        <Wallet 
                            initialization={{ preferenceId: preferenceId }}
                            customization={{
                                texts: {
                                    valueProp: 'security_safety'
                                }
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setMostrarWallet(false);
                            setPreferenceId(null);
                            setPartidoId(null);
                        }}
                        className="btn-cancelar-wallet"
                    >
                        <i className="fas fa-times"></i> Cancelar
                    </button>
                </div>
            )}

            {/* Botones de acción - ocultos cuando se muestra el Wallet */}
            {!mostrarWallet && (
                <div className="botones-pago">
                    <button
                        type="button"
                        onClick={onVolver}
                        className="btn-volver"
                        disabled={procesando || creandoPartido}
                    >
                        <i className="fas fa-arrow-left"></i> Volver
                    </button>
                    <button
                        type="button"
                        onClick={crearPartidoYProcesarPago}
                        className="btn-pagar"
                        disabled={procesando || creandoPartido || (metodoPago === 'transferencia' && !datosTransferencia.numeroOperacion)}
                    >
                        {creandoPartido ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Creando Partido...
                            </>
                        ) : procesando ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Procesando...
                            </>
                        ) : (
                            <>
                                {metodoPago === 'mercadopago' ? 'Continuar con MercadoPago' : 'Confirmar Transferencia'}
                                <i className="fas fa-arrow-right"></i>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RealizarPago;

