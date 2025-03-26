import React from "react";

const SuccessModal = ({ message, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(3px)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          textAlign: "left",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
          minWidth: "320px",
          maxWidth: "400px",
          position: "relative",
          animation: "modalSlideIn 0.3s ease-out"
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{
          margin: "0 0 16px 0",
          color: "#4caf50", // Green color for success
          fontSize: "20px",
          fontWeight: "600"
        }}>
          Success
        </h3>

        <p style={{
          margin: "0 0 20px 0",
          color: "#4b5563",
          lineHeight: "1.6"
        }}>
          {message}
        </p>

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "8px"
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "background-color 0.2s",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = "#388e3c"}
            onMouseOut={e => e.currentTarget.style.backgroundColor = "#4caf50"}
          >
            Close
          </button>
        </div>

        <style>
          {`
            @keyframes modalSlideIn {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default SuccessModal;