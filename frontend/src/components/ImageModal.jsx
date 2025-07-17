import React from 'react';
import { IoClose } from 'react-icons/io5';
import './ImageModal.css';

function ImageModal({ isOpen, imageUrl, onClose }) {
    if (!isOpen || !imageUrl) return null;

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-container">
                <button className="image-close-button" onClick={onClose}>
                    <IoClose />
                </button>
                <img
                    src={imageUrl}
                    alt="Aperçu"
                    className="image-modal-content"
                    onClick={e => e.stopPropagation()}
                />
            </div>
        </div>
    );
}

export default ImageModal;