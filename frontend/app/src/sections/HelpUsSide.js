import { TextField } from "@mui/material"
import React, { useState } from "react"
import "./css/Sides.css"

export default function HelpUsSide() {
    const [value, setValue] = useState();
    const handleValueChange = (event) => {
        setValue(event.target.value)
    }
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState(false);

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(event.target.value)) {
            setEmailError(false);
        } else {
            setEmailError(true);
        }
    }



    const handlePayment = async (event) => {
        event.preventDefault();

        const paymentData = {
            amount: value,
            email: email
        };

        console.log("elo")

        try {
            const response = await fetch('https://wyjatkowe-serca-f74jtttkrq-lm.a.run.app/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.paymentId) {
                window.location.href = data.redirectUrl;
            } else {
                throw new Error('Invalid response data');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <section className="help-us side">
            <div style={{ fontFamily: "Quicksand", fontSize: "32px", color: "#EC1A3B" }}>Wesprzyj Nas</div>
            <TextField
                id="outlined"
                label="Kwota wpłaty"
                value={value}
                onChange={handleValueChange}
                type="number"
            />
            <TextField
                id="outlined"
                label="Adres e-mail"
                value={email}
                onChange={handleEmailChange}
                type="email"
                error={emailError}
                helperText={emailError ? "Nieprawidłowy adres e-mail" : ""}
            />
            <button
                onClick={handlePayment}

                style={{
                    cursor: "pointer",
                    width: "160px",
                    height: "40px",
                    fontSize: "16px",
                }}>Wesprzyj🤍</button>
        </section >
    )
}