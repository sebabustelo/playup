import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import './PartidoCard.css';

const PartidoCard = React.memo(({ partido }) => {
    return (
        <Link to={`/partido/${partido.id}`} className="partido-card">
            <h3>{partido.canchaNombre}</h3>
            <p><i className="fas fa-calendar"></i> {format(new Date(partido.fecha), 'dd/MM/yyyy')}</p>
            <p><i className="fas fa-clock"></i> {partido.hora}</p>
            <p><i className="fas fa-users"></i> {partido.tipo} vs {partido.tipo}</p>
            <p><i className="fas fa-dollar-sign"></i> ${partido.precioTotal} total</p>
            <p className="jugadores-count">
                {partido.jugadores?.length || 0} jugadores
            </p>
            <span className={`estado estado-${partido.estado}`}>
                {partido.estado}
            </span>
        </Link>
    );
});

PartidoCard.displayName = 'PartidoCard';

export default PartidoCard;


