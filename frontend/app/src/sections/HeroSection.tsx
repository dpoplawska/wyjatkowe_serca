import { LOGO as logo } from "../app/mediaUrls.ts"
import "./css/Main.css"


export default function HeroSection() {
    return (
        <section className="hero">
            <div className="logo" >
                <img src={logo} alt="Logo" />
            </div>
        </section>
    )
}