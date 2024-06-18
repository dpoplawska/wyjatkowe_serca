import { CircularProgress, TextField } from "@mui/material"
import React, { useEffect, useState } from "react"
import "./css/Sides.css"

export default function HelpUsSide() {
    const [value, setValue] = useState();
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emptyValue, setEmptyValue] = useState(false);
    const [emptyEmail, setEmptyEmail] = useState(false);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    const handleValueChange = (event) => {
        setValue(event.target.value)
        setEmptyValue(false);
    };

    const handleEmailChange = (event) => {
        setEmailError(false)
        setEmptyEmail(false);
        setEmail(event.target.value);
        if (emailRegex.test(event.target.value)) {
            setEmailError(false);
            setEmptyEmail(false);
        } else if (event.target.value.length < 1) {
            setEmptyEmail(true)
        } else {
            setEmailError(true);
        }
    }

    const handlePayment = async (event) => {
        event.preventDefault();
        if (email.length > 0 && emailRegex.test(email) && value !== undefined) {
            setEmptyValue(false);
            setEmptyEmail(false);
            if (email.length > 0 && emailRegex.test(email) && value !== undefined) {
                setEmptyValue(false);
                setEmptyEmail(false);
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
                        window.open(data.redirectUrl, '_blank')?.focus();
                    } else {
                        throw new Error('Invalid response data');
                    }
                } catch (error) {
                    console.error('Error:', error);
                } finally {
                    setValue("");
                    setEmail("");
                    setLoading(false);
                }
            } else {
                setEmptyValue(value === undefined);
                setEmptyEmail(!(email.length > 0));
            }
        };
    }

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
                    error={emptyValue}
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
                    error={emailError || emptyEmail}
                    helperText={emailError ? "Nieprawidłowy adres e-mail" : ""}
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