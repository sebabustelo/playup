import { useState, useRef, useEffect } from 'react';
import './GoogleMapsInput.css';

// Versión simplificada sin Google Maps - solo input manual con geocoding opcional
const AddressInputSimple = ({ 
    value, 
    onChange, 
    onLocationSelect,
    placeholder = "Ingresa la dirección...",
    label = "Dirección"
}) => {
    const [showGeocode, setShowGeocode] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const inputRef = useRef(null);
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Geocodificar dirección manualmente (solo si hay API Key)
    const geocodeAddress = async () => {
        const address = inputRef.current?.value || value;
        if (!address || !apiKey) {
            return;
        }

        setGeocoding(true);
        try {
            const encodedAddress = encodeURIComponent(address);
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=ar`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.results[0]) {
                const location = data.results[0].geometry.location;
                const lat = location.lat;
                const lng = location.lng;
                const formattedAddress = data.results[0].formatted_address;

                // Actualizar dirección con la formateada
                onChange({ target: { name: 'direccion', value: formattedAddress } });
                
                // Actualizar coordenadas
                if (onLocationSelect) {
                    onLocationSelect({ lat, lng });
                }

                setShowGeocode(false);
            } else {
                alert('No se pudo encontrar la ubicación. Verifica la dirección.');
            }
        } catch (error) {
            console.error('Error en geocodificación:', error);
            alert('Error al obtener coordenadas. Verifica tu conexión.');
        } finally {
            setGeocoding(false);
        }
    };

    return (
        <div className="google-maps-input-container">
            <label>{label} *</label>
            <div className="address-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    name="direccion"
                    defaultValue={value}
                    placeholder={placeholder}
                    className="address-input"
                    required
                    onChange={onChange}
                />
                {apiKey && (
                    <button
                        type="button"
                        onClick={geocodeAddress}
                        className="btn-map-toggle"
                        disabled={geocoding || !value}
                        title="Obtener coordenadas automáticamente"
                    >
                        <i className="fas fa-map-marker-alt"></i>
                        {geocoding ? 'Buscando...' : 'Obtener Coordenadas'}
                    </button>
                )}
            </div>
            {!apiKey && (
                <small className="form-hint">
                    💡 Tip: Agrega VITE_GOOGLE_MAPS_API_KEY en .env para obtener coordenadas automáticamente
                </small>
            )}
        </div>
    );
};

export default AddressInputSimple;


