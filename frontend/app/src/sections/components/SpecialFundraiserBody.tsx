import React, { useState, useEffect } from "react";
import photo from "../../media/hubert_szymborski.png"

const SpecialFundraiserBody = () => {
    return (
        <>
            <h1 className="header" style={{ display: "flex", justifyContent: "center" }}>Hubert Szymborski</h1>

            <div style={{ padding: "10px", marginTop: "5px", marginBottom: "20px" }} className="logo">
                <div className="container" style={{ display: "flex", justifyContent: "center", alignContent: "center" }}>

                    <img src={photo} alt="Zdięcie przedstawiające Huberta Szymborskiego" width={"500px"} style={{ borderRadius: "15%" }} />
                </div>
            </div>

            <section className="content" style={{ padding: "10px" }}>
                <p>
                    Hubert to 17-letni chłopak, który chciał zostać strażakiem - pomagać ludziom, ratować życie, być bohaterem.
                    Marzył o podróżach i odkrywaniu nowych miejsc. Niestety ostatnio jego świat nagle się zatrzymał.
                    Podejrzewa się u niego bardzo rzadką chorobę nowotworową - Lymphomatoid granulomatosis.
                </p>
                <p>
                    To podstępna jednostka chorobowa, która sprawia, że w ciele odkładają się nietypowe
                    komórki limfoidalne, atakując w szczególności układ nerwowy, płuca oraz nerki.
                    Aby potwierdzić diagnozę i rozpocząć skuteczne leczenie celowane,
                    Hubert musi przejść skomplikowane badania oraz konsultacje u specjalistów za granicą.
                </p>
                <p>
                    Mimo ogromnych trudności Hubert pozostaje niesamowicie dzielny.
                    Każdego dnia walczy o siebie, o swoje marzenia i przyszłość.
                    Wspierają go bliscy, którzy nie tracą nadziei i dodają mu sił.
                    On sam, choć doskonale wie, że przed nim długa i wyboista droga,
                    patrzy w przyszłość z niezwykłą wiarą i nadzieją - że jeszcze wróci do planów, które tak kocha.
                </p>
                <p>
                    Teraz potrzebujemy Waszej pomocy, by mógł on dostać szansę na leczenie.
                    Każda darowizna to krok bliżej do odzyskania zdrowia, siły i przyszłości pełnej marzeń.
                </p>
            </section>

        </>
    )
}

export default SpecialFundraiserBody;