import { useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { COLLECTIONS } from '@/utils/constants';
import { useToast } from '@/context';

const DebugFirestore = () => {
    const { addToast } = useToast();
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState(null);

    const testConnection = async () => {
        setTesting(true);
        setResult(null);

        try {
            console.log('🔍 Probando conexión con Firestore...');
            console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID || 'playup-3a22d');
            
            // Verificar que db esté inicializado
            if (!db) {
                throw new Error('Firestore no está inicializado. Verifica la configuración de Firebase.');
            }
            
            console.log('✅ Firestore instance creada');
            
            // Test 1: Leer colección (con timeout más largo)
            console.log('Test 1: Intentando leer colección predios...');
            let readTest;
            try {
                readTest = await Promise.race([
                    getDocs(collection(db, COLLECTIONS.PREDIOS)),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('TIMEOUT_LECTURA')), 20000)
                    )
                ]);
                console.log('✅ Lectura OK:', readTest.size, 'documentos encontrados');
            } catch (readError) {
                if (readError.message === 'TIMEOUT_LECTURA') {
                    throw new Error('TIMEOUT: No se pudo leer de Firestore. Esto generalmente significa que:\n\n1. ❌ Firestore NO está creado en Firebase Console\n   → Ve a: https://console.firebase.google.com/project/playup-3a22d/firestore\n   → Haz clic en "Crear base de datos"\n   → Elige "Modo de prueba"\n\n2. ❌ O las Security Rules están bloqueando el acceso\n   → Ve a Firestore → Reglas\n   → Publica las reglas del archivo firestore.rules');
                }
                throw readError;
            }

            // Test 2: Escribir documento de prueba
            console.log('Test 2: Intentando escribir documento de prueba...');
            let writeTest;
            try {
                writeTest = await Promise.race([
                    addDoc(collection(db, COLLECTIONS.PREDIOS), {
                        nombre: 'Test Connection',
                        ciudad: 'Test',
                        provincia: 'Test',
                        direccion: 'Test',
                        creadoEn: new Date(),
                        test: true
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('TIMEOUT_ESCRITURA')), 20000)
                    )
                ]);
                console.log('✅ Escritura OK:', writeTest.id);
            } catch (writeError) {
                if (writeError.message === 'TIMEOUT_ESCRITURA') {
                    throw new Error('TIMEOUT: No se pudo escribir en Firestore. Verifica las Security Rules.');
                }
                throw writeError;
            }

            setResult({
                success: true,
                message: 'Conexión exitosa. Firestore está funcionando correctamente.',
                readTest: readTest.size,
                writeTest: writeTest.id
            });
            addToast('Conexión con Firestore exitosa', 'success');
        } catch (error) {
            console.error('❌ Error en test:', error);
            let errorMessage = error.message;
            let solucion = '';
            
            if (error.message.includes('permission') || error.message.includes('Permission')) {
                errorMessage = 'Error de permisos';
                solucion = 'Las Security Rules no permiten esta operación.\n\nSolución:\n1. Ve a Firebase Console → Firestore → Reglas\n2. Copia el contenido de firestore.rules\n3. Pégalo en el editor\n4. Haz clic en "Publicar"';
            } else if (error.message.includes('not found') || error.message.includes('not initialized')) {
                errorMessage = 'Firestore no está inicializado';
                solucion = 'Ve a Firebase Console y crea la base de datos Firestore:\n\n1. https://console.firebase.google.com/project/playup-3a22d/firestore\n2. Haz clic en "Crear base de datos"\n3. Elige "Comenzar en modo de prueba"\n4. Selecciona ubicación: southamerica-east1\n5. Haz clic en "Habilitar"';
            } else if (error.message.includes('TIMEOUT')) {
                errorMessage = 'Timeout: No se pudo conectar a Firestore';
                solucion = error.message.split('\n').slice(1).join('\n') || 'Verifica que:\n1. Firestore esté creado en Firebase Console\n2. Las Security Rules estén configuradas\n3. Tu conexión a internet funcione';
            }
            
            setResult({
                success: false,
                error: errorMessage,
                solucion: solucion,
                details: error.message
            });
            addToast('Error en conexión con Firestore', 'error');
        } finally {
            setTesting(false);
        }
    };

    return (
        <div style={{
            background: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ddd'
        }}>
            <h3 style={{ marginTop: 0 }}>🔧 Debug de Firestore</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
                Usa esta herramienta para probar la conexión con Firestore y diagnosticar problemas.
            </p>
            <button
                onClick={testConnection}
                disabled={testing}
                style={{
                    padding: '10px 20px',
                    background: testing ? '#ccc' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: testing ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                }}
            >
                {testing ? 'Probando...' : 'Probar Conexión con Firestore'}
            </button>

            {result && (
                <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: result.success ? '#e8f5e9' : '#ffebee',
                    border: `1px solid ${result.success ? '#4CAF50' : '#f44336'}`,
                    borderRadius: '5px'
                }}>
                    {result.success ? (
                        <div>
                            <strong style={{ color: '#4CAF50' }}>✅ {result.message}</strong>
                            <ul style={{ marginTop: '10px', marginBottom: 0 }}>
                                <li>Lectura: {result.readTest} documentos</li>
                                <li>Escritura: Documento creado (ID: {result.writeTest})</li>
                            </ul>
                        </div>
                    ) : (
                        <div>
                            <strong style={{ color: '#f44336' }}>❌ Error: {result.error}</strong>
                            {result.solucion && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '10px',
                                    background: '#fff3cd',
                                    border: '1px solid #ffc107',
                                    borderRadius: '5px',
                                    whiteSpace: 'pre-line',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.6'
                                }}>
                                    <strong>💡 Solución:</strong>
                                    <div style={{ marginTop: '5px' }}>{result.solucion}</div>
                                </div>
                            )}
                            {result.details && !result.solucion && (
                                <p style={{ fontSize: '0.85rem', marginTop: '5px', color: '#666' }}>
                                    Detalles: {result.details}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DebugFirestore;

