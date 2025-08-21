import React, { useEffect, useState } from "react";
import "./css/Main.css";
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import { Checkbox, Input } from "@mui/material";
import privacyPolicy from "../media/Polityka_prywatnosci.pdf";
import serviceRegulations from "../media/Regulamin_serwisu_FWS.pdf";
import MedibeltInfo from "./components/MedibeltInfo.tsx";
import { InpostGeowidgetReact } from "inpost-geowidget-react";
import useSidePositionAdjustment from "./hooks/useSidePositionAdjustment";

// Define interfaces
interface Paczkomat {
  name: string;
  address: {
    line1: string;
    line2: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

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
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [selectedPaczkomat, setSelectedPaczkomat] = useState<Paczkomat | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'paczkomat' | 'kurier'>('kurier');
  const [address, setAddress] = useState<string>("");
    const [houseNumber, setHouseNumber] = useState<string>("");
      const [flatNumber, setFlatNumber] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [acceptTermsAndConditionsCheckbox, setAcceptTermsAndConditionsCheckbox] = useState(false);
  const productPrice = 239;
  const shippingCost = deliveryMethod === 'paczkomat' ? 18.99 : 21;
  const totalCost = (productPrice * quantity) + shippingCost;
    const zipCodeRegex = /^[0-9]{2}-[0-9]{3}$/;
    const [zipCodeError, setZipCodeError] = useState<boolean>(false);
  const handleAcceptTermsAndConditions = () => {
    setAcceptTermsAndConditionsCheckbox(!acceptTermsAndConditionsCheckbox);
    };
    
    // const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    //     if (zipCodeRegex.test(e.target.value))  {
    //         setZipCode(e.target.value)
    //         setZipCodeError(false)
    //     } else {
    //         setZipCode("")
    //         setZipCodeError(true)
    //     }
    //  }

  useEffect(() => {
    const requiredFieldsFilled =
      name &&
    //   surname &&
          acceptTermsAndConditionsCheckbox
      && email && phone && address
        // &&
    //   (deliveryMethod === 'paczkomat' ? selectedPaczkomat : street && houseNumber && zipCode && city);
    setDisabled(!requiredFieldsFilled);
  }, [name, phone, deliveryMethod, address, acceptTermsAndConditionsCheckbox]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setQuantity(value);
  };

     const handleSubmit = async (event) => {
        event.preventDefault();
        // if (email.length > 0 && emailRegex.test(email) && value !== undefined && acceptTermsAndConditionsCheckbox) {
            // setEmptyValue(false);
            // setEmptyEmail(false);
            // setLoading(true);
            // setResetButton(true);
            // setAcceptTermsAndConditionsCheckbox(false);

          const paymentData = {
                amount: totalCost.toFixed(0),
              email: email,
              name: name,
              phone: phone,
             address: address,
              paczkomat: false,
              paczkomat_id: null,
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
            } finally {
                // setName("");
                // setSurname("");
                // setQuantity(1);
                // setSelectedPaczkomat(null);
                // setStreet("");
                // setHouseNumber("");
                // setFlatNumber("");
                // setZipCode("");
                // setCity("");
                // setErrorMessage("");
                // setAcceptTermsAndConditionsCheckbox(false);
            }
        // } else {
            // setResetButton(true);
            // setEmptyValue(value === undefined);
            // setEmptyEmail(!(email.length > 0));
        // }
    };


  const topFunction = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  const handlePaczkomatSelect = (paczkomat: any) => {
    if (paczkomat) {
      setSelectedPaczkomat({
        name: paczkomat.name,
        address: {
          line1: paczkomat.address_details.street,
          line2: `${paczkomat.address_details.post_code} ${paczkomat.address_details.city}`,
        },
        location: {
          latitude: paczkomat.location.latitude,
          longitude: paczkomat.location.longitude,
        },
      });
      setErrorMessage("");
    } else {
      setSelectedPaczkomat(null);
      setErrorMessage("Proszę wybrać Paczkomat.");
    }
  };

  return (
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

      <div
        className="col-xs-12 col-lg-7"
        id="shop-content"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: "20px",
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
              style={{ width: "60px", marginLeft: "10px" }}
            />
          </div>

          <div className="delivery-method" style={{ margin: "20px 0" }}>
            <label>Metoda dostawy: </label>
            {/* <div>
              <input
                type="radio"
                id="paczkomat"
                value="paczkomat"
                checked={deliveryMethod === 'paczkomat'}
                onChange={() => setDeliveryMethod('paczkomat')}
              />
              <label htmlFor="paczkomat">Paczkomat - 19.99 zł</label>
            </div> */}
            <div>
              <input
                type="radio"
                id="kurier"
                value="kurier"
                checked={deliveryMethod === 'kurier'}
                onChange={() => setDeliveryMethod('kurier')}
              />
              <label htmlFor="kurier">Kurier - {shippingCost} zł</label>
            </div>
          </div>

          {/* {deliveryMethod === 'paczkomat' && (
            <div className="paczkomat-selector" style={{ margin: "20px 0", width: "100%" }}>
              <label htmlFor="paczkomat">Wybierz Paczkomat: </label>
              <InpostGeowidgetReact
                token={token} 
                language="pl"
                onPointSelect={handlePaczkomatSelect}
                style={{ height: "400px", width: "100%", marginTop: "10px" }}
              />
              {errorMessage && (
                <p style={{ color: "red", margin: "10px 0" }}>{errorMessage}</p>
              )}
              {selectedPaczkomat && (
                <p>
                  Wybrany Paczkomat: {selectedPaczkomat.name}, {selectedPaczkomat.address.line1}, {selectedPaczkomat.address.line2}
                </p>
              )}
            </div>
          )} */}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              maxWidth: "300px",
              width: "100%",
              margin: "0 auto",
              alignItems: "center",
            }}
                  >
            <div>
              <label htmlFor="email">Adres e-mail: </label>
              <Input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "8px" }}
              />
                      </div>
                         <div>
              <label htmlFor="email">Numer telefonu: </label>
              <Input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <div>
              <label htmlFor="name">Imię i nazwisko:</label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            {/* <div>
              <label htmlFor="surname">Nazwisko: </label>
              <Input
                type="text"
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                style={{ width: "100%", padding: "8px" }}
              />
            </div> */}
            {deliveryMethod === 'kurier' && (
              <>
                <div>
                  <label htmlFor="address">Adres wysyłki: </label>
                  <Input
                    type="text"
                    id="address"
                                      value={address}
                                      multiline
                    placeholder="Ulica, numer domu, mieszkania (jeżeli dotyczy), kod pocztowy, miasto"
                
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
              </>
            )}
            <p>Całkowity koszt: {totalCost} zł</p>
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
                  <a href={serviceRegulations} style={{ color: "#EC1A3B" }} target="_blank" rel="noopener noreferrer" className="service-regualtions-link">
                    {" "}regulamin serwisu{" "}
                  </a>
                </span>
                <span>
                  i
                  <a href={privacyPolicy} style={{ color: "#EC1A3B" }} target="_blank" rel="noopener noreferrer" className="privacy-policy-link">
                    {" "}politykę prywatności
                  </a>. *
                </span>
              </span>
            </span>
            <button type="submit" id="buttonSubmit" disabled={disabled}>
              Kupuję🤍
            </button>
          </form>

          {/* {formSubmitted && (
            <p style={{ color: "green", marginTop: "15px" }}>
              Thank you, {name}, for your order of {quantity} item(s)! Total: {totalCost.toFixed(2)} zł
              {deliveryMethod === 'paczkomat' && selectedPaczkomat && (
                <>
                  {" "}
                  Delivery to: {selectedPaczkomat.name}, {selectedPaczkomat.address.line1}, {selectedPaczkomat.address.line2}
                </>
              )}
              {deliveryMethod === 'kurier' && (
                <>
                  {" "}
                  Delivery by kurier to: {street} {houseNumber}, {zipCode} {city}
                </>
              )}
            </p>
          )} */}
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
  );
}