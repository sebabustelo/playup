/**
 * Servicio para integración con Telegram
 * Permite crear grupos de Telegram y agregar miembros
 */

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

/**
 * Verifica si Telegram está configurado
 */
export const isTelegramConfigured = () => {
    return !!TELEGRAM_BOT_TOKEN;
};

/**
 * Crea un grupo de Telegram para un partido
 * @param {string} nombrePartido - Nombre del partido (usado como nombre del grupo)
 * @param {string} descripcion - Descripción del partido (usado como descripción del grupo)
 * @returns {Promise<{success: boolean, groupId?: string, inviteLink?: string, error?: string}>}
 */
export const crearGrupoTelegram = async (nombrePartido, descripcion = '') => {
    if (!isTelegramConfigured()) {
        return {
            success: false,
            error: 'Telegram no está configurado. Configura VITE_TELEGRAM_BOT_TOKEN en tu archivo .env'
        };
    }

    try {
        // Obtener información del bot
        const botInfoResponse = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/getMe`);
        const botInfo = await botInfoResponse.json();
        
        if (!botInfo.ok) {
            return {
                success: false,
                error: `Error obteniendo información del bot: ${botInfo.description || 'Token inválido'}`
            };
        }

        // Crear el grupo (supergroup)
        // Nota: La API de Telegram no permite crear grupos directamente desde un bot
        // Necesitamos usar createChat o crear un grupo manualmente y obtener el chat_id
        // Alternativa: Usar exportChatInviteLink después de crear el grupo manualmente
        
        // Por ahora, retornamos instrucciones para crear el grupo manualmente
        // En producción, esto debería hacerse mediante un webhook o proceso backend
        
        return {
            success: false,
            error: 'La creación automática de grupos requiere configuración adicional. Por favor, crea el grupo manualmente y usa la opción de agregar link del grupo.'
        };
    } catch (error) {
        console.error('Error creando grupo de Telegram:', error);
        return {
            success: false,
            error: `Error al crear grupo: ${error.message}`
        };
    }
};

/**
 * Agrega un usuario a un grupo de Telegram usando su username o user_id
 * @param {string} groupId - ID del grupo (chat_id)
 * @param {string} username - Username de Telegram del usuario (sin @)
 * @param {number} userId - User ID de Telegram (alternativa a username)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const agregarUsuarioAGrupo = async (groupId, username = null, userId = null) => {
    if (!isTelegramConfigured()) {
        return {
            success: false,
            error: 'Telegram no está configurado'
        };
    }

    if (!username && !userId) {
        return {
            success: false,
            error: 'Se requiere username o userId de Telegram'
        };
    }

    try {
        // Intentar agregar por username primero
        if (username) {
            const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/addChatMember`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: username.startsWith('@') ? username : `@${username}`
                })
            });

            const result = await response.json();
            
            if (result.ok) {
                return { success: true };
            }
        }

        // Si falla con username, intentar con userId
        if (userId) {
            const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/addChatMember`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: groupId,
                    user_id: userId
                })
            });

            const result = await response.json();
            
            if (result.ok) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: result.description || 'No se pudo agregar el usuario al grupo'
                };
            }
        }

        return {
            success: false,
            error: 'No se pudo agregar el usuario al grupo'
        };
    } catch (error) {
        console.error('Error agregando usuario a grupo de Telegram:', error);
        return {
            success: false,
            error: `Error al agregar usuario: ${error.message}`
        };
    }
};

/**
 * Obtiene el link de invitación de un grupo
 * @param {string} groupId - ID del grupo (chat_id)
 * @returns {Promise<{success: boolean, inviteLink?: string, error?: string}>}
 */
export const obtenerLinkInvitacion = async (groupId) => {
    if (!isTelegramConfigured()) {
        return {
            success: false,
            error: 'Telegram no está configurado'
        };
    }

    try {
        const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/exportChatInviteLink`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: groupId
            })
        });

        const result = await response.json();
        
        if (result.ok) {
            return {
                success: true,
                inviteLink: result.result
            };
        } else {
            return {
                success: false,
                error: result.description || 'No se pudo obtener el link de invitación'
            };
        }
    } catch (error) {
        console.error('Error obteniendo link de invitación:', error);
        return {
            success: false,
            error: `Error al obtener link: ${error.message}`
        };
    }
};

/**
 * Valida que un link de Telegram sea válido
 * @param {string} link - Link del grupo de Telegram
 * @returns {boolean}
 */
export const validarLinkTelegram = (link) => {
    if (!link) return false;
    // Formato: https://t.me/joinchat/... o https://t.me/+...
    const telegramLinkPattern = /^https?:\/\/(t\.me|telegram\.me)\/(joinchat\/|c\/|)\+?[a-zA-Z0-9_-]+$/;
    return telegramLinkPattern.test(link);
};

/**
 * Extrae el ID del grupo desde un link de Telegram
 * @param {string} link - Link del grupo de Telegram
 * @returns {string|null}
 */
export const extraerGroupIdDeLink = (link) => {
    if (!link) return null;
    
    // Intentar extraer el ID del link
    // Formato: https://t.me/joinchat/ABC123 o https://t.me/c/1234567890/1
    const match = link.match(/(?:joinchat\/|c\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

