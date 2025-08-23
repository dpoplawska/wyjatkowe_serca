import "./css/Main.css";
import HelpUsSide from "./HelpUsSide.tsx";
import SocialsSide from "./SocialsSide.tsx";
import logo from "../media/logo_podstawowe.png";
import FavoriteIcon from '@mui/icons-material/Favorite';

export default function ThankYou() {
    return (
        <section className="main">
            <div className="col-xs-12 col-lg-2" id="left-side">
                <HelpUsSide showFundraiserBar={true} specialFundraiser={false} />
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
