import React from "react"
import "../sections/css/InfoContent.css"
import zdjecie from "../media/zdjecie_zespolu_z_lekarzami.jpg"


export default function GetToKnowUs() {
    return (
        <div className="container getToKnowUs">
            <h1 className="header">Poznaj Nas</h1>
            <h2 className="sub-highlight">Fundacja <span className="highlight">Wyjątkowe Serca</span> powstała z potrzeby serca.</h2>

            <p className="content">
                Fundację tworzą rodzice dzieci z wrodzonymi wadami serca (WWS) - stąd nasze indywidualne podejście do wszystkich podopiecznych oraz zaangażowanie w walkę o życie chorych dzieci,
                powrót do zdrowia, a także wsparcie rodziców w trudnych chwilach.
            </p>

            <p className="content">
                Otaczamy opieką i troską dzieci z WWS, a także pomagamy rodzicom spodziewających się dziecka z wrodzonymi wadami serca – począwszy od diagnozy, poprzez cały proces leczenia i rehabilitację.
                Wspieramy w trudach dnia codziennego, podpowiadając rozwiązania, które pomogły nam oraz innym rodzicom, lub które mogłyby nam pomóc gdybyśmy je wcześniej znali.
            </p>

            <p className="content">
                Chcemy również pokazać z czym każdego dnia mierzą się rodzice dzieci w WWS, że robimy wszystko, co w naszej mocy, aby zapewnić naszym pociechom najlepsze warunki do rozwoju i życia. Naszą wizją i marzeniem jest świat, w którym wszystkie dzieci mają szansę żyć zdrowo i szczęśliwie – a rodzice nie są sami.
            </p>

            <img id="team-pic" src={zdjecie} alt={"Zespół Fundacji Wyjątkowe Serca wraz z lekarzami"} />
            <p className="photo-caption">
                Nasz Zespół (od lewej):<br />
                Dr n. med. Michał Buczyński - Członek Rady Naukowej Fundacji,<br />
                Dr hab. n. med. Przemysław Kosiński - Członek Rady Naukowej Fundacji,<br />
                Radosław Zawadzki - Członek Rady Fundacji,<br />
                Patryk Perlejewski - Członek Rady Fundacji,<br />
                lek. Karolina Szymczak - Członkini Rady Naukowej Fundacji,<br />
                Marta Zawadzka - Prezes Zarządu,<br />
                Małgorzata Pietranis - Członkini Rady Fundacji,<br />
                Joanna Suchodolska - Członkini Rady Fundacji
            </p>

        </div>
    )
}