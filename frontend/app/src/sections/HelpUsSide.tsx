import { TextField } from "@mui/material"
import { useEffect, useState } from "react"
import "./css/Sides.css"
import ValueButton from "./components/ValueButton.tsx";
import { useLocation } from "react-router-dom";
import { Checkbox } from "@mui/material";
import privacyPolicy from "../media/Polityka_prywatnosci.pdf"
import serviceRegulations from "../media/Regulamin_serwisu_FWS.pdf"

type HelpUsSideProps = {
    showFundraiserBar: boolean;
    specialFundraiser: boolean;
    beneficiary?: string;
}

export default function HelpUsSide({ showFundraiserBar, specialFundraiser, beneficiary }: HelpUsSideProps) {
    const location = useLocation();
    const defaultValue = "20";
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
    const percentage = (currentValue / 15000) * 100;
    const fundraiserGoal = "15 000";
    const [showValueTextField, setShowValueTextField] = useState(false);
    const [showKnowMoreAboutFundraiser, setShowKnowMoreAboutFundraiser] = useState(true);
    const [acceptTermsAndConditionsCheckbox, setAcceptTermsAndConditionsCheckbox] = useState(false);
    const [disabled, setDisabled] = useState(false);

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

    const handleAcceptTermsAndConditions = () => {
        setAcceptTermsAndConditionsCheckbox(!acceptTermsAndConditionsCheckbox)
    }

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
        if (email.length > 0 && emailRegex.test(email) && value !== undefined && acceptTermsAndConditionsCheckbox) {
            setEmptyValue(false);
            setEmptyEmail(false);
            setLoading(true);
            setResetButton(true);
            setAcceptTermsAndConditionsCheckbox(false);

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
                setAcceptTermsAndConditionsCheckbox(false);
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

    useEffect(() => {
        if (email.length === 0 || emailError === true || acceptTermsAndConditionsCheckbox === false) {
            setDisabled(true)
        } else {
            setDisabled(false)
        }
    }, [email, acceptTermsAndConditionsCheckbox])

    const [helpText, setHelpText] = useState("Wesprzyj Nas");
    useEffect(() => {
        if (specialFundraiser == true) {
            setHelpText("Wesprzyj")
        }
    }, []);

    const [transferTitle, setTransferTitle] = useState("");

    console.log(location.pathname);
    useEffect(() => {
        if (specialFundraiser === true) {
            switch (location.pathname) {
                case '/zbiorka/danuta_grzyb':
                    setHelpText("Wesprzyj Danusię");
                    setTransferTitle("WS1 - Danuta Grzyb");
                    break;
                case '/zbiorka/franciszek_grzyb':
                    setHelpText("Wesprzyj Franka");
                    setTransferTitle("WS2 - Franciszek Grzyb");
                    break;
                case '/zbiorka/cyprian_zawadzki':
                    setHelpText("Wesprzyj Cypriana");
                    setTransferTitle("WS3 - Cyprian Zawadzki");
                    break;
                case '/zbiorka/mikolaj_wegierski':
                    setHelpText("Wesprzyj Mikołaja");
                    setTransferTitle("WS4 - Mikołaj Węgierski");
                    break;
                case '/zbiorka/cecylia_suchocka':
                    setHelpText("Wesprzyj Cecylię");
                    setTransferTitle("WS5 - Cecylia Suchocka");
                    break;
                case '/zbiorka/hubert_szymborski':
                    setHelpText("Wesprzyj Huberta");
                    setTransferTitle("WS6 - Hubert Szymborski");
                    break;
                case '/zbiorka/nikodem_kochel':
                    setHelpText("Wesprzyj Nikodema");
                    setTransferTitle("WS7 - Nikodem Kochel");
                    break;
                case '/zbiorka/agnieszka_ptaszek':
                    setHelpText("Wesprzyj Agnieszkę");
                    setTransferTitle("WS8 - Agnieszka Ptaszek");
                    break;
                default:
                    setHelpText("Wesprzyj Nas");
            }
        }
    }, [location.pathname]);

    return (
        <section className="help-us side">
            {specialFundraiser === true ? (
                <div className="col-xs-12 col-lg-5" id="fundraiser-content" >

                    <p className="sub-highlight" >
                       {helpText}
                    </p>
                    <p className="content" style={{ fontSize: "16px" }}>Numer rachunku: </p>
                    <p className="content" style={{ fontSize: "14px", fontWeight: "bold" }}>IBAN PL40 1140 2004 0000 3502 8436 9739</p>
                    <p className="content" style={{ fontSize: "16px" }}>Tytuł przelewu:</p>
                    <p className="content" style={{ fontSize: "14px", fontWeight: "bold" }}>{transferTitle}</p>

                </div>
            ) :
                (
                    <>
                        <div className="supportUs">Wesprzyj Nas</div>
                        <div className="btn-group" style={{ display: "flex", gap: "5px" }}>
                            {["200", "150", "100"].map((btnValue) => (
                                <ValueButton
                                    key={btnValue}
                                    setValue={handleSetValue}
                                    value={btnValue}
                                    isActive={value === btnValue}
                                    resetButton={resetButton}
                                />
                            ))}
                        </div>
                        <div className="btn-group" style={{ display: "flex", gap: "5px" }}>
                            {["50", "20"].map((btnValue) => (
                                <ValueButton
                                    key={btnValue}
                                    setValue={handleSetValue}
                                    value={btnValue}
                                    isActive={value === btnValue}
                                    resetButton={resetButton}
                                />
                            ))}
                            <ValueButton handleAnotherValue={handleAnotherValue} anotherButtonClicked={anotherButtonClicked} resetButton={resetButton} isAnotherButton />
                        </div>
                        {showValueTextField && (
                            <div className="textfield-container">
                                <TextField
                                    aria-label="Pole tekstowe na kwotę wpłaty"
                                    required
                                    id="outlined"
                                    label="Kwota wpłaty (zł)"
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
                        <span className="content" style={{ fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Checkbox size="small" required sx={{ color: "#2383C5", marginRight: "5px", marginLeft: "-20px" }} checked={acceptTermsAndConditionsCheckbox} onClick={handleAcceptTermsAndConditions} />
                            <span style={{ display: "flex", flexDirection: "column", marginLeft: "0px" }}>
                                <span>Akceptuję
                                    <a href={serviceRegulations} style={{ color: "#EC1A3B" }} target="_blank" rel="noopener noreferrer" className="service-regualtions-link"> regulamin serwisu </a></span>
                                <span>i
                                    <a href={privacyPolicy} style={{ color: "#EC1A3B" }} target="_blank" rel="noopener noreferrer" className="privacy-policy-link"> politykę prywatności</a>. *</span>
                            </span>
                        </span>

                        <div className="button-container">
                            {loading ? (
                                <button type="submit" onClick={handlePayment}>
                                    <i className="fa fa-circle-o-notch fa-1x fa-spin" aria-hidden="true"></i>
                                </button>
                            ) : (
                                <button type="submit" id={"buttonSubmit"} onClick={handlePayment} disabled={disabled === true}>
                                    Wesprzyj🤍
                                </button>
                            )}
                            {showFundraiserBar && (
                                currentValue !== -1 && (
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
                                )
                            )}
                            {showKnowMoreAboutFundraiser &&
                                <a href="/zbiorka/fundacja" className="aboutFundraiser">
                                    <p className="content" id="knowMoreAboutFundraiser">
                                        Dowiedz się więcej o zbiórce
                                    </p>
                                </a>
                            }
                        </div>
                    </>)
            }

        </section >
    );
}
