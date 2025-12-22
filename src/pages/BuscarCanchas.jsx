import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from '@/context';
import './BuscarCanchas.css';

const BuscarCanchas = () => {
    const [canchas, setCanchas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState({
        ciudad: '',
        deporte: '',
        tipo: '',
        buscarCercanas: false
    });
    const { addToast } = useToast();

    const buscarCanchas = async () => {
        setLoading(true);
        try {
            let q = query(collection(db, 'canchas'));

            if (filtros.ciudad) {
                q = query(q, where('ciudad', '==', filtros.ciudad));
            }
            if (filtros.deporte) {
                q = query(q, where('deporte', '==', filtros.deporte));
            }
            if (filtros.tipo) {
                q = query(q, where('tipos', 'array-contains', filtros.tipo));
            }

            const querySnapshot = await getDocs(q);
            const canchasData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCanchas(canchasData);
            addToast(`Se encontraron ${canchasData.length} canchas`, 'success');
        } catch (error) {
            console.error('Error buscando canchas:', error);
            addToast('Error al buscar canchas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const buscarCercanas = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    // Aquí implementarías la lógica para buscar canchas cercanas
                    // usando la geolocalización
                    addToast('Buscando canchas cercanas...', 'info');
                    // Por ahora, buscar todas y luego filtrar por distancia
                    buscarCanchas();
                },
                (error) => {
                    addToast('Error al obtener ubicación', 'error');
                }
            );
        } else {
            addToast('Tu navegador no soporta geolocalización', 'error');
        }
    };

    useEffect(() => {
        buscarCanchas();
    }, []);

    return (
        <div className="buscar-canchas">
            <h1>Buscar Canchas</h1>

            <div className="filtros">
                <div className="filtro-group">
                    <label>Ciudad</label>
                    <input
                        type="text"
                        value={filtros.ciudad}
                        onChange={(e) => setFiltros({ ...filtros, ciudad: e.target.value })}
                        placeholder="Ej: Buenos Aires"
                    />
                </div>

                <div className="filtro-group">
                    <label>Deporte</label>
                    <select
                        value={filtros.deporte}
                        onChange={(e) => setFiltros({ ...filtros, deporte: e.target.value })}
                    >
                        <option value="">Todos</option>
                        <option value="futbol">Fútbol</option>
                        <option value="padel">Pádel</option>
                    </select>
                </div>

                <div className="filtro-group">
                    <label>Tipo (Fútbol)</label>
                    <select
                        value={filtros.tipo}
                        onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                    >
                        <option value="">Todos</option>
                        <option value="5">5 vs 5</option>
                        <option value="7">7 vs 7</option>
                        <option value="8">8 vs 8</option>
                        <option value="11">11 vs 11</option>
                    </select>
                </div>

                <button onClick={buscarCanchas} className="btn-buscar" disabled={loading}>
                    {loading ? 'Buscando...' : 'Buscar'}
                </button>

                <button onClick={buscarCercanas} className="btn-cercanas">
                    <i className="fas fa-map-marker-alt"></i> Cercanas
                </button>
            </div>

            <div className="canchas-grid">
                {canchas.length === 0 && !loading && (
                    <p>No se encontraron canchas. Crea una desde el panel de administración.</p>
                )}
                {canchas.map((cancha) => (
                    <div key={cancha.id} className="cancha-card">
                        <h3>{cancha.nombre}</h3>
                        <p><i className="fas fa-map-marker-alt"></i> {cancha.direccion}, {cancha.ciudad}</p>
                        <p><i className="fas fa-futbol"></i> {cancha.deporte}</p>
                        {cancha.tipos && (
                            <p><i className="fas fa-users"></i> {cancha.tipos.join(', ')}</p>
                        )}
                        <p className="precio">${cancha.precioPorHora}/hora</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BuscarCanchas;




