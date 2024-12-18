import React, { useState, useEffect } from "react";
import "./css/Main.css";
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import logo from "../media/logo_podstawowe.png";
import useSidePositionAdjustment from "./hooks/useSidePositionAdjustment";
import DefaultFundraiserBody from "./components/DefaultFundraiserBody";
import SpecialFundraiserBody from "./components/SpecialFundraiserBody";

export default function CharityFundraser({ specialFundraiser }) {
    const { isSmallScreen, isMediumScreen, top, buttonBottom } = useSidePositionAdjustment();

    function topFunction() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    return (
        <section className="main">
            <div className="col-xs-12 col-lg-2" id="left-side">
                {isMediumScreen ? (
                    <div className="position-fixed" style={{ top: top + '%' }}><HelpUsSide showFundraiserBar={true} specialFundraiser={specialFundraiser} /></div>
                ) : <HelpUsSide showFundraiserBar={true} specialFundraiser={specialFundraiser} />}
            </div>
            <div className="col-xs-12 col-lg-7" id="fundraiser-content">
                {specialFundraiser ? <SpecialFundraiserBody /> : <DefaultFundraiserBody />}
                <section className="thankyou">

                    <div className="dziekujemy-text" style={{ marginBottom: "30px", marginTop: "10px" }}>
                        Dziękujemy!
                    </div>

                    <div className="col-xs-6 col-lg-7 logo">
                        <img src={logo} alt="Logo Fundacji - Miś" />
                    </div>
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
