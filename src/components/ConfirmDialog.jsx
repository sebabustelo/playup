import { useEffect } from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Confirmar acción',
    message = '¿Estás seguro?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning', // 'warning', 'danger', 'info', 'success'
    icon = null
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const getIcon = () => {
        if (icon) return icon;
        
        switch (type) {
            case 'danger':
                return <i className="fas fa-exclamation-triangle"></i>;
            case 'warning':
                return <i className="fas fa-exclamation-circle"></i>;
            case 'info':
                return <i className="fas fa-info-circle"></i>;
            case 'success':
                return <i className="fas fa-check-circle"></i>;
            default:
                return <i className="fas fa-question-circle"></i>;
        }
    };

    return (
        <div className="confirm-dialog-overlay" onClick={handleBackdropClick}>
            <div className={`confirm-dialog confirm-dialog-${type}`}>
                <div className="confirm-dialog-header">
                    <div className="confirm-dialog-icon">
                        {getIcon()}
                    </div>
                    <h3>{title}</h3>
                </div>
                
                <div className="confirm-dialog-body">
                    {typeof message === 'string' ? (
                        <p>{message}</p>
                    ) : (
                        <div className="confirm-dialog-content">
                            {message}
                        </div>
                    )}
                </div>

                <div className="confirm-dialog-footer">
                    <button 
                        className="confirm-dialog-btn confirm-dialog-btn-cancel"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className={`confirm-dialog-btn confirm-dialog-btn-confirm confirm-dialog-btn-${type}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;


