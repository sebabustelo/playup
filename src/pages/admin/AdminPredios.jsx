import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from '@/context';
import GoogleMapsInputSimple from '@/components/GoogleMapsInputSimple';
import AddressInputSimple from '@/components/AddressInputSimple';
import './AdminPredios.css';

const AdminPredios = () => {
    const { addToast } = useToast();
    const [predios, setPredios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        provincia: '',
        ciudad: '',
        direccion: '',
        latitud: '',
        longitud: '',
        telefono: '',
        email: '',
        diasAnticipacion: 30, // Días hacia adelante que se pueden reservar (por defecto 30)
        tipoPago: 'total', // 'reserva' | 'total'
        tipoReserva: 'porcentaje', // 'monto' | 'porcentaje' (solo si tipoPago es 'reserva')
        valorReserva: 50 // Monto fijo o porcentaje según tipoReserva
    });

    useEffect(() => {
        cargarPredios();
    }, []);

    const cargarPredios = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'predios'));
            const prediosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPredios(prediosData);
        } catch (error) {
            console.error('Error cargando predios:', error);
            addToast('Error al cargar predios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLocationSelect = (location) => {
        if (location && location.lat && location.lng) {
            setFormData({
                ...formData,
                latitud: location.lat.toString(),
                longitud: location.lng.toString()
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const predioData = {
                ...formData,
                latitud: formData.latitud ? parseFloat(formData.latitud) : null,
                longitud: formData.longitud ? parseFloat(formData.longitud) : null,
                diasAnticipacion: parseInt(formData.diasAnticipacion) || 30,
                tipoPago: formData.tipoPago || 'total',
                tipoReserva: formData.tipoPago === 'reserva' ? (formData.tipoReserva || 'porcentaje') : null,
                valorReserva: formData.tipoPago === 'reserva' ? parseFloat(formData.valorReserva) || 0 : null,
                creadoEn: editando ? editando.creadoEn : new Date(),
                actualizadoEn: new Date()
            };

            if (editando) {
                await updateDoc(doc(db, 'predios', editando.id), predioData);
                addToast('Predio actualizado', 'success');
            } else {
                await addDoc(collection(db, 'predios'), predioData);
                addToast('Predio creado', 'success');
            }

            setFormData({
                nombre: '',
                provincia: '',
                ciudad: '',
                direccion: '',
                latitud: '',
                longitud: '',
                telefono: '',
                email: '',
                diasAnticipacion: 30,
                tipoPago: 'total',
                tipoReserva: 'porcentaje',
                valorReserva: 50
            });
            setMostrarForm(false);
            setEditando(null);
            cargarPredios();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al guardar predio', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditar = (predio) => {
        setEditando(predio);
        setFormData({
            nombre: predio.nombre || '',
            provincia: predio.provincia || '',
            ciudad: predio.ciudad || '',
            direccion: predio.direccion || '',
            latitud: predio.latitud?.toString() || '',
            longitud: predio.longitud?.toString() || '',
            telefono: predio.telefono || '',
            email: predio.email || '',
            diasAnticipacion: predio.diasAnticipacion || 30,
            tipoPago: predio.tipoPago || 'total',
            tipoReserva: predio.tipoReserva || 'porcentaje',
            valorReserva: predio.valorReserva || 50
        });
        setMostrarForm(true);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este predio? Esto también eliminará todas sus canchas.')) return;

        try {
            // Eliminar canchas asociadas
            const canchasSnapshot = await getDocs(
                query(collection(db, 'canchas'), where('predioId', '==', id))
            );
            const deleteCanchas = canchasSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteCanchas);

            await deleteDoc(doc(db, 'predios', id));
            addToast('Predio eliminado', 'success');
            cargarPredios();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al eliminar predio', 'error');
        }
    };

    return (
        <div className="admin-predios">
            <div className="admin-header">
                <h1>Gestionar Predios</h1>
                <button onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); }} className="btn-nuevo">
                    {mostrarForm ? 'Cancelar' : '+ Nuevo Predio'}
                </button>
            </div>

            {mostrarForm && (
                <form onSubmit={handleSubmit} className="predio-form">
                    <h2>{editando ? 'Editar Predio' : 'Nuevo Predio'}</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre del Predio *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Predio Futbol, Serrano Corner"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Provincia *</label>
                            <select
                                name="provincia"
                                value={formData.provincia}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecciona</option>
                                <option value="Capital Federal">Capital Federal</option>
                                <option value="Buenos Aires">Buenos Aires</option>
                                <option value="Córdoba">Córdoba</option>
                                <option value="Santa Fe">Santa Fe</option>
                                <option value="Mendoza">Mendoza</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ciudad *</label>
                            <input
                                type="text"
                                name="ciudad"
                                value={formData.ciudad}
                                onChange={handleChange}
                                placeholder="Ej: Buenos Aires, Villa Crespo"
                                required
                            />
                        </div>
                        <div className="form-group form-group-full">
                            {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                                <GoogleMapsInputSimple
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    onLocationSelect={handleLocationSelect}
                                    placeholder="Buscar dirección o hacer clic en el mapa..."
                                    label="Dirección"
                                />
                            ) : (
                                <AddressInputSimple
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    onLocationSelect={handleLocationSelect}
                                    placeholder="Ingresa la dirección completa..."
                                    label="Dirección"
                                />
                            )}
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="11 1234-5678"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contacto@predio.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Latitud (opcional)</label>
                            <input
                                type="number"
                                name="latitud"
                                value={formData.latitud}
                                onChange={handleChange}
                                step="any"
                                placeholder="-34.603722"
                            />
                        </div>
                        <div className="form-group">
                            <label>Longitud (opcional)</label>
                            <input
                                type="number"
                                name="longitud"
                                value={formData.longitud}
                                onChange={handleChange}
                                step="any"
                                placeholder="-58.381592"
                            />
                        </div>
                        <div className="form-group">
                            <label>Días de Anticipación para Reservas *</label>
                            <input
                                type="number"
                                name="diasAnticipacion"
                                value={formData.diasAnticipacion}
                                onChange={handleChange}
                                min="1"
                                max="365"
                                required
                                placeholder="30"
                            />
                            <small className="form-hint">
                                Cantidad de días hacia adelante que los usuarios pueden reservar (ej: 30 = hasta 30 días desde hoy)
                            </small>
                        </div>
                        <div className="form-group form-group-full">
                            <label>Tipo de Pago Requerido *</label>
                            <select
                                name="tipoPago"
                                value={formData.tipoPago}
                                onChange={handleChange}
                                required
                            >
                                <option value="total">Pago Total de la Cancha</option>
                                <option value="reserva">Solo Reserva</option>
                            </select>
                            <small className="form-hint">
                                Si seleccionas "Solo Reserva", el usuario pagará solo una parte al crear el partido
                            </small>
                        </div>
                        {formData.tipoPago === 'reserva' && (
                            <>
                                <div className="form-group">
                                    <label>Tipo de Reserva *</label>
                                    <select
                                        name="tipoReserva"
                                        value={formData.tipoReserva}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="porcentaje">Porcentaje del Total</option>
                                        <option value="monto">Monto Fijo</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>
                                        {formData.tipoReserva === 'porcentaje' ? 'Porcentaje de Reserva (%)' : 'Monto de Reserva ($)'} *
                                    </label>
                                    <input
                                        type="number"
                                        name="valorReserva"
                                        value={formData.valorReserva}
                                        onChange={handleChange}
                                        min="0"
                                        step={formData.tipoReserva === 'porcentaje' ? "1" : "0.01"}
                                        max={formData.tipoReserva === 'porcentaje' ? "100" : undefined}
                                        required
                                        placeholder={formData.tipoReserva === 'porcentaje' ? "50" : "10000"}
                                    />
                                    <small className="form-hint">
                                        {formData.tipoReserva === 'porcentaje' 
                                            ? 'Porcentaje del precio total que se debe pagar como reserva (ej: 50 = 50%)'
                                            : 'Monto fijo en pesos que se debe pagar como reserva'}
                                    </small>
                                </div>
                            </>
                        )}
                    </div>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                    </button>
                </form>
            )}

            <div className="predios-list">
                {predios.length === 0 ? (
                    <p>No hay predios registrados. Crea el primero para comenzar.</p>
                ) : (
                    <div className="predios-grid">
                        {predios.map(predio => (
                            <div key={predio.id} className="predio-card">
                                <h3>{predio.nombre}</h3>
                                <p><i className="fas fa-map-marker-alt"></i> {predio.direccion}</p>
                                <p><i className="fas fa-city"></i> {predio.ciudad}, {predio.provincia}</p>
                                {predio.telefono && <p><i className="fas fa-phone"></i> {predio.telefono}</p>}
                                {predio.email && <p><i className="fas fa-envelope"></i> {predio.email}</p>}
                                <p><i className="fas fa-calendar-alt"></i> Reservas hasta {predio.diasAnticipacion || 30} días adelante</p>
                                <p>
                                    <i className="fas fa-money-bill-wave"></i> Pago: {predio.tipoPago === 'reserva' 
                                        ? `Reserva ${predio.tipoReserva === 'porcentaje' ? `${predio.valorReserva || 50}%` : `$${predio.valorReserva || 0}`}`
                                        : 'Total'}
                                </p>
                                <div className="predio-actions">
                                    <button onClick={() => handleEditar(predio)} className="btn-editar">
                                        Editar
                                    </button>
                                    <button onClick={() => handleEliminar(predio.id)} className="btn-eliminar">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPredios;

