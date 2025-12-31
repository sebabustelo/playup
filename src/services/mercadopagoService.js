// Servicio para integración con MercadoPago
// Nota: Requiere configurar las credenciales de MercadoPago

// Configuración (debe venir de variables de entorno)
const MERCADOPAGO_CONFIG = {
    accessToken: import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN || '',
    publicKey: import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '',
    // Para producción, usar: 'https://api.mercadopago.com'
    // Para testing, usar: 'https://api.mercadopago.com' (con credenciales de test)
    baseUrl: 'https://api.mercadopago.com'
};

// Crear preferencia de pago en MercadoPago
export const crearPreferenciaPago = async (pagoData) => {
    try {
        // Verificar que tenemos las credenciales configuradas
        if (!MERCADOPAGO_CONFIG.accessToken || MERCADOPAGO_CONFIG.accessToken === '') {
            console.error('MercadoPago Access Token no configurado');
            return { success: false, error: 'MercadoPago Access Token no está configurado. Verifica tu archivo .env' };
        }

        // Validar que partidoId esté presente para las URLs de retorno
        if (!pagoData.partidoId) {
            console.error('partidoId es requerido para crear la preferencia de pago', pagoData);
            return { success: false, error: 'partidoId es requerido' };
        }

        // Obtener el origen de la URL de forma segura
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
        
        // Construir las URLs de retorno - MercadoPago requiere que estén definidas
        const successUrl = `${origin}/partido/${pagoData.partidoId}/pago-exitoso`;
        const failureUrl = `${origin}/partido/${pagoData.partidoId}/pago-error`;
        const pendingUrl = `${origin}/partido/${pagoData.partidoId}/pago-pendiente`;
        
        const backUrls = {
            success: successUrl,
            failure: failureUrl,
            pending: pendingUrl
        };

        // Validar que las URLs se hayan construido correctamente
        if (!successUrl || !failureUrl || !pendingUrl) {
            console.error('Error construyendo URLs de retorno:', { successUrl, failureUrl, pendingUrl });
            return { success: false, error: 'Error construyendo URLs de retorno' };
        }

        // Construir el objeto de preferencia
        const preferenceData = {
            items: [
                {
                    title: `Pago partido - ${pagoData.partidoNombre || 'Partido'}`,
                    quantity: 1,
                    unit_price: parseFloat(pagoData.monto),
                    currency_id: 'ARS'
                }
            ],
            payer: {
                email: pagoData.email || '',
                name: pagoData.nombre || 'Usuario'
            },
            back_urls: {
                success: successUrl,
                failure: failureUrl,
                pending: pendingUrl
            },
            // Solo usar auto_return si las URLs son HTTPS (MercadoPago no permite auto_return con HTTP/localhost)
            // En localhost, el usuario debe hacer clic en "Volver al sitio" manualmente
            ...(origin.startsWith('https://') ? { auto_return: 'approved' } : {}),
            // Nota: En desarrollo (localhost), aunque no tengamos auto_return, las back_urls siguen funcionando
            // El usuario solo necesita hacer clic en "Volver al sitio" después del pago
            external_reference: pagoData.pagoId || pagoData.partidoId || `pago-${Date.now()}`
        };

        console.log('Creando preferencia de pago - Datos completos:', JSON.stringify(preferenceData, null, 2));

        const response = await fetch(`${MERCADOPAGO_CONFIG.baseUrl}/checkout/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MERCADOPAGO_CONFIG.accessToken}`
            },
            body: JSON.stringify(preferenceData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error de MercadoPago:', errorData);
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Preferencia creada exitosamente:', data);
        
        // Usar sandbox_init_point si está disponible (modo test), sino usar init_point
        const initPoint = data.sandbox_init_point || data.init_point;
        
        return { 
            success: true, 
            initPoint: initPoint, 
            preferenceId: data.id,
            sandbox_init_point: data.sandbox_init_point
        };
    } catch (error) {
        console.error('Error creando preferencia de pago:', error);
        return { success: false, error: error.message || 'Error al crear preferencia de pago' };
    }
};

// Verificar estado de un pago
export const verificarEstadoPago = async (paymentId) => {
    try {
        if (!MERCADOPAGO_CONFIG.accessToken || MERCADOPAGO_CONFIG.accessToken === '') {
            console.error('MercadoPago Access Token no configurado');
            return { success: false, error: 'MercadoPago Access Token no está configurado. Verifica tu archivo .env' };
        }

        const response = await fetch(`${MERCADOPAGO_CONFIG.baseUrl}/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MERCADOPAGO_CONFIG.accessToken}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            status: data.status, // 'approved', 'pending', 'rejected'
            statusDetail: data.status_detail,
            paymentId: data.id,
            transactionAmount: data.transaction_amount,
            currencyId: data.currency_id,
            dateCreated: data.date_created,
            dateApproved: data.date_approved
        };
    } catch (error) {
        console.error('Error verificando estado de pago:', error);
        return { success: false, error: error.message || 'Error al verificar estado de pago' };
    }
};

// Procesar webhook de MercadoPago
export const procesarWebhookMercadoPago = async (notificationData) => {
    try {
        // TODO: Implementar procesamiento de webhook
        // MercadoPago envía notificaciones cuando cambia el estado de un pago
        /*
        const { type, data } = notificationData;
        
        if (type === 'payment') {
            const paymentId = data.id;
            const estadoPago = await verificarEstadoPago(paymentId);
            
            // Actualizar el pago en Firestore
            // Notificar al usuario
            // etc.
        }
        */

        return { success: true };
    } catch (error) {
        console.error('Error procesando webhook:', error);
        return { success: false, error: error.message };
    }
};

// Generar link de pago para un jugador
export const generarLinkPago = async (partidoId, jugadorId, monto, partidoInfo) => {
    try {
        const preferencia = await crearPreferenciaPago({
            partidoId,
            pagoId: `pago-${partidoId}-${jugadorId}-${Date.now()}`,
            monto,
            nombre: partidoInfo.creadorNombre || 'Organizador',
            email: partidoInfo.creadorEmail || '',
            partidoNombre: partidoInfo.canchaNombre || 'Partido'
        });

        if (preferencia.success) {
            return {
                success: true,
                linkPago: preferencia.initPoint,
                preferenceId: preferencia.preferenceId
            };
        }

        return { success: false, error: 'Error generando link de pago' };
    } catch (error) {
        console.error('Error generando link de pago:', error);
        return { success: false, error: error.message };
    }
};

