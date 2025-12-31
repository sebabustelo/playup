import React from 'react';
import { isFirebaseConfigured } from '@/firebase';
import './FirebaseConfigAlert.css';

const FirebaseConfigAlert = () => {
    if (isFirebaseConfigured()) {
        return null;
    }

    return (
        <div className="firebase-alert">
            <div className="alert-content">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Firebase no está configurado</strong>
                    <p>
                        Para cargar datos de ejemplo, necesitas configurar Firebase en <code>src/firebase.js</code>
                        o usar variables de entorno.
                    </p>
                    <p className="alert-details">
                        Variables necesarias: <code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_PROJECT_ID</code>, etc.
                    </p>
                    <p className="alert-link">
                        📖 Ver instrucciones en <code>CONFIGURACION_FIREBASE.md</code>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FirebaseConfigAlert;

