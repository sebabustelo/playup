import React from 'react';
import './CanchaCard.css';

const CanchaCard = React.memo(({ cancha, onClick }) => {
    // Obtener información del predio si está disponible
    const predioNombre = cancha.predioNombre || cancha.predio?.nombre || '';
    const predioDireccion = cancha.predioDireccion || cancha.predio?.direccion || '';
    const predioCiudad = cancha.predioCiudad || cancha.predio?.ciudad || '';
    const predioProvincia = cancha.predioProvincia || cancha.predio?.provincia || '';
    
    // Construir dirección completa
    const direccionCompleta = [predioDireccion, predioCiudad, predioProvincia]
        .filter(Boolean)
        .join(', ');

    // Formatear tipos de partido
    const formatTipos = () => {
        if (cancha.tipos && Array.isArray(cancha.tipos) && cancha.tipos.length > 0) {
            return cancha.tipos.map(t => `${t} vs ${t}`).join(', ');
        }
        if (cancha.tipo) {
            return `${cancha.tipo} vs ${cancha.tipo}`;
        }
        return 'No especificado';
    };

    return (
        <div className="cancha-card" onClick={onClick}>
            <div className="cancha-card-header">
                <div className="cancha-title-section">
                    <h3>{cancha.nombre}</h3>
                    {predioNombre && (
                        <p className="cancha-predio-nombre">
                            <i className="fas fa-building"></i>
                            {predioNombre}
                        </p>
                    )}
                </div>
                {cancha.deporte && (
                    <span className="cancha-deporte-badge">
                        {cancha.deporte === 'futbol' ? '⚽' : cancha.deporte === 'padel' ? '🎾' : '🏃'}
                        {cancha.deporte.charAt(0).toUpperCase() + cancha.deporte.slice(1)}
                    </span>
                )}
            </div>

            {direccionCompleta && (
                <div className="cancha-info-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span className="cancha-info-value">{direccionCompleta}</span>
                </div>
            )}

            <div className="cancha-info-item">
                <i className="fas fa-users"></i>
                <span className="cancha-info-label">Tipos:</span>
                <span className="cancha-info-value">{formatTipos()}</span>
            </div>

            {cancha.caracteristicas && Array.isArray(cancha.caracteristicas) && cancha.caracteristicas.length > 0 && (
                <div className="cancha-caracteristicas">
                    {cancha.caracteristicas.slice(0, 2).map((car, index) => (
                        <span key={index} className="cancha-caracteristica-tag">
                            {car.nombre}: {car.valor}
                        </span>
                    ))}
                    {cancha.caracteristicas.length > 2 && (
                        <span className="cancha-caracteristica-tag">
                            +{cancha.caracteristicas.length - 2} más
                        </span>
                    )}
                </div>
            )}

            <div className="cancha-card-footer">
                <button className="btn-ver-cancha">
                    Ver detalles y reservar
                    <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    );
});

CanchaCard.displayName = 'CanchaCard';

export default CanchaCard;

