// Servicio para enviar notificaciones por email y WhatsApp
// Nota: Esto requiere configurar servicios externos como SendGrid, Twilio, etc.

export const enviarNotificacionEmail = async (email, partido, monto) => {
    // TODO: Implementar con servicio de email (SendGrid, Nodemailer, etc.)
    // Por ahora, solo simulamos
    console.log(`Enviando email a ${email} sobre partido ${partido.id}, monto: $${monto}`);
    
    // Ejemplo de implementación con una API:
    /*
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: email,
                subject: `Invitación a partido - ${partido.canchaNombre}`,
                html: `
                    <h2>Has sido invitado a un partido</h2>
                    <p><strong>Cancha:</strong> ${partido.canchaNombre}</p>
                    <p><strong>Fecha:</strong> ${partido.fecha}</p>
                    <p><strong>Hora:</strong> ${partido.hora}</p>
                    <p><strong>Monto a pagar:</strong> $${monto}</p>
                    <p>Organizador: ${partido.creadorNombre}</p>
                `
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error enviando email:', error);
        return { success: false, error: error.message };
    }
    */
    
    return { success: true, message: 'Email enviado (simulado)' };
};

export const enviarNotificacionWhatsApp = async (telefono, partido, monto) => {
    // TODO: Implementar con Twilio, WhatsApp Business API, etc.
    console.log(`Enviando WhatsApp a ${telefono} sobre partido ${partido.id}, monto: $${monto}`);
    
    // Ejemplo de implementación con Twilio:
    /*
    try {
        const response = await fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: telefono,
                message: `Has sido invitado a un partido en ${partido.canchaNombre} el ${partido.fecha} a las ${partido.hora}. Monto a pagar: $${monto}. Organizador: ${partido.creadorNombre}`
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error enviando WhatsApp:', error);
        return { success: false, error: error.message };
    }
    */
    
    return { success: true, message: 'WhatsApp enviado (simulado)' };
};

export const enviarNotificacionesJugador = async (jugador, partido, monto) => {
    const resultados = {
        email: null,
        whatsapp: null
    };

    if (jugador.email) {
        resultados.email = await enviarNotificacionEmail(jugador.email, partido, monto);
    }

    if (jugador.telefono) {
        resultados.whatsapp = await enviarNotificacionWhatsApp(jugador.telefono, partido, monto);
    }

    return resultados;
};




