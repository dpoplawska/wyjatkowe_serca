import React from "react"
import './css/Footer.css'
import logo from "../media/LOGO_FundacjaWS_podst_RGB-01.png"
import PlaceIcon from '@mui/icons-material/Place';

export default function Footer() {
    return (
        <footer className="footer mt-auto py-0 mt-3 bg-light">
            <div className="footer">
                <div className="row">
                    <div className="col-12 col-sm-4 mb-3 mb-md-0">
                        <img src={logo} width="200px" alt="Footer Image" className="img-fluid" />
                    </div>
                    <div className="col-12 col-sm-4 mb-3 mb-md-0">
                        <h5>Kontakt</h5>
                        {/* <p>Phone: +48 123 456 789</p> */}
                        {/* <p>Email: kontakt@example.com</p> */}
                        <p className="contact">
                            <a href="https://www.google.com/maps/place/al.+Jerozolimskie+123A,+02-017+Warszawa/@52.2249832,20.988533,17z/data=!3m1!4b1!4m6!3m5!1s0x471ecc912dcfbc11:0x914920fa7b955f73!8m2!3d52.2249832!4d20.9911079!16s%2Fg%2F11bw3wtd2n?entry=ttu" target="_blank" rel="noopener noreferrer">
                                <PlaceIcon id="addressIcon" />
                                Al. Jerozolimskie 123A
                                02-017 Warszawa
                            </a>
                        </p>

                    </div>
                    <div className="col-12 col-sm-4 mb-3 mb-md-0">
                        <h5>Rachunek bankowy</h5>
                        <p>Bank: mBank</p>
                        <p>Numer rachunku: IBAN PL40 1140 2004 0000 3502 8436 9739</p>
                        <p>Tytuł przelewu: darowizna</p>
                        <p>Numer BIC</p>
                        <p>BREXPLPWMBK</p>

                    </div>
                </div>
            </div>
        </footer>
        // <div className="footer" aria-label="footer"  >
        //     <div className="container">
        //         <footer className="row row-cols-1 row-cols-sm-2 row-cols-md-5 py-5 my-1 border-top">
        //             <div className="col mb-3">
        //                 <img src={logo} alt="Logo Fundacji - Miś" width="200px" />
        //             </div>
        //             <div className="col mb-3"></div>
        //             <div className="col mb-3">
        //                 <h5>Kontakt</h5>
        //                 <ul className="nav flex-column">
        //                     <li className="nav-item mb-2">
        //                         Al. Jerozolimskie 123A
        //                         02-017 Warszawa</li>
        //                 </ul>
        //             </div>
        //             <div className="col mb-3"></div>
        //             <div className="col mb-3"></div>

        //         </footer>
        //     </div>
        // </div>
    )
}