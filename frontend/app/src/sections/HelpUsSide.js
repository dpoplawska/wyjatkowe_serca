import { CircularProgress, TextField } from "@mui/material"
import React, { useEffect, useState } from "react"
import "./css/Sides.css"

export default function HelpUsSide() {
    const [value, setValue] = useState("");
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [valueError, setValueError] = useState(false);
    const [emptyValue, setEmptyValue] = useState(false);
    const [emptyEmail, setEmptyEmail] = useState(false);
    const [loading, setLoading] = useState(false);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valueRegex = /^[0-9]*$/;
    const wrongRegex = /[\.,]/;

    const handleValueChange = (event) => {
        setEmptyValue(false);
        let value = event.target.value;
        if (wrongRegex.test(value)) {
            value.replace(".", "")
            value.replace(",", "")
        }
        if (valueRegex.test(value)) {
            setValueError(false)
            setValue(value)
        } else {
            setValueError(true)
        }

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
            setLoading(true);

            if (email.length > 0 && emailRegex.test(email) && value !== undefined) {
                setEmptyValue(false);
                setEmptyEmail(false);

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
                        setTimeout(() => {
                            window.open(data.redirectUrl, '_blank');
                        })
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

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handlePayment(event);
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
                    onKeyDown={handleKeyPress}
                    error={emptyValue || valueError}
                    helperText={valueError ? "Wartość musi być liczbą całkowitą" : ""}
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
                    onKeyDown={handleKeyPress}
                    type="email"
                    error={emailError || emptyEmail}
                    helperText={emailError ? "Nieprawidłowy adres e-mail" : ""}
                />
            </div>
            <div className="button-container">
                {loading ? (
                    <button
                        type="submit"
                        onClick={handlePayment}
                    ><i className="fa fa-circle-o-notch fa-1x fa-spin" aria-hidden="true"></i></button>
                ) : (
                    <button
                        type="submit"
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