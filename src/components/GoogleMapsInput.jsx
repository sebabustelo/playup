import { useState, useRef, useEffect } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import './GoogleMapsInput.css';

const libraries = ['places'];

const GoogleMapsInput = ({ 
    value, 
    onChange, 
    onLocationSelect,
    placeholder = "Buscar dirección...",
    label = "Dirección"
}) => {
    const [autocomplete, setAutocomplete] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: -34.603722, lng: -58.381592 }); // Buenos Aires por defecto
    const [mapMarker, setMapMarker] = useState(null);
    const inputRef = useRef(null);
    const mapRef = useRef(null);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries
    });

    useEffect(() => {
        // Si hay coordenadas, centrar el mapa ahí
        if (onLocationSelect && onLocationSelect.lat && onLocationSelect.lng) {
            setMapCenter({ lat: onLocationSelect.lat, lng: onLocationSelect.lng });
        }
    }, [onLocationSelect]);

    const onLoad = (autocompleteInstance) => {
        setAutocomplete(autocompleteInstance);
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            
            if (place.geometry) {
                const location = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    address: place.formatted_address || place.name
                };

                // Actualizar el input con la dirección completa
                if (inputRef.current) {
                    inputRef.current.value = location.address;
                }
                
                // Actualizar el estado del formulario
                onChange({ target: { name: 'direccion', value: location.address } });
                
                // Actualizar coordenadas
                if (onLocationSelect) {
                    onLocationSelect({
                        lat: location.lat,
                        lng: location.lng
                    });
                }

                // Actualizar mapa
                setMapCenter({ lat: location.lat, lng: location.lng });
                setMapMarker({ lat: location.lat, lng: location.lng });
            }
        }
    };

    const handleMapClick = (e) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            setMapMarker({ lat, lng });
            
            // Hacer geocoding inverso para obtener la dirección
            if (window.google && window.google.maps) {
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
            }
        }
    };

    if (loadError) {
        return (
            <div className="google-maps-error">
                <p>Error al cargar Google Maps. Verifica que la API Key esté configurada.</p>
                <small>Agrega VITE_GOOGLE_MAPS_API_KEY en tu archivo .env</small>
            </div>
        );
    }

    if (!isLoaded) {
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
                <Autocomplete
                    onLoad={onLoad}
                    onPlaceChanged={onPlaceChanged}
                    options={{
                        types: ['address'],
                        componentRestrictions: { country: 'ar' } // Restringir a Argentina
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        name="direccion"
                        defaultValue={value}
                        placeholder={placeholder}
                        className="address-input"
                        required
                    />
                </Autocomplete>
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
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '400px' }}
                        center={mapCenter}
                        zoom={15}
                        onClick={handleMapClick}
                        onLoad={(map) => {
                            mapRef.current = map;
                            if (mapMarker) {
                                new window.google.maps.Marker({
                                    position: mapMarker,
                                    map: map,
                                    draggable: true,
                                    title: 'Ubicación del predio'
                                });
                            }
                        }}
                    >
                        {mapMarker && (
                            <Marker
                                position={mapMarker}
                                draggable={true}
                                onDragEnd={(e) => {
                                    const lat = e.latLng.lat();
                                    const lng = e.latLng.lng();
                                    setMapMarker({ lat, lng });
                                    handleMapClick({ latLng: { lat: () => lat, lng: () => lng } });
                                }}
                            />
                        )}
                    </GoogleMap>
                    <p className="map-hint">
                        <i className="fas fa-info-circle"></i> Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación
                    </p>
                </div>
            )}
        </div>
    );
};

// Componente simplificado de GoogleMap (sin librería externa)
const GoogleMap = ({ children, ...props }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);

    useEffect(() => {
        if (mapRef.current && !map && window.google) {
            const newMap = new window.google.maps.Map(mapRef.current, {
                center: props.center,
                zoom: props.zoom,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true
            });

            if (props.onClick) {
                newMap.addListener('click', props.onClick);
            }

            if (props.onLoad) {
                props.onLoad(newMap);
            }

            setMap(newMap);
        }
    }, [mapRef.current, window.google]);

    useEffect(() => {
        if (map && props.center) {
            map.setCenter(props.center);
        }
    }, [props.center, map]);

    return <div ref={mapRef} style={props.mapContainerStyle} />;
};

const Marker = ({ position, draggable, onDragEnd }) => {
    const markerRef = useRef(null);

    useEffect(() => {
        if (markerRef.current && window.google && position) {
            const marker = new window.google.maps.Marker({
                position: position,
                map: markerRef.current.getMap(),
                draggable: draggable,
                title: 'Ubicación del predio'
            });

            if (onDragEnd) {
                marker.addListener('dragend', (e) => {
                    onDragEnd(e);
                });
            }

            return () => {
                marker.setMap(null);
            };
        }
    }, [position, draggable, onDragEnd]);

    return null;
};

export default GoogleMapsInput;


