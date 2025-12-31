import { useState } from 'react';
import { useToast } from '@/context';
import {
    cargarTodosLosDatos,
    cargarPredios,
    cargarCanchas,
    cargarFranjasHorarias,
    cargarServicios,
    cargarDeportes,
    cargarPrecios
} from '@/services/cargarDatosEjemplo';
import FirebaseConfigAlert from '@/components/FirebaseConfigAlert';
import DebugFirestore from '@/components/DebugFirestore';
import './CargarDatosEjemplo.css';

const CargarDatosEjemplo = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [resultados, setResultados] = useState(null);

    const handleCargarTodo = async () => {
        if (!window.confirm('¿Estás seguro de cargar todos los datos de ejemplo? Esto agregará datos a Firestore.')) {
            return;
        }

        setLoading(true);
        setResultados(null);

        // Timeout de seguridad (5 minutos)
        const timeout = setTimeout(() => {
            setLoading(false);
            addToast('La carga está tomando demasiado tiempo. Verifica la consola para más detalles.', 'error');
            setResultados({ success: false, error: 'Timeout: La operación tardó más de 5 minutos' });
        }, 300000); // 5 minutos

        try {
            console.log('Iniciando carga de datos...');
            const resultado = await Promise.race([
                cargarTodosLosDatos(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout: La carga tardó más de 5 minutos. Revisa la consola para más detalles.')), 300000)
                )
            ]);
            clearTimeout(timeout);
            
            if (resultado.success) {
                addToast('Datos de ejemplo cargados exitosamente', 'success');
                setResultados(resultado);
            } else {
                // Mostrar error con formato mejorado
                const errorMsg = resultado.error?.includes('\n') 
                    ? resultado.error.split('\n').map((line, i) => <div key={i}>{line}</div>)
                    : resultado.error || 'Error al cargar datos';
                addToast(typeof errorMsg === 'string' ? errorMsg : 'Error al cargar datos', 'error');
                setResultados(resultado);
            }
        } catch (error) {
            clearTimeout(timeout);
            console.error('Error en handleCargarTodo:', error);
            const errorMsg = error.message || 'Error inesperado';
            addToast(errorMsg, 'error');
            setResultados({ success: false, error: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const handleCargarIndividual = async (funcion, nombre) => {
        if (!window.confirm(`¿Cargar ${nombre}?`)) {
            return;
        }

        setLoading(true);
        try {
            const resultado = await funcion();
            if (resultado.success) {
                addToast(`${nombre} cargados exitosamente`, 'success');
            } else {
                addToast(resultado.error || `Error al cargar ${nombre}`, 'error');
            }
        } catch (error) {
            addToast(`Error al cargar ${nombre}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cargar-datos">
            <div className="admin-header">
                <h1>Cargar Datos de Ejemplo</h1>
                <p className="subtitulo">
                    Utiliza esta herramienta para cargar datos de ejemplo en Firestore.
                    Útil para desarrollo y testing antes de tener el backend completo.
                </p>
            </div>

            <FirebaseConfigAlert />

            <DebugFirestore />

            <div className="opciones-carga">
                <div className="opcion-principal">
                    <h2>Cargar Todo</h2>
                    <p>Carga todos los datos de ejemplo en el orden correcto</p>
                    <button 
                        onClick={handleCargarTodo} 
                        disabled={loading}
                        className="btn-cargar-todo"
                    >
                        {loading ? 'Cargando...' : '🚀 Cargar Todos los Datos'}
                    </button>
                </div>

                <div className="opciones-individuales">
                    <h3>Cargar Individualmente</h3>
                    <div className="botones-grid">
                        <button
                            onClick={() => handleCargarIndividual(cargarPredios, 'Predios')}
                            disabled={loading}
                            className="btn-cargar"
                        >
                            Predios
                        </button>
                        <button
                            onClick={() => handleCargarIndividual(cargarFranjasHorarias, 'Franjas Horarias')}
                            disabled={loading}
                            className="btn-cargar"
                        >
                            Franjas Horarias
                        </button>
                        <button
                            onClick={() => handleCargarIndividual(cargarServicios, 'Servicios')}
                            disabled={loading}
                            className="btn-cargar"
                        >
                            Servicios
                        </button>
                        <button
                            onClick={() => handleCargarIndividual(cargarDeportes, 'Deportes')}
                            disabled={loading}
                            className="btn-cargar"
                        >
                            Deportes
                        </button>
                        <button
                            onClick={() => handleCargarIndividual(cargarCanchas, 'Canchas')}
                            disabled={loading}
                            className="btn-cargar"
                        >
                            Canchas
                        </button>
                        <button
                            onClick={() => handleCargarIndividual(cargarPrecios, 'Precios')}
                            disabled={loading}
                            className="btn-cargar"
                        >
                            Precios
                        </button>
                    </div>
                </div>
            </div>

            {resultados && (
                <div className={`resultado ${resultados.success ? 'exito' : 'error'}`}>
                    <h3>{resultados.success ? '✅ Éxito' : '❌ Error'}</h3>
                    <p>{resultados.message || resultados.error}</p>
                    {resultados.resumen && (
                        <div className="resumen-carga">
                            <h4>Resumen:</h4>
                            <ul>
                                <li>Predios: {resultados.resumen.predios}</li>
                                <li>Franjas Horarias: {resultados.resumen.franjas}</li>
                                <li>Servicios: {resultados.resumen.servicios}</li>
                                <li>Deportes: {resultados.resumen.deportes}</li>
                                <li>Canchas: {resultados.resumen.canchas}</li>
                                <li>Precios: {resultados.resumen.precios}</li>
                            </ul>
                        </div>
                    )}
                    {resultados.count && !resultados.resumen && (
                        <p>Elementos cargados: {resultados.count}</p>
                    )}
                </div>
            )}

            <div className="info-datos">
                <h3>📋 Datos que se cargarán:</h3>
                <ul>
                    <li><strong>Predios:</strong> 5 predios en diferentes ubicaciones</li>
                    <li><strong>Canchas:</strong> 18 canchas distribuidas en los predios</li>
                    <li><strong>Franjas Horarias:</strong> 16 franjas de 8:00 a 24:00</li>
                    <li><strong>Servicios:</strong> 5 servicios adicionales (grabación, etc.)</li>
                    <li><strong>Deportes:</strong> 4 deportes con sus tipos</li>
                    <li><strong>Precios:</strong> Precios de ejemplo para diferentes días y horarios</li>
                </ul>
                <p className="advertencia">
                    ⚠️ <strong>Nota:</strong> Los datos se cargarán en Firestore. 
                    Si ya existen datos, algunos se omitirán para evitar duplicados.
                </p>
            </div>
        </div>
    );
};

export default CargarDatosEjemplo;

