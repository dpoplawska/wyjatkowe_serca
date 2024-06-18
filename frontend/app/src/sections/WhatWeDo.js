import React from "react"
import "../sections/css/InfoContent.css"
import zdjecie from "../media/zdjecie_zespolu.jpg"

export default function WhatWeDo() {
    return (
        <div id="container" className="whatWeDo">
            <h1 className="header">Co robimy?</h1>
            <h2 className="sub-highlight">Pomagamy <span className="highlight">#WyjątkowymSerduszkom</span> oraz ich najbliższym</h2>

            <p className="content">
                Jesteśmy dla Was i Waszych dzieci. Chcemy być nie tylko wsparciem, ale również przyjaciółmi, którzy zawsze znajdą czas aby Was wysłuchać oraz dodać otuchy. Chcemy być pluszowym misiem z logo, do którego można się „przytulić”, powierzyć wszystkie troski, zmartwienia oraz łzy – nie tylko smutku i bezsilności, ale również te radości i szczęścia.
            </p>

            <div className="section">
                <h3 className="section-title">Dzieci</h3>
                <p className="content">
                    Pomagamy <span className="highlight">#WyjątkowymSerduszkom</span> bić jak najdłużej, a dzieciom z niepełnosprawnością cieszyć się pełnią życia. Odczarowujemy szpitalną rzeczywistość. Choroba sprawia, że dzieci przebywają w szpitalu przez kilka tygodni, a nawet miesięcy, dlatego nasza Fundacja stara się skierować ich uwagę na rzeczy wesołe i przyjemne poprzez organizowanie wydarzeń charytatywnych. Pomagamy także w zbiórkach pieniędzy na leczenie oraz rehabilitację.
                </p>
            </div>

            <div className="section">
                <h3 className="section-title">Rodzice</h3>
                <p className="content">
                    Jesteśmy, aby pomóc Wam w nowym, niełatwym, ale mimo wszystko wyjątkowym życiu. Wiemy, czym jest strach, niepewność, lęk i bezradność. My również doświadczyliśmy choroby i straty. Ale wiemy też jak działać – jak oswoić chorobę, która ma wpływ na całą rodzinę. Bezpieczna i silna rodzina jest w stanie przejść przez najtrudniejsze.
                </p>
            </div>

            <img id="team-pic" src={zdjecie} alt={"Zespół Fundacji Wyjątkowe Serca"} />

            <div className="section">
                <h3 className="section-title">Pomoc psychologiczna</h3>
                <p className="content">
                    Zapewniamy bezpłatne wsparcie psychologiczne dla dzieci z WWS, dzieci z niepełnosprawnością oraz ich najbliższych. Diagnoza wady serca u naszych upragnionych oraz wyczekiwanych dzieci jest druzgocąca. Wiemy jak trudno odnaleźć się w nowej, niespodziewanej sytuacji. Targają nami różne emocje i myśli, a pogodzenie się z tym, co przyniósł nam los nie jest łatwe, wymaga wsparcia, czasu a nawet fachowej pomocy.
                    Nasza Fundacja jest właśnie dla Was!
                </p>
            </div>
        </div>
    )
}