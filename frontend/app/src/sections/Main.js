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
import useSidePositionAdjustment from "./hooks/useSidePositionAdjustment";

export default function Main() {
    const { isSmallScreen, isMediumScreen, top, buttonBottom } = useSidePositionAdjustment();

    function topFunction() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    return (
        <section className="main">
            <div className="row">
                <div className="col-xs-12 col-lg-2" id="left-side">
                    {isMediumScreen ? (
                        <div className="position-fixed" style={{ top: top + '%' }}><HelpUsSide showFundraiserBar={false} specialFundraiser={false} /></div>
                    ) : <HelpUsSide showFundraiserBar={false} specialFundraiser={false} />}
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
