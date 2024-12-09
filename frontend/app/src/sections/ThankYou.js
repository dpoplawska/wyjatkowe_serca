import React, { useState, useEffect } from "react";
import "./css/Main.css";
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import logo from "../media/logo_podstawowe.png";
import FavoriteIcon from '@mui/icons-material/Favorite';
import useSidePositionAdjustment from "./hooks/useSidePositionAdjustment";


export default function ThankYou() {
    const { isSmallScreen, isMediumScreen, top, buttonBottom } = useSidePositionAdjustment();

    return (
        <section className="main">
            <div className="col-xs-12 col-lg-2" id="left-side">
                <HelpUsSide showFundraiserBar={true} />
            </div>
            <div className="col-xs-12 col-lg-7" id="fundraiser-content">
                <div className="thanks">
                    <p>Dziękujemy za wsparcie<FavoriteIcon id="favIcon" /></p>
                </div>
                <div className="logo">
                    <img src={logo} alt="Logo" width="50%" height="auto" />
                </div>
            </div>
            <div className="col-xs-12 col-lg-2" id="right-side">
                <SocialsSide />
            </div>
        </section>
    );
}
