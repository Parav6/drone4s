import React, { useState } from "react";
import { useSOSProtection } from "@/hooks/useSOSProtection";
import useLocation from "@/hooks/useLocation";

const SOSButton = ({ onClick }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const { enableSOS, sosActive } = useSOSProtection();
    const { latitude, longitude } = useLocation();

    const handleSOSClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirm = async () => {
        setShowConfirmation(false);

        try {
            // Get current location for SOS
            const location = latitude && longitude ? { lat: latitude, lng: longitude } : null;

            // Enable SOS in database
            await enableSOS(location, "Emergency SOS activated by user");

            // Call parent onClick if provided
            if (onClick) {
                onClick();
            }
        } catch (error) {
            console.error('Failed to activate SOS:', error);
            alert('Failed to activate SOS. Please try again.');
        }
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            {/* Only show SOS button if SOS is not already active */}
            {!sosActive && (
                <>
                    {/* Fixed SOS Button */}
                    <button
                        onClick={handleSOSClick}
                        style={{
                            position: 'fixed',
                            bottom: '30px',
                            right: '30px',
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#ff0000',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            zIndex: 9999,
                            boxShadow: '0 4px 20px rgba(255, 0, 0, 0.4)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'pulse 2s infinite'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.1)';
                            e.target.style.boxShadow = '0 6px 25px rgba(255, 0, 0, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 20px rgba(255, 0, 0, 0.4)';
                        }}
                    >
                        🆘
                    </button>

                    {/* Confirmation Popup */}
                    {showConfirmation && (
                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10000,
                                backdropFilter: 'blur(5px)'
                            }}
                            onClick={handleCancel}
                        >
                            <div
                                style={{
                                    backgroundColor: 'white',
                                    padding: '40px',
                                    borderRadius: '20px',
                                    textAlign: 'center',
                                    maxWidth: '400px',
                                    width: '90%',
                                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                                    transform: 'scale(1)',
                                    animation: 'popupSlideIn 0.3s ease-out'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Emergency Icon */}
                                <div
                                    style={{
                                        fontSize: '60px',
                                        marginBottom: '20px',
                                        animation: 'emergencyBlink 1s infinite'
                                    }}
                                >
                                    🚨
                                </div>

                                {/* Heading */}
                                <h2
                                    style={{
                                        color: '#ff0000',
                                        marginBottom: '15px',
                                        fontSize: '24px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    EMERGENCY SOS
                                </h2>

                                {/* Message */}
                                <p
                                    style={{
                                        color: '#333',
                                        marginBottom: '30px',
                                        fontSize: '16px',
                                        lineHeight: '1.5'
                                    }}
                                >
                                    Are you sure you want to send an emergency SOS alert?
                                    <br />
                                    <strong>This will notify emergency contacts immediately.</strong>
                                </p>

                                {/* Buttons */}
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                    <button
                                        onClick={handleCancel}
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: '#gray',
                                            color: '#666',
                                            border: '2px solid #ddd',
                                            borderRadius: '10px',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            fontWeight: '500'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#f0f0f0';
                                            e.target.style.borderColor = '#ccc';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.borderColor = '#ddd';
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleConfirm}
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: '#ff0000',
                                            color: 'white',
                                            border: '2px solid #ff0000',
                                            borderRadius: '10px',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            fontWeight: 'bold'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#cc0000';
                                            e.target.style.borderColor = '#cc0000';
                                            e.target.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#ff0000';
                                            e.target.style.borderColor = '#ff0000';
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    >
                                        🆘 SEND SOS
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CSS Animations */}
                    <style jsx>{`
                @keyframes pulse {
                    0% {
                        box-shadow: 0 4px 20px rgba(255, 0, 0, 0.4);
                    }
                    50% {
                        box-shadow: 0 4px 30px rgba(255, 0, 0, 0.8);
                    }
                    100% {
                        box-shadow: 0 4px 20px rgba(255, 0, 0, 0.4);
                    }
                }

                @keyframes emergencyBlink {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                @keyframes popupSlideIn {
                    0% {
                        transform: scale(0.8) translateY(20px);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
                </>
            )
            }
        </>
    );
};

export default SOSButton;