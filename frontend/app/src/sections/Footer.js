import React from "react"
import './css/Footer.css'
import logo from "../media/logo_podstawowe.png"
import PlaceIcon from '@mui/icons-material/Place';
import privacyPolicy from "../media/Polityka_prywatnosci.pdf"
import serviceRegulations from "../media/Regulamin_serwisu_FWS.pdf"


export default function Footer() {
    const addressLink = "https://www.google.com/maps/place/al.+Jerozolimskie+123A,+02-017+Warszawa/@52.2249832,20.988533,17z/data=!3m1!4b1!4m6!3m5!1s0x471ecc912dcfbc11:0x914920fa7b955f73!8m2!3d52.2249832!4d20.9911079!16s%2Fg%2F11bw3wtd2n?entry=ttu";

    return (
        <footer className="footer mt-auto py-0 mt-3 bg-light">
            <div className="footer">
                <div className="row">
                    <div className="col-12 col-sm-12 col-md-4 mb-3 mb-md-0 " >
                        <img src={logo} className="bear" alt="Logo Fundacji Wyjątkowe Serca" />
                    </div>
                    <div className="col-12 col-sm-12 col-md-4 mb-3 mb-md-0">
                        <h5>Kontakt</h5>
                        <p>Numer telefonu: +48 792 262 345</p>
                        <p>Email: fundacja@wyjatkoweserca.pl</p>
                        <p className="address">
                            <a href={addressLink} target="_blank" rel="noopener noreferrer">
                                <PlaceIcon id="addressIcon" />
                                Al. Jerozolimskie 123A
                                02-017 Warszawa
                            </a>
                        </p>

                    </div>
                    <div className="col-12 col-sm-12 col-md-4 mb-3 mb-md-0">
                        <h5>Rachunek bankowy</h5>
                        <p>mBank</p>
                        <p>Numer rachunku: IBAN PL40 1140 2004 0000 3502 8436 9739</p>
                        <p>Tytuł przelewu: darowizna</p>
                        <p>Numer BIC: BREXPLPWMBK</p>
                    </div>
                </div>
                <div className="container">
                    <footer className="d-flex flex-wrap justify-content-between align-items-center py-1 my-2 border-top">
                        <div className="col-md-4 d-flex align-items-center" style={{ gap: "10px" }}>
                            <a href={privacyPolicy} target="_blank" rel="noopener noreferrer" className="privacy-policy-link">Polityka prywatności</a>
                            <div className="devsite-footer-utility-item" />
                            <a href={serviceRegulations} target="_blank" rel="noopener noreferrer" className="service-regualtions-link">Regulamin serwisu</a>
                        </div>
                        <div className="nav col-md-6 justify-content-end d-flex">
                            <span className="mb-3 mb-md-0 text-body-secondary all-rights-reserved">© 2024 Fundacja Wyjątkowe Serca. Wszystkie prawa zastrzeżone.</span>
                        </div>
                    </footer>
                </div>

            </div>
        </footer>
    )
}