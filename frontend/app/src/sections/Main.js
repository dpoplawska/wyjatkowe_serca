import React, { useEffect, useState } from "react";
import './css/Main.css';
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import HeroSection from "./HeroSection";
import WhatWeDo from "./WhatWeDo";
import GetToKnowUs from "./GetToKnowUs";
import Parents from "./Parents";
import HelpUs from "./HelpUs";
import { Drawer, styled } from "@mui/material";

const CenteredAside = styled('aside')({
    height: '80%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
});

export default function Main() {
    const [isMediumScreen, setIsMediumScreen] = useState(window.innerWidth > 992);
    const [isBigScreen, setIsBigScreen] = useState(window.innerWidth > 1450);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 992px)');
        const mediaQuery2 = window.matchMedia('(min-width: 1450px)');

        const handleScreenSizeChange = (e) => {
            setIsMediumScreen(e.matches);
            setIsBigScreen(e.matches)
        };
        mediaQuery.addEventListener('change', handleScreenSizeChange);
        setIsMediumScreen(mediaQuery.matches);
        setIsBigScreen(mediaQuery2.matches);

        return () => {
            mediaQuery.removeEventListener('change', handleScreenSizeChange);
        };
    }, [window]);

    return (
        <section className="main">
            <div className="row">
                <div className="col-xs-12 col-lg-3">{isMediumScreen ? (<div className="position-fixed"><HelpUsSide /> </div>) : <HelpUsSide />}</div>
                <div className="col-xs-12 col-lg-6 ">
                    <HeroSection />
                    <WhatWeDo />
                    <GetToKnowUs />
                    <Parents />
                    <HelpUs />
                </div>
                <div className="col-xs-12 col-lg-3">{isMediumScreen ? (<div className="position-fixed"><SocialsSide /> </div>) : <HelpUsSide />}</div>
            </div>
        </section>
    );
}
