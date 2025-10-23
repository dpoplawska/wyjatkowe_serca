import { useState, useEffect } from "react";
import HelpUsSide from "./HelpUsSide.tsx";
import SocialsSide from "./SocialsSide.tsx";
import pic1 from "../media/polaczeni_w_kryzysie/1.JPG";
import pic2 from "../media/polaczeni_w_kryzysie/2.JPG";
import pic3 from "../media/polaczeni_w_kryzysie/3.JPG";
import pic4 from "../media/polaczeni_w_kryzysie/4.JPG";
import pic5 from "../media/polaczeni_w_kryzysie/5.jpg";
import pic6 from "../media/polaczeni_w_kryzysie/6.JPG";
import pic7 from "../media/polaczeni_w_kryzysie/7.png";
import pic8 from "../media/polaczeni_w_kryzysie/8.png";
import pic9 from "../media/polaczeni_w_kryzysie/9.png";
import pic10 from "../media/polaczeni_w_kryzysie/10.png";
import pic11 from "../media/polaczeni_w_kryzysie/11.JPG";
import "../sections/css/Main.css";

const ConnectedInCrisisPage = () => {
	const images = [pic1, pic2, pic10, pic4, pic8, pic5, pic9, pic6, pic7];
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

	const handlePrevImage = () => {
		setSelectedImageIndex((prev) =>
			prev !== null ? (prev - 1 + images.length) % images.length : 0
		);
	};

	const handleNextImage = () => {
		setSelectedImageIndex((prev) =>
			prev !== null ? (prev + 1) % images.length : 0
		);
	};

	// Handle arrow key navigation
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (selectedImageIndex !== null) {
				if (event.key === "ArrowLeft") {
					handlePrevImage();
				} else if (event.key === "ArrowRight") {
					handleNextImage();
				} else if (event.key === "Escape") {
					setSelectedImageIndex(null);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [selectedImageIndex]);

	return (
		<>
			<section className="main">
				<div className="col-xs-12 col-lg-2" id="left-side">
					<HelpUsSide showFundraiserBar={true} specialFundraiser={false} />
				</div>
				<div className="col-xs-12 col-lg-7" id="fundraiser-content">
					<div className="content">
						<div className="crisisHeader">
							<b>Połączeni w kryzysie </b>- jak skutecznie działać, gdy sytuacja wymyka się spod kontroli?
						</div>
						<div className="crisisSubHeader">
							Szkolenie z komunikacji i negocjacji kryzysowych dla personelu
							medycznego.
						</div>
						<div
							className="logo"
							style={{ marginBottom: "2vw", marginTop: "2vw" }}
						>
							<img src={pic3} alt="Logo" width="80%" height="auto" />
						</div>
						<p>
							„Połączeni w kryzysie” to pierwszy tak kompleksowy i
							wieloaspektowy projekt szkoleniowy poświęcony komunikacji i
							negocjacjom kryzysowym w środowisku medycznym. Projekt, utworzony
							przez Fundację Wyjątkowe Serca oraz PaK-Team Sp. z o.o., został po
							raz pierwszy zrealizowany dla Dziecięcego Szpitala Klinicznego UCK
							WUM w Warszawie, we współpracy z Dyrektorem ds. Lecznictwa dr.
							Michałem Buczyńskim, który dostrzega, jak ogromne znaczenie w
							procesie leczenia i udzielania pomocy ma właściwa komunikacja oraz
							bezpieczeństwo personelu.
						</p>
						<p>
							Szkolenie było skierowane do szerokiego grona pracowników
							Dziecięcego Szpitala Klinicznego UCK WUM– uczestniczyli w nim
							przedstawiciele kadry medycznej Szpitalnego Oddziału Ratunkowego,
							lekarze ginekolodzy i położnicy dyżurujący, fizjoterapeuci,
							koordynatorzy transplantacyjni, a także przedstawiciele Dyrekcji i
							personelu administracyjnego.
						</p>
						<p>
							Celem szkolenia było nabycie wiedzy i praktycznych umiejętności w
							zakresie prowadzenia rozmów w sytuacjach kryzysowych – zarówno z
							pacjentami, jak i z ich rodzinami – oraz nauka właściwego
							reagowania w sytuacjach agresji lub zagrożenia bezpieczeństwa.
							Uczestnicy poznali zasady komunikacji kryzysowej, prenegocjacji,
							deeskalacji oraz techniki samoobrony.
						</p>
						<p>Wśród kluczowych założeń programu znalazły się:</p>
						<ul style={{ textAlign: "left" }}>
							<li>
								rozpoznawanie i adekwatne reagowanie na zachowania agresywne lub
								autoagresywne,
							</li>
							<li>
								zwiększenie odporności psychicznej i umiejętności radzenia sobie
								z emocjami w sytuacjach presji,
							</li>
							<li>
								rozwijanie kompetencji zespołowych – skuteczna współpraca,
								podział ról i koordynacja działań w czasie interwencji,
							</li>
							<li>
								poznanie możliwości wykorzystania technik negocjacji kryzysowych
								w środowisku szpitalnym,
							</li>
							<li>
								kształtowanie postaw sprzyjających bezpieczeństwu osobistemu i
								ochronie życia w sytuacjach zagrożenia.
							</li>
						</ul>
						<p>
							Integralną częścią szkolenia były warsztaty sytuacyjne i symulacje
							realnych zdarzeń, które mogły lub mogą wystąpić w szpitalu.
							Uczestnicy ćwiczyli prowadzenie prenegocjacji, komunikację z
							osobami w stanie silnego pobudzenia emocjonalnego, a także reakcje
							zespołowe w sytuacjach takich jak próba samobójcza, agresywny
							pacjent lub rodzic, czy bezpośredni atak fizyczny.
						</p>
						<p>
							Część praktyczna obejmowała również elementy samoobrony i
							zachowania w sytuacjach bezpośredniego zagrożenia, w tym techniki
							unikania, obrony i wykorzystania przedmiotów codziennego użytku w
							celu ochrony życia i zdrowia. Dzięki szkoleniu uczestnicy potrafią
							skuteczniej nawiązywać kontakt z osobą w kryzysie, stosować
							techniki deeskalacji, rozpoznawać poziom ryzyka oraz adekwatnie
							reagować w situacjach konfliktowych. Wzmocniono również współpracę
							zespołową i poczucie bezpieczeństwa w środowisku pracy.
						</p>
						<p>
							Projekt „Połączeni w kryzysie” stanowi istotny element działań na
							rzecz profilaktyki kryzysów, bezpieczeństwa personelu i poprawy
							jakości komunikacji w relacji z pacjentem oraz jego rodziną.
						</p>
						<p>
							Szkolenie poprowadzili doświadczeni praktycy z wieloletnim
							doświadczeniem w służbach mundurowych, psychologii i edukacji:
						</p>
						<p>
							<b>Piotr Zdybał</b> – współzałożyciel PaK-Team Sp. z o.o.,
							negocjator policyjny w stanie spoczynku, mediator, nauczyciel
							akademicki, uczestnik kursu dla negocjatorów policyjnych w
							Akademii FBI w Quantico (USA), specjalista w zakresie negocjacji i
							bezpieczeństwa.
						</p>
						<p>
							<b>Jolanta Żychoń</b> – współzałożycielka PaK-Team Sp. z o.o.,
							psycholożka i psychoterapeutka, właścicielka PaK-Team, trenerka i
							wykładowczyni akademicka, specjalizująca się w komunikacji i pracy
							z emocjami.
						</p>
						<p>
							<b>Przemysław Mazurek</b> – były negocjator policyjny, instruktor
							strzelectwa bojowego, trener bezpieczeństwa osobistego i
							reagowania w sytuacjach kryzysowych.
						</p>
						<p>
							<b>Kathrin Gerlic</b> – psycholog, coach i wykładowczyni, była
							psycholog w służbach mundurowych, specjalistka w zakresie
							komunikacji i mediacji.
						</p>
						<p>
							<b>Adam Strzebińczyk</b> – ekspert ds. prewencji kryminalnej i
							bezpieczeństwa osobistego, instruktor Ju-jitsu, autor programów
							szkoleniowych dla służb i personelu medycznego z zakresu
							reagowania na zagrożenia i ochrony życia.
						</p>
						<div
							className="logo"
							style={{ marginBottom: "2vw", marginTop: "2vw" }}
						>
							<img src={pic11} alt="Logo" width="80%" height="auto" />
						</div>
						<p>
							Projekt koordynuje Marta Zawadzka, założycielka Fundacji Wyjątkowe
							Serca, która dostrzega zarówno potrzeby rodziców i opiekunów
							małoletnich pacjentów, jak i potencjalne zagrożenia emocjonalne,
							jakie mogą towarzyszyć sytuacjom medycznym o wysokim poziomie
							stresu i emocji. Jako mama dziecka z wrodzoną wadą serca,
							doskonale rozumie, czym jest kryzys emocjonalny oraz jak ogromne
							znaczenie ma sposób, w jaki prowadzona jest komunikacja oraz jak
							łatwo – poprzez nieodpowiednie słowa – można nieświadomie pogłębić
							stres i wywołać eskalację napięcia.
						</p>
						<p>
							Projekt „Połączeni w kryzysie”, realizowany wspólnie przez
							Fundację Wyjątkowe Serca i PaK-Team, to kompleksowy program
							wspierający personel medyczny w pracy z emocjami, komunikacji w
							sytuacjach napięcia oraz reagowaniu w momentach kryzysowych. Jego
							celem jest ochrona pacjenta, rodziny i zespołu, gdy stres i emocje
							osiągają najwyższy poziom.
						</p>
					</div>
					<div className="gallery-container">
						<div className="gallery-grid">
							{images.map((pic, index) => (
								<div key={index} className="gallery-item">
									<img
										src={pic}
										alt={`Zdjęcie ${index + 1}`}
										className="gallery-image"
										onClick={() => setSelectedImageIndex(index)}
										style={{ cursor: "pointer" }}
									/>
								</div>
							))}
						</div>
					</div>
					{selectedImageIndex !== null && (
						<div
							style={{
								position: "fixed",
								top: 0,
								left: 0,
								width: "100%",
								height: "100%",
								backgroundColor: "rgba(0, 0, 0, 0.81)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								zIndex: 1000,
							}}
							onClick={() => setSelectedImageIndex(null)}
						>
							<img
								src={images[selectedImageIndex]}
								alt={`Zdjęcie fullscreen`}
								style={{
									maxWidth: "80%",
									maxHeight: "80%",
									objectFit: "contain",
								}}
								onClick={(e) => e.stopPropagation()}
							/>
							<button
								style={{
									position: "absolute",
									top: "50%",
									left: "20px",
									background: "rgba(255, 255, 255, 0.9)",
									border: "1px solid #ccc",
									borderRadius: "50%",
									width: "50px",
									height: "50px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									cursor: "pointer",
									fontSize: "24px",
									color: "#333",
									boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
								}}
								onClick={(e) => {
									e.stopPropagation();
									handlePrevImage();
								}}
							>
								&lt;
							</button>
							<button
								style={{
									position: "absolute",
									top: "50%",
									right: "20px",
									background: "rgba(255, 255, 255, 0.9)",
									border: "1px solid #ccc",
									borderRadius: "50%",
									width: "50px",
									height: "50px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									cursor: "pointer",
									fontSize: "24px",
									color: "#333",
									boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
								}}
								onClick={(e) => {
									e.stopPropagation();
									handleNextImage();
								}}
							>
								&gt;
							</button>
							<button
								style={{
									position: "absolute",
									top: "20px",
									right: "20px",
									background: "transparent",
									border: "none",
									color: "white",
									fontSize: "50px",
									cursor: "pointer",
								}}
								onClick={() => setSelectedImageIndex(null)}
							>
								&times;
							</button>
						</div>
					)}
				</div>
				<div className="col-xs-12 col-lg-2" id="right-side">
					<SocialsSide />
				</div>
			</section>
		</>
	);
};

export default ConnectedInCrisisPage;