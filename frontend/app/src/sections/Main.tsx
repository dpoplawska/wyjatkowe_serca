import './css/Main.css';
import HelpUsSide from "./HelpUsSide.tsx";
import SocialsSide from "./SocialsSide.tsx";
import HeroSection from "./HeroSection.tsx";
import WhatWeDo from "./WhatWeDo.tsx";
import GetToKnowUs from "./GetToKnowUs.tsx";
import Parents from "./Parents.tsx";
import HelpUs from "./HelpUs.tsx";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import useSidePositionAdjustment from "./hooks/useSidePositionAdjustment.tsx";

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
