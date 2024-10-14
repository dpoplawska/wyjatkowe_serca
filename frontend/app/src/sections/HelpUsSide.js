import { CircularProgress, TextField } from "@mui/material"
import React, { useEffect, useState } from "react"
import "./css/Sides.css"
import ValueButton from "./components/ValueButton";
import { useLocation } from "react-router-dom";

export default function HelpUsSide({ showFundraiserBar }) {
    const location = useLocation();
    const defaultValue = "50";
    const [value, setValue] = useState(defaultValue);
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [valueError, setValueError] = useState(false);
    const [emptyValue, setEmptyValue] = useState(false);
    const [emptyEmail, setEmptyEmail] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetButton, setResetButton] = useState(false);
    const [anotherButtonClicked, setAnotherButtonClicked] = useState(false);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valueRegex = /^[0-9]*$/;
    const [currentValue, setCurrentValue] = useState(-1);
    const percentage = (currentValue / 5000) * 100;
    const fundraiserGoal = "5 000";
    const [showValueTextField, setShowValueTextField] = useState(false);
    const [showKnowMoreAboutFundraiser, setShowKnowMoreAboutFundraiser] = useState(true);

    const monthMap = {
        "01": "W styczniu",
        "02": "W lutym",
        "03": "W marcu",
        "04": "W kwietniu",
        "05": "W maju",
        "06": "W czerwcu",
        "07": "W lipcu",
        "08": "W sierpniu",
        "09": "We wrześniu",
        "10": "W październiku",
        "11": "W listopadzie",
        "12": "W grudniu"
    };
    const date = new Date();
    const currentMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const monthString = monthMap[currentMonth];

    const handleValueChange = (event) => {
        setEmptyValue(false);
        let value = event.target.value;
        value = value.replace(".", "").replace(",", "");
        if (valueRegex.test(value)) {
            setValueError(false);
            setValue(value);
        } else {
            setValueError(true);
        }
    };

    const handleEmailChange = (event) => {
        setEmailError(false);
        setEmptyEmail(false);
        setEmail(event.target.value);
        if (emailRegex.test(event.target.value)) {
            setEmailError(false);
            setEmptyEmail(false);
        } else if (event.target.value.length < 1) {
            setEmptyEmail(true);
        } else {
            setEmailError(true);
        }
    };

    const handleSetValue = (value) => {
        setValue(value);
        setShowValueTextField(false);
        setAnotherButtonClicked(false);
        setResetButton(true);
    };

    const handleAnotherValue = () => {
        setShowValueTextField(true);
        setAnotherButtonClicked(true);
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            handlePayment(event);
        }
    };

    const handlePayment = async (event) => {
        event.preventDefault();
        if (email.length > 0 && emailRegex.test(email) && value !== undefined) {
            setEmptyValue(false);
            setEmptyEmail(false);
            setLoading(true);
            setResetButton(true);

            const paymentData = {
                amount: value,
                email: email,
            };

            try {
                const response = await fetch(
                    "https://wyjatkowe-serca-f74jtttkrq-lm.a.run.app/payments",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(paymentData),
                    }
                );

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                const data = await response.json();

                if (data.paymentId) {
                    setTimeout(() => {
                        window.open(data.redirectUrl, "_blank");
                    });
                } else {
                    throw new Error("Invalid response data");
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setValue(defaultValue);
                setEmail("");
                setLoading(false);
            }
        } else {
            setResetButton(true);
            setEmptyValue(value === undefined);
            setEmptyEmail(!(email.length > 0));
        }
    };


    const getCurrentFundraisedValue = async () => {
        try {
            const response = fetch(
                "https://wyjatkowe-serca-38835307240.europe-central2.run.app/payments/total-confirmed"
            )
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then((data) => {
                    setCurrentValue(data.total);
                })
                .catch((error) => {
                    console.error("There was a problem with the fetch operation:", error);
                });
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        getCurrentFundraisedValue();
    }, []);

    useEffect(() => {
        if (location.pathname !== '/') {
            setShowKnowMoreAboutFundraiser(false);
        }
    }, [])

    return (
        <section className="help-us side">
            <div className="supportUs">Wesprzyj Nas</div>
            <div className="btn-group" style={{ display: "flex", gap: "5px" }}>
                <ValueButton setValue={handleSetValue} value={200} isActive={value == "200"} resetButton={resetButton} />
                <ValueButton setValue={handleSetValue} value={150} isActive={value == "150"} resetButton={resetButton} />
                <ValueButton setValue={handleSetValue} value={100} isActive={value == "100"} resetButton={resetButton} />
            </div>
            <div className="btn-group" style={{ display: "flex", gap: "5px" }}>
                <ValueButton setValue={handleSetValue} value={50} isActive={value == "50"} resetButton={resetButton} />
                <ValueButton setValue={handleSetValue} value={20} isActive={value == "20"} resetButton={resetButton} />
                <ValueButton
                    handleAnotherValue={handleAnotherValue}
                    anotherButtonClicked={anotherButtonClicked}
                    resetButton={resetButton}
                    isAnotherButton={true}
                />
            </div>
            {showValueTextField && (
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
            )}
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
                    <button type="submit" onClick={handlePayment}>
                        <i className="fa fa-circle-o-notch fa-1x fa-spin" aria-hidden="true"></i>
                    </button>
                ) : (
                    <button type="submit" onClick={handlePayment} style={{ cursor: "pointer" }}>
                        Wesprzyj🤍
                    </button>
                )}
                {currentValue !== -1 && (
                    <div style={{ marginTop: "20px" }}>
                        <div className="progress">
                            <div
                                className="progress-bar progress-bar-striped bg-danger progress-bar-animated"
                                role="progressbar"
                                style={{ width: `${percentage}%` }}
                                aria-valuenow={percentage}
                                aria-valuemin="0"
                                aria-valuemax="100"
                            />
                        </div>
                        <div style={{ display: "grid", margin: "5px" }}>
                            <p style={{ marginBottom: "-3px" }}>{monthString} zebraliśmy </p>
                            <p>{currentValue} zł z {fundraiserGoal} zł</p>
                        </div>

                    </div>
                )}
                {showKnowMoreAboutFundraiser &&
                    <a href="/zbiorka/fundacja" className="aboutFundraiser">
                        <p className="content" id="knowMoreAboutFundraiser">
                            Dowiedz się więcej o zbiórce
                        </p>
                    </a>
                }
            </div>
        </section>
    );
}
