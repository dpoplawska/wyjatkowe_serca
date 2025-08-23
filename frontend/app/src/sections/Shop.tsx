import React, { useEffect, useState } from "react";
import "./css/Main.css";
import HelpUsSide from "./HelpUsSide.tsx";
import SocialsSide from "./SocialsSide.tsx";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import { Checkbox, TextField } from "@mui/material";
import privacyPolicy from "../media/Polityka_prywatnosci.pdf";
import serviceRegulations from "../media/Regulamin_serwisu_FWS.pdf";
import MedibeltInfo from "./components/MedibeltInfo.tsx";
import useSidePositionAdjustment from "./hooks/useSidePositionAdjustment.tsx";

interface SidePosition {
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  top: number;
  buttonBottom: number;
}

export default function Shop() {
  const { isSmallScreen, isMediumScreen, top, buttonBottom } = useSidePositionAdjustment() as SidePosition;
  const [quantity, setQuantity] = useState<number>(1);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [disabled, setDisabled] = useState<boolean>(true);
  const [selectedPaczkomat, setSelectedPaczkomat] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<'paczkomat' | 'kurier'>('kurier');
  const [address, setAddress] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [emailError, setEmailError] = useState(false);
  const [emptyEmail, setEmptyEmail] = useState(false);
  const [acceptTermsAndConditionsCheckbox, setAcceptTermsAndConditionsCheckbox] = useState(false);
  const productPrice = 239;
  const paczkomatCost = 19;
  const kurierCost = 21;
  const shippingCost = deliveryMethod === 'paczkomat' ? paczkomatCost : kurierCost;
  const totalCost = (productPrice * quantity) + shippingCost;
  const [zipCodeError, setZipCodeError] = useState<boolean>(false);
  const [currentLimit, setCurrentLimit] = useState<number>(0);

  const handleAcceptTermsAndConditions = () => {
    setAcceptTermsAndConditionsCheckbox(!acceptTermsAndConditionsCheckbox);
  };

  const handleZipCodeChange = (e) => {
    let value = e.target.value.replace(/[^0-9-]/g, '');
    if (value.length > 2 && value.indexOf('-') === -1) {
      value = value.slice(0, 2) + '-' + value.slice(2);
    }
    value = value.slice(0, 6);
    setZipCode(value);
  };

  const handleEmailChange = (event) => {
    setEmailError(false);
    setEmptyEmail(false);
    setEmail(event.target.value);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseInt(e.target.value);
    const value = isNaN(parsedValue) ? parsedValue : Math.min(parsedValue, currentLimit);
    setQuantity(value);
  };

  useEffect(() => {
    const requiredFieldsFilled =
      name &&
      acceptTermsAndConditionsCheckbox &&
      email &&
      phone &&
      quantity &&
      (deliveryMethod === 'paczkomat' ? selectedPaczkomat : deliveryMethod === 'kurier' ? (address && zipCode && city) : false);
    setDisabled(!requiredFieldsFilled);
  }, [name, phone, deliveryMethod, zipCode, city, address, acceptTermsAndConditionsCheckbox, quantity, selectedPaczkomat, email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const zipPattern = /^\d{2}-\d{3}$/;
    if (!zipPattern.test(zipCode) && deliveryMethod === 'kurier') {
      setZipCodeError(true);
      alert('Nieprawidłowy kod pocztowy: ' + zipCode);
      return;
    } else {
      setZipCodeError(false);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      setEmailError(false);
      setEmptyEmail(false);
    } else if (email.length < 1) {
      setEmptyEmail(true);
    } else {
      setEmailError(true);
    }

    const paymentData = {
      amount: totalCost.toFixed(0),
      email: email,
      name: name,
      phone: phone,
      units: quantity,
      address: `${address}, ${zipCode} ${city}`,
      paczkomat: deliveryMethod === 'paczkomat',
      paczkomat_id: deliveryMethod === 'paczkomat' ? selectedPaczkomat : null,
    };

    try {
      const response = await fetch(
        "https://wyjatkowe-serca-f74jtttkrq-lm.a.run.app/purchases",
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

      if (data.purchaseId) {
        setTimeout(() => {
          window.open(data.redirectUrl, "_blank");
        });
      } else {
        throw new Error("Invalid response data");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

    const getCurrentLimit = async () => {
        try {
            const response = fetch(
                "https://wyjatkowe-serca-38835307240.europe-central2.run.app/purchases/left"
            )
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                  }
                  console.log(response)
                    return response.json();
                })
                .then((data) => {
                    setCurrentLimit(data.items_left);
                })
                .catch((error) => {
                    console.error("There was a problem with the fetch operation:", error);
                });
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
      getCurrentLimit();
  }, []);

  
  const topFunction = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  const textFieldStyles = {
    width: "100%",
    "& .MuiInputBase-input": {
      textAlign: "center",
    },
  };

  return (
    <>
    <section className="main">
      <div className="col-xs-12 col-lg-2" id="left-side">
        {isMediumScreen ? (
          <div className="position-fixed" style={{ top: `${top}%` }}>
            <HelpUsSide showFundraiserBar={true} specialFundraiser={false} />
          </div>
        ) : (
          <HelpUsSide showFundraiserBar={true} specialFundraiser={false} />
        )}
      </div>
        {currentLimit === 0 ? (
           <div
        className="col-xs-12 col-lg-7"
        id="shop-content"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "30vh",
          }}
        >
            <h2 className="highlight">Ratujki się skończyły!</h2>
          </div>
          ) : (
      <div
        className="col-xs-12 col-lg-7"
        id="shop-content"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
        >
            <div className="product-info" style={{ textAlign: "center", maxWidth: "500px" }}>
              <MedibeltInfo productPrice={productPrice} />
              <div className="quantity-selector" style={{ margin: "20px 0" }}>
                <label htmlFor="quantity">Ilość: </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={currentLimit}
                  style={{ width: "60px", marginLeft: "10px" }}
                />
                { } /  {currentLimit}
              </div>
              <div className="delivery-method" style={{ margin: "10px 0" }}>
                <label style={{ padding: "5px" }}>Metoda dostawy: </label>
                <div>
                  <input
                    type="radio"
                    id="paczkomat"
                    value="paczkomat"
                    checked={deliveryMethod === 'paczkomat'}
                    onChange={() => setDeliveryMethod('paczkomat')}
                  />
                  <label htmlFor="paczkomat" style={{ marginLeft: "5px" }}>
                    Paczkomat - {paczkomatCost} zł
                  </label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="kurier"
                    value="kurier"
                    checked={deliveryMethod === 'kurier'}
                    onChange={() => setDeliveryMethod('kurier')}
                  />
                  <label htmlFor="kurier" style={{ marginLeft: "5px" }}>
                    Kurier - {kurierCost} zł
                  </label>
                </div>
              </div>
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  width: "100%",
                  margin: "0 auto",
                  alignItems: "center",
                }}
              >
                <div style={{ width: "100%", maxWidth: "400px" }}>
                  <TextField
                    variant="standard"
                    type="text"
                    id="name"
                    label="Imię i nazwisko"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    sx={textFieldStyles}
                    fullWidth
                  />
                </div>
                <div style={{ width: "100%", maxWidth: "400px" }}>
                  <TextField
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    variant="standard"
                    label="Adres e-mail"
                    error={emailError || emptyEmail}
                    helperText={
                      emptyEmail ? "Pole e-mail jest wymagane" :
                        emailError ? "Proszę wprowadzić poprawny adres e-mail" : ""
                    }
                    sx={textFieldStyles}
                    fullWidth
                  />
                </div>
                <div style={{ width: "100%", maxWidth: "400px" }}>
                  <TextField
                    variant="standard"
                    type="text"
                    id="phone"
                    label="Numer telefonu"
                    value={phone}
                    onChange={(e) => {
                      const input = e.target.value.replace(/\D/g, '');
                      const limitedInput = input.slice(0, 9);
                      let formatted = '';
                      if (limitedInput.length > 0) {
                        formatted = limitedInput.match(/.{1,3}/g).join(' ');
                        if (limitedInput.length > 6) {
                          formatted = limitedInput.match(/.{1,3}/g).join(' ');
                        }
                      }
                      setPhone(formatted);
                    }}
                    required
                    sx={textFieldStyles}
                    fullWidth
                  />
                </div>
                  {deliveryMethod === 'paczkomat' && (
                    <>
                      <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noopener noreferrer" style={{ color: "#2383C5", marginBottom: "-10px", textDecoration: "none" }}>Znajdź swój Paczkomat</a>
                      <div style={{ width: "100%", maxWidth: "400px" }}>
                        <TextField
                          variant="standard"
                          type="text"
                          id="paczkomat-code"
                          label="Numer paczkomatu"
                          value={selectedPaczkomat}
                          onChange={(e) => setSelectedPaczkomat(e.target.value)}
                          required
                          sx={textFieldStyles}
                          fullWidth
                        />
                      </div>
                      </>
                )}
                {deliveryMethod === 'kurier' && (
                  <>
                    <div style={{ width: "100%", maxWidth: "400px" }}>
                      <TextField
                        variant="standard"
                        id="address"
                        value={address}
                        multiline
                        label="Adres"
                        helperText="Ulica, nr domu, nr mieszkania (jeżeli dotyczy)"
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        sx={textFieldStyles}
                        fullWidth
                      />
                    </div>
                    <div style={{ width: "100%", maxWidth: "400px" }}>
                      <TextField
                        id="zipCode"
                        variant="standard"
                        value={zipCode}
                        label="Kod pocztowy"
                        onChange={handleZipCodeChange}
                        required
                        helperText={zipCodeError ? "Proszę wprowadzić poprawny kod pocztowy w formacie 00-000" : ""}
                        error={zipCodeError}
                        sx={textFieldStyles}
                        fullWidth
                      />
                    </div>
                    <div style={{ width: "100%", maxWidth: "400px" }}>
                      <TextField
                        type="text"
                        id="city"
                        variant="standard"
                        value={city}
                        multiline
                        label="Miasto"
                        onChange={(e) => setCity(e.target.value)}
                        required
                        sx={textFieldStyles}
                        fullWidth
                      />
                    </div>
                  </>
                )}
                <span className="content" style={{ fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Checkbox
                    size="small"
                    required
                    sx={{ color: "#2383C5", marginRight: "5px", marginLeft: "-20px" }}
                    checked={acceptTermsAndConditionsCheckbox}
                    onClick={handleAcceptTermsAndConditions}
                  />
                  <span style={{ display: "flex", flexDirection: "column", marginLeft: "0px" }}>
                    <span>
                      Akceptuję
                      <a href={serviceRegulations} style={{ color: "#EC1A3B", textDecoration: "none" }} target="_blank" rel="noopener noreferrer" className="service-regulations-link">
                          {" "}regulamin serwisu <span style={{ color: "#616161"}}>i</span>
                          <a href={privacyPolicy} style={{ color: "#EC1A3B", textDecoration: "none" }} target="_blank" rel="noopener noreferrer" className="privacy-policy-link">
                        {" "}politykę prywatności
                      </a>. *
                      </a>
                    </span>
                  </span>
                </span>
                <p>Całkowity koszt: <b>{totalCost} zł</b></p>
                <button type="submit" id="buttonSubmit" disabled={disabled}>
                  Kupuję🤍
                </button>
              </form>
            </div>
        <button
          onClick={topFunction}
          id="topButton"
          title="Do góry"
          style={{ bottom: `${buttonBottom}px`, position: "fixed" }}
        >
          <KeyboardArrowUp />
        </button>
      </div>
          )}

      <div className="col-xs-12 col-lg-2" id="right-side">
        {isMediumScreen ? (
          <div className="position-fixed" style={{ top: `${top}%` }}>
            <SocialsSide />
          </div>
        ) : (
          <SocialsSide />
        )}
      </div>
          </section>
      </>
  );
}