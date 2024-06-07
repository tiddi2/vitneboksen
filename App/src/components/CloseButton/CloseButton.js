import React from "react";
import "./CloseButton.css";

const CloseButton = ({ label, onClick, ariaLabel }) => {
  return (
    <button
      className="close-button"
      aria-label={ariaLabel}
      onClick={() => onClick()}
    >
      {label ? label : "X"}
    </button>
  );
};
export default CloseButton;
