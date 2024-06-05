import { CircularProgress, TextField } from "@mui/material"
import React, { useEffect, useState } from "react"
import "./css/Sides.css"

export default function HelpUsSide() {
    const [value, setValue] = useState();
    const handleValueChange = (event) => {
        setValue(event.target.value)
    }
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emptyData, setEmptyData] = useState(false);

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
        if (email.length > 0 && value !== undefined) {
            setEmptyData(false);
            setLoading(true);

            const paymentData = {
                amount: value,
                email: email
            };

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
            } finally {
                setValue("");
                setEmail("");
            }
        } else {
            setEmptyData(true);
        }
    };

    return (
        <section className="help-us side">
            <div className="supportUs">Wesprzyj Nas</div>
            <div className="textfield-container">
                <TextField
                    aria-label="Pole tekstowe na kwotę wpłaty"
                    required
                    id="outlined"
                    label="Kwota wpłaty"
                    value={value}
                    onChange={handleValueChange}
                    type="number"
                    helperText={emptyData ? "Wymagane pole" : ""}
                />
            </div>
            <div className="textfield-container">
                <TextField
                    aria-label="Pole tekstowe na email"
                    required
                    id="outlined"
                    label="Adres e-mail"
                    value={email}
                    onChange={handleEmailChange}
                    type="email"
                    error={emailError}
                    helperText={emailError ? "Nieprawidłowy adres e-mail" : "" || emptyData ? "Wymagane pole" : ""}
                />
            </div>
            <div className="button-container">
                {loading ? (
                    <button
                        onClick={handlePayment}
                    ><i className="fa fa-circle-o-notch fa-spin"></i></button>
                ) : (
                    <button
                        onClick={handlePayment}
                        style={{
                            cursor: "pointer",
                        }}>
                        Wesprzyj🤍
                    </button>
                )}
            </div>

        </section >
    )
}