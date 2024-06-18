import React from "react"
import "../sections/css/InfoContent.css"
import logo from "../media/logo_sammis.png"

export default function HelpUs() {
    return (
        <div id="container" className="helpUs">
            <div className="row">

                <div className="col-xs-12">

                    <h1 className="header">
                        Możesz nas wesprzeć</h1>
                    <p className="content">
                        Dzięki Państwa wsparciu możemy pomagać dzieciom z wrodzonymi wadami serca oraz ich rodzinom.
                        Wiemy, że współpraca się opłaca i razem możemy osiągnąć dużo więcej, a niemożliwe nie istnieje.
                        To dzięki Państwu mogą się dziać rzeczy piękne i wyjątkowe, a marzenia stają się realne.
                        Pamiętajmy, pomagając możemy darować to, co najważniejsze życie i zdrowie ❤️
                        Pomagając ratujemy, dajemy szansę na lepsze i godne życie.
                        Pomagając dodajemy wiary w siebie i własne możliwości.
                    </p>
                </div>


                <div className="col-xs-6 col-lg-7 logo-help">
                    <img src={logo} alt="Logo Fundacji - Miś" />
                </div>
                <div className="col-xs-6 col-lg-5 dziekujemy-text">
                    Dziękujemy!
                </div>
            </div>
        </div>
    )
}