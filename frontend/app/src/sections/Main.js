import React, { useEffect, useState } from "react";
import './css/Main.css';
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import HeroSection from "./HeroSection";
import WhatWeDo from "./WhatWeDo";
import GetToKnowUs from "./GetToKnowUs";
import Parents from "./Parents";
import HelpUs from "./HelpUs";

export default function Main() {
    const [isMediumScreen, setIsMediumScreen] = useState(window.innerWidth > 992);

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

    return (
        <section className="main">
            <div className="row">
                <div className="col-xs-12 col-lg-2" id="left-side">
                    {isMediumScreen ? (
                        <div className="position-fixed"><HelpUsSide /></div>
                    ) : <HelpUsSide />}
                </div>
                <div className="col-xs-12 col-lg-8" id="main-content">
                    <HeroSection />
                    <WhatWeDo />
                    <GetToKnowUs />
                    <Parents />
                    <HelpUs />
                </div>
                <div className="col-xs-12 col-lg-2" id="right-side">
                    {isMediumScreen ? (
                        <div className="position-fixed"><SocialsSide /></div>
                    ) : <SocialsSide />}
                </div>
            </div>
        </section>
    );
}
