import React, { useEffect, useState } from "react";
import './css/Main.css';
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import HeroSection from "./HeroSection";
import WhatWeDo from "./WhatWeDo";
import GetToKnowUs from "./GetToKnowUs";
import Parents from "./Parents";
import HelpUs from "./HelpUs";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export default function Main() {
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
            <div className="row">
                <div className="col-xs-12 col-lg-2" id="left-side">
                    {isMediumScreen ? (
                        <div className="position-fixed" style={{ top: top + '%' }}><HelpUsSide showFundraiserBar={false} /></div>
                    ) : <HelpUsSide showFundraiserBar={false} />}
                </div>
                <div className="col-xs-12 col-lg-8" id="main-content">
                    <HeroSection />
                    <WhatWeDo />
                    <GetToKnowUs />
                    <Parents />
                    <HelpUs />
                    <button onClick={topFunction} id="topButton" title="Do góry" style={{ bottom: buttonBottom + 'px' }} > <KeyboardArrowUpIcon /></button>

                </div>
                <div className="col-xs-12 col-lg-2" id="right-side">
                    {isMediumScreen ? (
                        <div className="position-fixed" style={{ top: top + '%' }}><SocialsSide /></div>
                    ) : <SocialsSide />}
                </div>
            </div>
        </section >
    );
}
