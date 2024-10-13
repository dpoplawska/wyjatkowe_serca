import React, { useState, useEffect } from "react";
import "./css/Main.css";
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";

export default function CharityFundraser() {
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [isMediumScreen, setIsMediumScreen] = useState(window.innerWidth > 992);
    const [top, setTop] = useState(30)
    const [buttonBottom, setButtonBottom] = useState(24);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 992px)');
        const handleScreenSizeChange = (e) => {
            setIsMediumScreen(e.matches);
        };
        mediaQuery.addEventListener('change', handleScreenSizeChange);
        setIsMediumScreen(mediaQuery.matches);
        return () => {
            mediaQuery.removeEventListener('change', handleScreenSizeChange);
        };
    }, [window]);

    useEffect(() => {
        document.addEventListener("scrollend", function () {
            const leftSide = document.getElementById('left-side');
            const rightSide = document.getElementById('right-side');
            const footer = document.querySelector('.footer');

            function adjustSidePositions() {
                const footerRect = footer && footer.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                if (footerRect) {
                    const distanceToFooter = footerRect.top - windowHeight;

                    if (distanceToFooter < 0) {
                        setButtonBottom(24 - distanceToFooter);
                    } else {
                        setButtonBottom(24);
                    }
                }

                if (leftSide && rightSide) {
                    if (footerRect && footerRect.top < windowHeight) {
                        setTop(2)
                    } else {
                        setTop(30)
                    }
                }
            }

            window.addEventListener('scroll', adjustSidePositions);
            window.addEventListener('resize', adjustSidePositions);

            adjustSidePositions();
        });
    }, ["scrollend"])

    function topFunction() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    return (
        <section className="main">
            <div className="col-xs-12 col-lg-2" id="left-side">
                {isMediumScreen ? (
                    <div className="position-fixed" style={{ top: top + '%' }}><HelpUsSide /></div>
                ) : <HelpUsSide />}
            </div>
            <div className="col-xs-12 col-lg-7" id="fundraiser-content" style={{ margin: '50px' }}>
                <h1 className="header" style={{ display: "flex", justifyContent: "center" }}>Serce dla życia -</h1>
                <h1 className="header" style={{ display: "flex", textAlign: "center", justifyContent: "center" }}>transplantacja dziecięcych marzeń</h1>

                <iframe width="100%" height="500px" src="https://www.youtube.com/embed/d_c7X3xozLg?si=GefxVfH56xxjj_ww" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay=true; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

                <section className="content">
                    <p>Każdy dzień czekania to nieskończona huśtawka emocji.
                        Rodzice i dzieci oczekujące na transplantację serca,
                        żyją w stanie niepewności i nadziei – nadziei na nową szansę na życie.
                        Każdy kolejny dzień to pytania bez odpowiedzi: "Kiedy?", "Czy zdążymy?",
                        "Czy znajdzie się serce dla naszego dziecka?". Niepewność ściska za gardło,
                        a czas wydaje się przeciągać w nieskończoność.
                        Jednak kiedy przychodzi upragniona wiadomość o możliwości transplantacji,
                        pojawia się nadzieja na wspólną przyszłość.
                    </p>
                    <p>
                        Operacja to dopiero początek długiej drogi.
                        Dzieci i nastolatki po transplantacji serca muszą stawić czoła wielu
                        wyzwaniom – nie tylko psychicznym, ale również fizycznym.
                        Każdy krok w kierunku powrotu do pełnej sprawności jest ważny,
                        a rehabilitacja staje się kluczem do odzyskania zdrowia.
                        Dlatego potrzebujemy Twojego wsparcia – aby zapewnić sprzęt rehabilitacyjny,
                        który pomoże dzieciom po transplantacji serca szybciej wrócić do
                        codziennych aktywności, radości życia, a także pełnej sprawności fizycznej.
                        Do życia, jakiego każde dziecko powinno doświadczać.
                    </p>
                    <p>
                        Jednak powrót do zdrowia to nie tylko walka ciała,
                        ale również umysłu. Dzieci po transplantacji często zmagają się z traumą,
                        lękiem przed przyszłością i poczuciem inności.
                        Dlatego równie ważne jest zapewnienie im wsparcia psychologicznego.
                        Zebrane środki pozwolą na sfinansowanie pracy psychologów, którzy pomogą
                        dzieciom i ich rodzinom przejść przez trudne emocje, oswoić nowe życie z
                        przeszczepionym sercem i budować pewność siebie na nowo.
                    </p>
                    <p>
                        Chcemy również, aby ta zbiórka przyczyniła się do szerzenia świadomości o
                        transplantologii dziecięcej i znaczeniu donacji. Nasza kampania społeczna
                        ma na celu uświadomienie społeczeństwu, jak wiele mogą zmienić decyzje o
                        przekazaniu organów – mogą uratować życie i podarować drugą szansę dzieciom,
                        które czekają na nowe serce.

                    </p>
                    <p>
                        Z całego serca dziękujemy za każdą wpłatę.
                        Dzięki Twojemu wsparciu możemy pomóc dzieciom nie tylko
                        fizycznie wrócić do zdrowia, ale także wspierać je psychicznie i dać
                        nadzieję na lepsze jutro. Wspólnie możemy zmienić ich świat!
                    </p>
                </section>
                <button onClick={topFunction} id="topButton" title="Do góry" style={{ bottom: buttonBottom + 'px' }} > <KeyboardArrowUp /></button>
            </div>
            <div className="col-xs-12 col-lg-2" id="right-side">
                {isMediumScreen ? (
                    <div className="position-fixed" style={{ top: top + '%' }}><SocialsSide /></div>
                ) : <SocialsSide />}
            </div>
        </section >
    );
}
