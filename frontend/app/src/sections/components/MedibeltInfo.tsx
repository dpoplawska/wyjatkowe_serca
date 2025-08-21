import { useState } from "react";
import product1 from "../../media/nerka/1.png";
import product2 from "../../media/nerka/2.png";
import product3 from "../../media/nerka/3.png";
import product4 from "../../media/nerka/4.png";
import product5 from "../../media/nerka/5.png";
import product6 from "../../media/nerka/6.png";
import Carousel from "react-bootstrap/esm/Carousel";

type MediBeltProps = {
    productPrice: number;
};

const MediBelt = ({productPrice}: MediBeltProps) => {
    const [index, setIndex] = useState < number > (0);

    const handleSelect = (selectedIndex: number) => {
        setIndex(selectedIndex);
    };

    return (<>
        <h2 style={{ display: "flex", justifyContent: "center" }} className="sub-highlight">
            Medibelt - Ratujka
        </h2>
        <Carousel activeIndex={index} onSelect={handleSelect}>
            <Carousel.Item>
                <img className="d-block w-100" src={product1} alt="Product 1" />
            </Carousel.Item>
            <Carousel.Item>
                <img className="d-block w-100" src={product2} alt="Product 2" />
            </Carousel.Item>
            <Carousel.Item>
                <img className="d-block w-100" src={product3} alt="Product 3" />
            </Carousel.Item>
            <Carousel.Item>
                <img className="d-block w-100" src={product4} alt="Product 4" />
            </Carousel.Item>
            <Carousel.Item>
                <img className="d-block w-100" src={product5} alt="Product 5" />
            </Carousel.Item>
            <Carousel.Item>
                <img className="d-block w-100" src={product6} alt="Product 6" />
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
        <p style={{ fontWeight: "bold", marginTop: "15px" }}>Cena: <b>{productPrice}zł</b></p>

    </>)
}

export default MediBelt;