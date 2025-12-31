import { useState, useRef, useEffect } from 'react';
import './GoogleMapsInput.css';

// Versión simplificada que carga Google Maps desde el script tag
const GoogleMapsInputSimple = ({ 
    value, 
    onChange, 
    onLocationSelect,
    placeholder = "Buscar dirección...",
    label = "Dirección"
}) => {
    const [autocomplete, setAutocomplete] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: -34.603722, lng: -58.381592 });
    const [marker, setMarker] = useState(null);
    const [map, setMap] = useState(null);
    const inputRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [mapsLoaded, setMapsLoaded] = useState(false);

    // Cargar Google Maps API
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
            console.warn('VITE_GOOGLE_MAPS_API_KEY no está configurada');
            return;
        }

        // Verificar si ya está cargada
        if (window.google && window.google.maps) {
            setMapsLoaded(true);
            return;
        }

        // Cargar script de Google Maps
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&region=AR`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setMapsLoaded(true);
        };
        script.onerror = () => {
            console.error('Error al cargar Google Maps');
        };
        document.head.appendChild(script);

        return () => {
            // No remover el script, puede ser usado por otros componentes
        };
    }, []);

    // Inicializar autocomplete cuando Maps esté cargado
    useEffect(() => {
        if (mapsLoaded && inputRef.current && !autocomplete && window.google) {
            const autocompleteInstance = new window.google.maps.places.Autocomplete(
                inputRef.current,
                {
                    types: ['address'],
                    componentRestrictions: { country: 'ar' },
                    fields: ['geometry', 'formatted_address', 'name']
                }
            );

            autocompleteInstance.addListener('place_changed', () => {
                const place = autocompleteInstance.getPlace();
                
                if (place.geometry) {
                    const location = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.formatted_address || place.name
                    };

                    // Actualizar dirección
                    onChange({ target: { name: 'direccion', value: location.address } });
                    
                    // Actualizar coordenadas
                    if (onLocationSelect) {
                        onLocationSelect({
                            lat: location.lat,
                            lng: location.lng
                        });
                    }

                    // Actualizar mapa si está visible
                    setMapCenter({ lat: location.lat, lng: location.lng });
                    setMarker({ lat: location.lat, lng: location.lng });
                    
                    if (map) {
                        map.setCenter({ lat: location.lat, lng: location.lng });
                        if (markerRef.current) {
                            markerRef.current.setPosition({ lat: location.lat, lng: location.lng });
                        }
                    }
                }
            });

            setAutocomplete(autocompleteInstance);
        }
    }, [mapsLoaded, inputRef.current]);

    // Inicializar mapa
    useEffect(() => {
        if (showMap && mapRef.current && mapsLoaded && !map && window.google) {
            const newMap = new window.google.maps.Map(mapRef.current, {
                center: mapCenter,
                zoom: 15,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true
            });

            // Manejar clic en el mapa
            newMap.addListener('click', (e) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                
                setMarker({ lat, lng });
                
                // Geocoding inverso
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const address = results[0].formatted_address;
                        if (inputRef.current) {
                            inputRef.current.value = address;
                        }
                        onChange({ target: { name: 'direccion', value: address } });
                        if (onLocationSelect) {
                            onLocationSelect({ lat, lng });
                        }
                    }
                });
            });

            setMap(newMap);
        }
    }, [showMap, mapsLoaded, mapRef.current]);

    // Actualizar marcador en el mapa
    useEffect(() => {
        if (map && marker && window.google) {
            if (markerRef.current) {
                markerRef.current.setPosition(marker);
            } else {
                const newMarker = new window.google.maps.Marker({
                    position: marker,
                    map: map,
                    draggable: true,
                    title: 'Ubicación del predio'
                });

                newMarker.addListener('dragend', (e) => {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    setMarker({ lat, lng });
                    
                    // Geocoding inverso al arrastrar
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                        if (status === 'OK' && results[0]) {
                            const address = results[0].formatted_address;
                            if (inputRef.current) {
                                inputRef.current.value = address;
                            }
                            onChange({ target: { name: 'direccion', value: address } });
                            if (onLocationSelect) {
                                onLocationSelect({ lat, lng });
                            }
                        }
                    });
                });

                markerRef.current = newMarker;
            }
            map.setCenter(marker);
        }
    }, [map, marker]);

    if (!mapsLoaded) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            return (
                <div className="google-maps-error">
                    <p>Google Maps no está configurado</p>
                    <small>Agrega VITE_GOOGLE_MAPS_API_KEY en tu archivo .env</small>
                </div>
            );
        }
        return (
            <div className="google-maps-loading">
                <p>Cargando Google Maps...</p>
            </div>
        );
    }

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
                />
                <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="btn-map-toggle"
                    title="Abrir mapa para seleccionar ubicación"
                >
                    <i className="fas fa-map-marker-alt"></i>
                    {showMap ? 'Ocultar Mapa' : 'Abrir Mapa'}
                </button>
            </div>

            {showMap && (
                <div className="map-container">
                    <div ref={mapRef} style={{ width: '100%', height: '400px' }} />
                    <p className="map-hint">
                        <i className="fas fa-info-circle"></i> Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación
                    </p>
                </div>
            )}
        </div>
    );
};

export default GoogleMapsInputSimple;


