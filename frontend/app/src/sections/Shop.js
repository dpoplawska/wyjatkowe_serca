import React, { useEffect, useState } from "react";
import "./css/Main.css";
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import useSidePositionAdjustment from "./hooks/useSidePositionAdjustment";
import product1 from "../media/nerka/1.png";
import product2 from "../media/nerka/2.png";
import product3 from "../media/nerka/3.png";
import product4 from "../media/nerka/4.png";
import product5 from "../media/nerka/5.png";
import product6 from "../media/nerka/6.png";
import { Carousel } from "react-bootstrap";


export default function Shop() {
    const { isSmallScreen, isMediumScreen, top, buttonBottom } = useSidePositionAdjustment();
    const [quantity, setQuantity] = useState(1);
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [disabled, setDisabled] = useState(false);

    function topFunction() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    const handleQuantityChange = (e) => {
        const value = Math.max(1, parseInt(e.target.value) || 1);
        setQuantity(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() && surname.trim()) {
            setFormSubmitted(true);
        }
    };

    const handlePayment = async (event) => {
        event.preventDefault();
        if (name.length > 0 && surname.length > 0 && quantity > 0) {
            try {
                // API call logic here
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setName("");
                setSurname("");
                setQuantity(1);
            }
        }
    };

    useEffect(() => {
        if (name.length === 0 || surname.length === 0) {
            setDisabled(true)
        } else {
            setDisabled(false)
        }
    }, [name, surname])
    const [index, setIndex] = useState(0);

    const handleSelect = (selectedIndex) => {
        setIndex(selectedIndex);
    };
    const [paczkomaty, setPaczkomaty] = useState([]);
    const [selectedPaczkomat, setSelectedPaczkomat] = useState("");



    return (
        <section className="main">
            <div className="col-xs-12 col-lg-2" id="left-side">
                {isMediumScreen ? (
                    <div className="position-fixed" style={{ top: top + '%' }}>
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
                    <h2 style={{ display: "flex", justifyContent: "center" }} className="sub-highlight">Medibelt - Ratujka</h2>
                    <Carousel activeIndex={index} onSelect={handleSelect}>
                        <Carousel.Item>
                            <img className="d-block w-100" src={product1} alt="First slide" />
                        </Carousel.Item>
                        <Carousel.Item>
                            <img className="d-block w-100" src={product2} alt="Second slide" />
                        </Carousel.Item>
                        <Carousel.Item>
                            <img className="d-block w-100" src={product3} alt="Third slide" />
                        </Carousel.Item>
                        <Carousel.Item>
                            <img className="d-block w-100" src={product4} alt="Fourth slide" />
                        </Carousel.Item>
                        <Carousel.Item>
                            <img className="d-block w-100" src={product5} alt="Fifth slide" />
                        </Carousel.Item>
                        <Carousel.Item>
                            <img className="d-block w-100" src={product6} alt="Sixth slide" />
                        </Carousel.Item>
                    </Carousel>
                    <p>
                        MediBelt lub potocznie <strong>Ratujka</strong> – to apteczka pierwszej pomocy w formie wygodnej nerki.
                        Bądź przygotowany na każdą przygodę – zarówno tę wesołą, jak i tę wymagającą szybkiej reakcji.
                        Dzięki formie praktycznej nerki nosisz ją wygodnie w pasie lub na biodrach, a jej ergonomiczny kształt
                        pozwala błyskawicznie sięgnąć po potrzebne akcesoria w kryzysowej chwili.
                    </p>

                    <p>
                        Świetnie sprawdzi się w domu, na placu zabaw, w podróży, na spacerze czy podczas aktywności na świeżym powietrzu –
                        wszędzie tam, gdzie liczy się czas i skuteczność.
                    </p>

                    <h3 style={{ marginTop: "20px" }}>Co znajdziesz w środku?</h3>
                    <ul style={{ textAlign: "left" }}>
                        <li>4 × plastry opatrunkowe „Safari”</li>
                        <li>1 × plaster wodoodporny</li>
                        <li>Bandaż dziany</li>
                        <li>6 × rękawiczki jednorazowe</li>
                        <li>Bezpieczne nożyczki ratownicze</li>
                        <li>1 × gaza opatrunkowa</li>
                        <li>Bandaż kohezyjny</li>
                        <li>Prontosan Spray – do czyszczenia i nawilżania ran</li>
                        <li>Prontosan Acute Żel – hydrożel przyspieszający gojenie, nawilżający i chłodzący</li>
                        <li>3 × kompresy jałowe</li>
                        <li>1 × EasyIce – suchy lód na stłuczenia</li>
                        <li>2 × sól fizjologiczna</li>
                        <li>1 × Codofix</li>
                        <li>3 × naklejki „Masz Supermoce” – by dodać otuchy małym bohaterom</li>
                        <li>Koc ratunkowy termoizolacyjny</li>
                    </ul>

                    <h3 style={{ marginTop: "20px" }}>Dlaczego warto mieć Ratujkę?</h3>
                    <ul style={{ textAlign: "left" }}>
                        <li>Szybki dostęp – wszystkie niezbędne elementy w jednym miejscu.</li>
                        <li>Mobilność – noś jak chcesz, zawsze pod ręką.</li>
                        <li>Bezpieczeństwo – starannie dobrane wyposażenie, także dla dzieci.</li>
                        <li>Wsparcie w stresujących sytuacjach – od drobnych skaleczeń po poważniejsze urazy.</li>
                    </ul>

                    <h3 style={{ marginTop: "20px" }}>Wskazówki bezpieczeństwa:</h3>
                    <ul style={{ textAlign: "left" }}>
                        <li>Regularnie sprawdzaj zawartość apteczki i uzupełniaj braki.</li>
                        <li>Przechowuj w suchym miejscu.</li>
                        <li>Wymieniaj zużyte lub przeterminowane materiały.</li>
                    </ul>

                    <p style={{ fontWeight: "bold", marginTop: "15px" }}>Cena: <b>29.99zł</b></p>

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
                            <label htmlFor="name">Imię: </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px" }}
                            />
                        </div>
                        <div>
                            <label htmlFor="surname">Nazwisko: </label>
                            <input
                                type="text"
                                id="surname"
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px" }}
                            />
                        </div>
                        {/* <div className="paczkomat-selector" style={{ margin: "20px 0" }}>
                            <label htmlFor="paczkomat">Wybierz Paczkomat: </label>
                            <select
                                id="paczkomat"
                                value={selectedPaczkomat}
                                onChange={(e) => setSelectedPaczkomat(e.target.value)}
                                style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                                required
                            >
                                <option value="">-- Wybierz Paczkomat --</option>

                                {paczkomaty.map((locker) => (
                                    <option key={locker.id} value={locker.id}>
                                        {locker.name} - {locker.city}, {locker.street}
                                    </option>
                                ))}
                            </select>
                        </div> */}

                        <button type="submit" id={"buttonSubmit"} onClick={handlePayment} disabled={disabled === true}>
                            Kupuję🤍
                        </button>
                    </form>

                    {formSubmitted && (
                        <p style={{ color: "green", marginTop: "15px" }}>
                            Thank you, {name} {surname}, for your order of {quantity} item(s)!
                        </p>
                    )}
                </div>

                <button
                    onClick={topFunction}
                    id="topButton"
                    title="Do góry"
                    style={{ bottom: buttonBottom + "px", position: "fixed" }}
                >
                    <KeyboardArrowUp />
                </button>
            </div>

            <div className="col-xs-12 col-lg-2" id="right-side">
                {isMediumScreen ? (
                    <div className="position-fixed" style={{ top: top + '%' }}>
                        <SocialsSide />
                    </div>
                ) : (
                    <SocialsSide />
                )}
            </div>
        </section >
    );
}
