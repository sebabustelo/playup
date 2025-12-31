// Servicio para enviar notificaciones por email y WhatsApp
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Configuración de EmailJS (opcional - se puede configurar desde .env)
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Verificar si EmailJS está configurado
const isEmailJSConfigured = () => {
    return !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
};

// Formatear fecha para mostrar
const formatearFecha = (fecha) => {
    try {
        if (typeof fecha === 'string') {
            const fechaObj = new Date(fecha);
            return format(fechaObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
        }
        return format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
        return fecha;
    }
};

export const enviarNotificacionEmail = async (email, partido, monto, subject = null, customMessage = null) => {
    console.log(`Enviando email a ${email} sobre partido ${partido.id || partido.canchaNombre}, monto: $${monto}`);
    
    // Si EmailJS está configurado, usarlo
    if (isEmailJSConfigured()) {
        try {
            // Cargar EmailJS dinámicamente
            const emailjs = await import('@emailjs/browser');
            
            const fechaFormateada = formatearFecha(partido.fecha);
            const mensaje = customMessage || `
                Has sido invitado a un partido de ${partido.tipo || 'fútbol'} vs ${partido.tipo || 'fútbol'}.
                
                Detalles del partido:
                - Cancha: ${partido.canchaNombre || 'No especificada'}
                - Dirección: ${partido.canchaDireccion || 'No especificada'}
                - Fecha: ${fechaFormateada}
                - Hora: ${partido.hora || 'No especificada'}
                - Monto a pagar: $${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                - Organizador: ${partido.creadorNombre || 'No especificado'}
                
                ${partido.descripcion ? `\nDescripción: ${partido.descripcion}` : ''}
                
                ¡Nos vemos en la cancha!
            `;

            const templateParams = {
                to_email: email,
                to_name: email.split('@')[0],
                subject: subject || `Invitación a partido - ${partido.canchaNombre || 'PlayUp'}`,
                message: mensaje,
                cancha_nombre: partido.canchaNombre || 'No especificada',
                cancha_direccion: partido.canchaDireccion || 'No especificada',
                fecha: fechaFormateada,
                hora: partido.hora || 'No especificada',
                monto: `$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                organizador: partido.creadorNombre || 'No especificado',
                tipo_partido: `${partido.tipo || 'fútbol'} vs ${partido.tipo || 'fútbol'}`,
                descripcion: partido.descripcion || '',
                partido_id: partido.id || ''
            };

            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );

            return { success: true, message: 'Email enviado exitosamente' };
        } catch (error) {
            console.error('Error enviando email con EmailJS:', error);
            // Si falla EmailJS, intentar con mailto como fallback
            return await enviarEmailFallback(email, partido, monto, subject, customMessage);
        }
    } else {
        // Si no está configurado EmailJS, usar mailto como fallback
        return await enviarEmailFallback(email, partido, monto, subject, customMessage);
    }
};

// Fallback: usar mailto para abrir cliente de email
const enviarEmailFallback = async (email, partido, monto, subject, customMessage) => {
    const fechaFormateada = formatearFecha(partido.fecha);
    const mensaje = customMessage || `
Has sido invitado a un partido de ${partido.tipo || 'fútbol'} vs ${partido.tipo || 'fútbol'}.

Detalles del partido:
- Cancha: ${partido.canchaNombre || 'No especificada'}
- Dirección: ${partido.canchaDireccion || 'No especificada'}
- Fecha: ${fechaFormateada}
- Hora: ${partido.hora || 'No especificada'}
- Monto a pagar: $${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Organizador: ${partido.creadorNombre || 'No especificado'}
${partido.descripcion ? `\nDescripción: ${partido.descripcion}` : ''}

¡Nos vemos en la cancha!
    `.trim();

    const asunto = subject || `Invitación a partido - ${partido.canchaNombre || 'PlayUp'}`;
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
    
    // Abrir cliente de email
    window.open(mailtoLink, '_blank');
    
    return { success: true, message: 'Cliente de email abierto. Por favor, envía el mensaje manualmente.' };
};

export const enviarNotificacionWhatsApp = async (telefono, partido, monto, customMessage = null) => {
    console.log(`Enviando WhatsApp a ${telefono} sobre partido ${partido.id || partido.canchaNombre}, monto: $${monto}`);
    
    // Limpiar el número de teléfono (remover espacios, guiones, paréntesis, etc.)
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
    
    // Si el teléfono no empieza con código de país, asumir Argentina (+54)
    let numeroFormateado = telefonoLimpio;
    if (!telefonoLimpio.startsWith('+')) {
        // Si empieza con 0, removerlo y agregar +54
        if (telefonoLimpio.startsWith('0')) {
            numeroFormateado = '+54' + telefonoLimpio.substring(1);
        } else if (telefonoLimpio.startsWith('54')) {
            numeroFormateado = '+' + telefonoLimpio;
        } else {
            // Asumir que es un número argentino sin código de país
            numeroFormateado = '+54' + telefonoLimpio;
        }
    }
    
    const fechaFormateada = formatearFecha(partido.fecha);
    const mensaje = customMessage || `🏆 *Invitación a Partido*

Has sido invitado a un partido de *${partido.tipo || 'fútbol'} vs ${partido.tipo || 'fútbol'}*.

📍 *Cancha:* ${partido.canchaNombre || 'No especificada'}
📍 *Dirección:* ${partido.canchaDireccion || 'No especificada'}
📅 *Fecha:* ${fechaFormateada}
⏰ *Hora:* ${partido.hora || 'No especificada'}
💰 *Monto a pagar:* $${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
👤 *Organizador:* ${partido.creadorNombre || 'No especificado'}
${partido.descripcion ? `\n📝 *Descripción:* ${partido.descripcion}` : ''}

¡Nos vemos en la cancha! ⚽`;

    // Crear link de WhatsApp Web
    const mensajeCodificado = encodeURIComponent(mensaje);
    const whatsappLink = `https://wa.me/${numeroFormateado.replace(/\+/g, '')}?text=${mensajeCodificado}`;
    
    // Abrir WhatsApp Web en nueva pestaña
    window.open(whatsappLink, '_blank');
    
    return { success: true, message: 'WhatsApp abierto. Por favor, envía el mensaje manualmente.' };
};

export const enviarNotificacionesJugador = async (jugador, partido, monto) => {
    const resultados = {
        email: null,
        whatsapp: null,
        errores: []
    };

    // Enviar email si está disponible
    if (jugador.email) {
        try {
            resultados.email = await enviarNotificacionEmail(jugador.email, partido, monto);
            if (!resultados.email.success) {
                resultados.errores.push(`Error al enviar email: ${resultados.email.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error enviando email:', error);
            resultados.errores.push(`Error al enviar email: ${error.message}`);
            resultados.email = { success: false, error: error.message };
        }
    }

    // Enviar WhatsApp si está disponible
    if (jugador.telefono) {
        try {
            resultados.whatsapp = await enviarNotificacionWhatsApp(jugador.telefono, partido, monto);
            if (!resultados.whatsapp.success) {
                resultados.errores.push(`Error al enviar WhatsApp: ${resultados.whatsapp.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error enviando WhatsApp:', error);
            resultados.errores.push(`Error al enviar WhatsApp: ${error.message}`);
            resultados.whatsapp = { success: false, error: error.message };
        }
    }

    // Si no hay email ni teléfono, agregar error
    if (!jugador.email && !jugador.telefono) {
        resultados.errores.push('El jugador no tiene email ni teléfono configurado');
    }

    return resultados;
};

// Notificar sobre registro de pago
export const notificarPagoRegistrado = async (jugador, partido, pago) => {
    const mensaje = `Se ha registrado un pago de $${pago.monto} para el partido en ${partido.canchaNombre} el ${partido.fecha}. Estado: ${pago.estado}`;
    
    const resultados = {
        email: null,
        whatsapp: null
    };

    if (jugador.email) {
        resultados.email = await enviarNotificacionEmail(
            jugador.email,
            partido,
            pago.monto,
            'Pago Registrado',
            mensaje
        );
    }

    if (jugador.telefono) {
        resultados.whatsapp = await enviarNotificacionWhatsApp(
            jugador.telefono,
            partido,
            pago.monto,
            mensaje
        );
    }

    return resultados;
};

// Notificar sobre pago marcado como pagado
export const notificarPagoConfirmado = async (jugador, partido, pago) => {
    const mensaje = `Tu pago de $${pago.monto} para el partido en ${partido.canchaNombre} ha sido confirmado. ¡Nos vemos el ${partido.fecha}!`;
    
    const resultados = {
        email: null,
        whatsapp: null
    };

    if (jugador.email) {
        resultados.email = await enviarNotificacionEmail(
            jugador.email,
            partido,
            pago.monto,
            'Pago Confirmado',
            mensaje
        );
    }

    if (jugador.telefono) {
        resultados.whatsapp = await enviarNotificacionWhatsApp(
            jugador.telefono,
            partido,
            pago.monto,
            mensaje
        );
    }

    return resultados;
};




