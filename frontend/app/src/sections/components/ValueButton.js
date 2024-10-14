import React, { useState, useEffect } from "react";

const ValueButton = ({
    setValue,
    value,
    isActive,
    resetButton,
    isAnotherButton = false,
    handleAnotherValue = null,
    anotherButtonClicked = false,
}) => {
    const [buttonClicked, setButtonClicked] = useState(false);

    const handleSetValue = () => {
        if (isAnotherButton && handleAnotherValue) {
            handleAnotherValue();
        } else {
            setValue(value);
            setButtonClicked(!buttonClicked);
        }
    };

    useEffect(() => {
        if (resetButton === true && !isActive && !isAnotherButton) {
            setButtonClicked(false);
        }
    }, [resetButton, isActive, isAnotherButton]);

    return (
        <button
            type="button"
            className="btn"
            style={{
                width: "40px",
                height: "40px",
                fontSize: "15px",
                color: "white",
                backgroundColor: isAnotherButton
                    ? (anotherButtonClicked ? "#2383C5" : "#EC1A3B")
                    : (isActive ? "#2383C5" : "#EC1A3B"),
            }}
            onClick={handleSetValue}
        >
            {isAnotherButton ? "inna" : value}
        </button>
    );
};

export default ValueButton;
