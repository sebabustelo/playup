import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'Cargando...' }) => {
    return (
        <div className={`loading-spinner ${size}`}>
            <div className="spinner">
                <i className="fas fa-spinner fa-spin"></i>
            </div>
            {text && <p>{text}</p>}
        </div>
    );
};

export default LoadingSpinner;


