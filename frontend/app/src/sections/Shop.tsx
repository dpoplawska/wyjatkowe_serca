import React, { useEffect, useState, useRef } from "react";
import "./css/Main.css";
import HelpUsSide from "./HelpUsSide";
import SocialsSide from "./SocialsSide";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import Carousel from "react-bootstrap/Carousel";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Select from "react-select";
import useSidePositionAdjustment from "./hooks/useSidePositionAdjustment";
import product1 from "../media/nerka/1.png";
import product2 from "../media/nerka/2.png";
import product3 from "../media/nerka/3.png";
import product4 from "../media/nerka/4.png";
import product5 from "../media/nerka/5.png";
import product6 from "../media/nerka/6.png";

// Custom Leaflet icon configuration
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Fallback to local assets if CDN fails
const fallbackIcon = new L.Icon({
  iconUrl: "/leaflet/images/marker-icon.png",
  iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
  shadowUrl: "/leaflet/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Sample Polish cities with postal codes and coordinates
const polishCities = [
  { name: "Warszawa", postalCode: "00-001", latitude: 52.2297, longitude: 21.0122 },
  { name: "Kraków", postalCode: "30-001", latitude: 50.0647, longitude: 19.9450 },
  { name: "Łódź", postalCode: "90-001", latitude: 51.7592, longitude: 19.4550 },
  { name: "Wrocław", postalCode: "50-001", latitude: 51.1079, longitude: 17.0385 },
  { name: "Poznań", postalCode: "60-001", latitude: 52.4064, longitude: 16.9252 },
  { name: "Gdańsk", postalCode: "80-001", latitude: 54.3520, longitude: 18.6466 },
  { name: "Szczecin", postalCode: "70-001", latitude: 53.4285, longitude: 14.5528 },
  { name: "Bydgoszcz", postalCode: "85-001", latitude: 53.1235, longitude: 18.0084 },
  { name: "Lublin", postalCode: "20-001", latitude: 51.2465, longitude: 22.5684 },
  { name: "Katowice", postalCode: "40-001", latitude: 50.2649, longitude: 19.0238 },
  { name: "Białystok", postalCode: "15-001", latitude: 53.1325, longitude: 23.1688 },
  { name: "Gdynia", postalCode: "81-001", latitude: 54.5189, longitude: 18.5305 },
  { name: "Częstochowa", postalCode: "42-200", latitude: 50.8118, longitude: 19.1134 },
  { name: "Radom", postalCode: "26-600", latitude: 51.4027, longitude: 21.1471 },
  { name: "Sosnowiec", postalCode: "41-200", latitude: 50.2863, longitude: 19.1041 },
];

// Define interfaces
interface Paczkomat {
  name: string;
  address: {
    line1: string;
    line2: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface SidePosition {
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  top: number;
  buttonBottom: number;
}

interface City {
  name: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

// Component to handle map events and update visible Paczkomaty
const MapEvents: React.FC<{
  setVisiblePaczkomaty: (paczkomaty: Paczkomat[]) => void;
  paczkomaty: Paczkomat[];
}> = ({ setVisiblePaczkomaty, paczkomaty }) => {
  const map = useMap();

  const updateVisiblePaczkomaty = () => {
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const visible = paczkomaty.filter((locker) =>
      locker.location && zoom > 10
        ? bounds.contains([locker.location.latitude, locker.location.longitude])
        : true
    );
    console.log("Map Bounds:", bounds.toBBoxString(), "Zoom:", zoom, "Visible Paczkomaty:", visible.length);
    setVisiblePaczkomaty(visible);
  };

  useEffect(() => {
    updateVisiblePaczkomaty();
    map.on("moveend zoomend", updateVisiblePaczkomaty);
    return () => {
      map.off("moveend zoomend", updateVisiblePaczkomaty);
    };
  }, [map, paczkomaty]);

  return null;
};

export default function Shop() {
  const { isSmallScreen, isMediumScreen, top, buttonBottom } = useSidePositionAdjustment() as SidePosition;
  const [quantity, setQuantity] = useState<number>(1);
  const [name, setName] = useState<string>("");
  const [surname, setSurname] = useState<string>("");
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [index, setIndex] = useState<number>(0);
  const [paczkomaty, setPaczkomaty] = useState<Paczkomat[]>([]);
  const [visiblePaczkomaty, setVisiblePaczkomaty] = useState<Paczkomat[]>([]);
  const [selectedPaczkomat, setSelectedPaczkomat] = useState<Paczkomat | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([52.2297, 21.0122]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<City | null>({ name: "Warszawa", postalCode: "00-001", latitude: 52.2297, longitude: 21.0122 });
  const [deliveryMethod, setDeliveryMethod] = useState<'paczkomat' | 'kurier'>('paczkomat');
  const [street, setStreet] = useState<string>("");
  const [houseNumber, setHouseNumber] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});

  const productPrice = 239;
  const shippingCost = deliveryMethod === 'paczkomat' ? 18.99 : 20.99;
  const totalCost = (productPrice * quantity) + shippingCost;

  useEffect(() => {
    const fetchPaczkomaty = async () => {
      if (!selectedCity) {
        setErrorMessage("Proszę wybrać miasto.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setErrorMessage("");
        setPaczkomaty([]);
        setVisiblePaczkomaty([]);
        setSelectedPaczkomat(null); // Reset selected Paczkomat
        let allPaczkomaty: Paczkomat[] = [];
        let page = 1;
        let hasMorePages = true;
        const perPage = 100;

        while (hasMorePages) {
          const response = await axios.get("https://api-pl-points.easypack24.net/v1/points", {
            params: {
              type: "parcel_locker",
              fields: "name,address,location",
              per_page: perPage,
              page: page,
              city: selectedCity.name,
            },
          });
          console.log(`API Response (Page ${page}) for ${selectedCity.name}:`, response.data);

          const data: Paczkomat[] = response.data.items
            ? response.data.items.filter(
                (item: any): item is Paczkomat =>
                  item &&
                  typeof item.name === "string" &&
                  item.address &&
                  typeof item.address.line1 === "string" &&
                  typeof item.address.line2 === "string" &&
                  (!item.location ||
                    (typeof item.location.latitude === "number" &&
                      typeof item.location.longitude === "number"))
              )
            : [];

          allPaczkomaty = [...allPaczkomaty, ...data];

          const totalPages = response.data.meta?.total_pages || 1;
          hasMorePages = page < totalPages;
          page += 1;

          if (hasMorePages) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        if (allPaczkomaty.length === 0) {
          setErrorMessage(`Brak Paczkomatów w mieście ${selectedCity.name}. Spróbuj inne miasto.`);
        } else {
          setPaczkomaty(allPaczkomaty);
          setVisiblePaczkomaty(allPaczkomaty);
          setMapCenter([selectedCity.latitude, selectedCity.longitude]);
        }
        console.log("All Filtered Paczkomaty:", allPaczkomaty);
      } catch (error: any) {
        console.error("Error fetching Paczkomaty:", error);
        setErrorMessage(
          error.response?.status === 429
            ? "Zbyt wiele zapytań do API. Spróbuj ponownie później."
            : `Błąd podczas pobierania Paczkomatów dla ${selectedCity.name}. Spróbuj ponownie.`
        );
        setPaczkomaty([]);
        setVisiblePaczkomaty([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPaczkomaty();
  }, [selectedCity]);

  useEffect(() => {
    if (selectedPaczkomat?.location && mapRef.current) {
      setMapCenter([selectedPaczkomat.location.latitude, selectedPaczkomat.location.longitude]);
      const map = mapRef.current;
      const pos: [number, number] = [selectedPaczkomat.location.latitude, selectedPaczkomat.location.longitude];
      map.flyTo(pos, 15);
      const marker = markerRefs.current[selectedPaczkomat.name];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedPaczkomat]);

  useEffect(() => {
    const requiredFieldsFilled =
      name &&
      surname &&
      (deliveryMethod === 'paczkomat' ? selectedPaczkomat : street && houseNumber && zipCode && city);
    setDisabled(!requiredFieldsFilled);
  }, [name, surname, selectedPaczkomat, deliveryMethod, street, houseNumber, zipCode, city]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setQuantity(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled) {
      try {
        console.log("Selected Paczkomat:", selectedPaczkomat);
        setFormSubmitted(true);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setName("");
        setSurname("");
        setQuantity(1);
        setSelectedPaczkomat(null);
        setStreet("");
        setHouseNumber("");
        setZipCode("");
        setCity("");
        setSelectedCity({ name: "Warszawa", postalCode: "00-001", latitude: 52.2297, longitude: 21.0122 });
        setErrorMessage("");
      }
    }
  };

  const handleSelect = (selectedIndex: number) => {
    setIndex(selectedIndex);
  };

  const topFunction = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  // Prepare options for react-select (Paczkomaty)
  const paczkomatOptions = visiblePaczkomaty.map((locker) => ({
    value: locker.name,
    label: `${locker.name} - ${locker.address.line1}, ${locker.address.line2}`,
    paczkomat: locker,
  }));

  // Prepare options for city dropdown
  const cityOptions = polishCities.map((city) => ({
    value: city.name,
    label: `${city.name} (${city.postalCode})`,
    city: city,
  }));

  return (
    <section className="main">
      <div className="col-xs-12 col-lg-2" id="left-side">
        {isMediumScreen ? (
          <div className="position-fixed" style={{ top: `${top}%` }}>
            <HelpUsSide showFundraiserBar={true} specialFundraiser={false} />
          </div>
        ) : (
          <HelpUsSide showFundraiserBar={true} specialFundraiser={false} />
        )}
      </div>

      <div
        className="col-xs-12 col-lg-7"
        id="shop-content"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: "20px",
        }}
      >
        <div className="product-info" style={{ textAlign: "center", maxWidth: "500px" }}>
          <h2 style={{ display: "flex", justifyContent: "center" }} className="sub-highlight">
            Medibelt - Ratujka
          </h2>
          <Carousel activeIndex={index} onSelect={handleSelect}>
            <Carousel.Item>
              <img className="d-block w-100" src={product1} alt="Product 1" />
            </Carousel.Item>
            <Carousel.Item>
              <img className="d-block w-100" src={product2} alt="Product 2" />
            </Carousel.Item>
            <Carousel.Item>
              <img className="d-block w-100" src={product3} alt="Product 3" />
            </Carousel.Item>
            <Carousel.Item>
              <img className="d-block w-100" src={product4} alt="Product 4" />
            </Carousel.Item>
            <Carousel.Item>
              <img className="d-block w-100" src={product5} alt="Product 5" />
            </Carousel.Item>
            <Carousel.Item>
              <img className="d-block w-100" src={product6} alt="Product 6" />
            </Carousel.Item>
          </Carousel>
          <p>
            MediBelt lub potocznie <strong>Ratujka</strong> – to apteczka pierwszej pomocy w formie wygodnej nerki.
            Bądź przygotowany na każdą przygodę – zarówno tę wesołą, jak i tę wymagającą szybkiej reakcji.
            Dzięki formie praktycznej nerki nosisz ją wygodnie w pasie lub na biodrach, a jej ergonomiczny kształt
            pozwala błyskawicznie sięgnąć po potrzebne akcesoria w kryzysowej chwili.
          </p>
          <p>
            Świetnie sprawdzi się w domu, na placu zabaw, w podróży, na spacerze czy podczas aktywności na świeżym powietrzu –
            wszędzie tam, gdzie liczy się czas i skuteczność.
          </p>
          <h3 style={{ marginTop: "20px" }}>Co znajdziesz w środku?</h3>
          <ul style={{ textAlign: "left" }}>
            <li>4 × plastry opatrunkowe „Safari”</li>
            <li>1 × plaster wodoodporny</li>
            <li>Bandaż dziany</li>
            <li>6 × rękawiczki jednorazowe</li>
            <li>Bezpieczne nożyczki ratownicze</li>
            <li>1 × gaza opatrunkowa</li>
            <li>Bandaż kohezyjny</li>
            <li>Prontosan Spray – do czyszczenia i nawilżania ran</li>
            <li>Prontosan Acute Żel – hydrożel przyspieszający gojenie, nawilżający i chłodzący</li>
            <li>3 × kompresy jałowe</li>
            <li>1 × EasyIce – suchy lód na stłuczenia</li>
            <li>2 × sól fizjologiczna</li>
            <li>1 × Codofix</li>
            <li>3 × naklejki „Masz Supermoce” – by dodać otuchy małym bohaterom</li>
            <li>Koc ratunkowy termoizolacyjny</li>
          </ul>
          <h3 style={{ marginTop: "20px" }}>Dlaczego warto mieć Ratujkę?</h3>
          <ul style={{ textAlign: "left" }}>
            <li>Szybki dostęp – wszystkie niezbędne elementy w jednym miejscu.</li>
            <li>Mobilność – noś jak chcesz, zawsze pod ręką.</li>
            <li>Bezpieczeństwo – starannie dobrane wyposażenie, także dla dzieci.</li>
            <li>Wsparcie w stresujących sytuacjach – od drobnych skaleczeń po poważniejsze urazy.</li>
          </ul>
          <h3 style={{ marginTop: "20px" }}>Wskazówki bezpieczeństwa:</h3>
          <ul style={{ textAlign: "left" }}>
            <li>Regularnie sprawdzaj zawartość apteczki i uzupełniaj braki.</li>
            <li>Przechowuj w suchym miejscu.</li>
            <li>Wymieniaj zużyte lub przeterminowane materiały.</li>
          </ul>
          <p style={{ fontWeight: "bold", marginTop: "15px" }}>Cena: <b>239zł</b></p>

          <div className="quantity-selector" style={{ margin: "20px 0" }}>
            <label htmlFor="quantity">Ilość: </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              style={{ width: "60px", marginLeft: "10px" }}
            />
          </div>

          <div className="delivery-method" style={{ margin: "20px 0" }}>
            <label>Metoda dostawy: </label>
            <div>
              <input
                type="radio"
                id="paczkomat"
                value="paczkomat"
                checked={deliveryMethod === 'paczkomat'}
                onChange={() => setDeliveryMethod('paczkomat')}
              />
              <label htmlFor="paczkomat">Paczkomat - 19.99 zł</label>
            </div>
            <div>
              <input
                type="radio"
                id="kurier"
                value="kurier"
                checked={deliveryMethod === 'kurier'}
                onChange={() => setDeliveryMethod('kurier')}
              />
              <label htmlFor="kurier">Kurier - 20.99 zł</label>
            </div>
          </div>

          {deliveryMethod === 'paczkomat' && (
            <div className="city-selector" style={{ margin: "20px 0" }}>
              <label htmlFor="citySelect">Wybierz miasto: </label>
              <Select
                id="citySelect"
                options={cityOptions}
                value={cityOptions.find((option) => option.value === selectedCity?.name) || null}
                onChange={(selectedOption) => {
                  setSelectedCity(selectedOption?.city || null);
                  setSelectedPaczkomat(null);
                  if (selectedOption?.city) {
                    setMapCenter([selectedOption.city.latitude, selectedOption.city.longitude]);
                  }
                }}
                placeholder="-- Wybierz miasto --"
                isSearchable
                styles={{
                  control: (provided) => ({
                    ...provided,
                    padding: "8px",
                    width: "100%",
                    marginTop: "5px",
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                  }),
                }}
                required
              />
            </div>
          )}

          {deliveryMethod === 'paczkomat' && errorMessage && (
            <p style={{ color: "red", margin: "10px 0" }}>{errorMessage}</p>
          )}

          {deliveryMethod === 'paczkomat' && (
            <div className="paczkomat-selector" style={{ margin: "20px 0" }}>
              <label htmlFor="paczkomat">Wybierz Paczkomat: </label>
              {isLoading ? (
                <p>Loading Paczkomaty...</p>
              ) : paczkomatOptions.length > 0 ? (
                <Select
                  id="paczkomat"
                  options={paczkomatOptions}
                  value={paczkomatOptions.find((option) => option.value === selectedPaczkomat?.name) || null}
                  onChange={(selectedOption) => {
                    setSelectedPaczkomat(selectedOption?.paczkomat || null);
                  }}
                  placeholder="-- Wybierz Paczkomat --"
                  isClearable
                  isSearchable
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      padding: "8px",
                      width: "100%",
                      marginTop: "5px",
                    }),
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999,
                    }),
                  }}
                  required
                />
              ) : (
                <p>Brak dostępnych Paczkomatów dla wybranego miasta.</p>
              )}
            </div>
          )}

          {deliveryMethod === 'paczkomat' && (
            <div className="paczkomat-map" style={{ height: "400px", width: "100%", margin: "20px 0" }}>
              {isLoading ? (
                <p>Loading map...</p>
              ) : Array.isArray(paczkomaty) && paczkomaty.length > 0 ? (
                <MapContainer ref={mapRef} center={mapCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapEvents setVisiblePaczkomaty={setVisiblePaczkomaty} paczkomaty={paczkomaty} />
                  {visiblePaczkomaty.map((locker) =>
                    locker.location ? (
                      <Marker
                        key={locker.name}
                        position={[locker.location.latitude, locker.location.longitude]}
                        icon={customIcon}
                        ref={(el) => {
                          if (el) markerRefs.current[locker.name] = el;
                        }}
                        eventHandlers={{
                          click: () => setSelectedPaczkomat(locker),
                        }}
                      >
                        <Popup>
                          {locker.name} <br />
                          {locker.address.line1}, {locker.address.line2}
                        </Popup>
                      </Marker>
                    ) : null
                  )}
                </MapContainer>
              ) : (
                <p>Brak danych mapy dla wybranego miasta.</p>
              )}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              maxWidth: "300px",
              width: "100%",
              margin: "0 auto",
              alignItems: "center",
            }}
          >
            <div>
              <label htmlFor="name">Imię: </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <div>
              <label htmlFor="surname">Nazwisko: </label>
              <input
                type="text"
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            {deliveryMethod === 'kurier' && (
              <>
                <div>
                  <label htmlFor="street">Ulica: </label>
                  <input
                    type="text"
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
                <div>
                  <label htmlFor="houseNumber">Nr domu: </label>
                  <input
                    type="text"
                    id="houseNumber"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
                <div>
                  <label htmlFor="zipCode">Kod pocztowy: </label>
                  <input
                    type="text"
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
                <div>
                  <label htmlFor="city">Miasto: </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px" }}
                  />
                </div>
              </>
            )}
            <p>Całkowity koszt: {totalCost.toFixed(2)} zł</p>
            <button type="submit" id="buttonSubmit" disabled={disabled}>
              Kupuję🤍
            </button>
          </form>

          {formSubmitted && (
            <p style={{ color: "green", marginTop: "15px" }}>
              Thank you, {name} {surname}, for your order of {quantity} item(s)! Total: {totalCost.toFixed(2)} zł
              {deliveryMethod === 'paczkomat' && selectedPaczkomat && (
                <>
                  {" "}
                  Delivery to: {selectedPaczkomat.name}, {selectedPaczkomat.address.line1}, {selectedPaczkomat.address.line2}
                </>
              )}
              {deliveryMethod === 'kurier' && (
                <>
                  {" "}
                  Delivery by kurier to: {street} {houseNumber}, {zipCode} {city}
                </>
              )}
            </p>
          )}
        </div>

        <button
          onClick={topFunction}
          id="topButton"
          title="Do góry"
          style={{ bottom: `${buttonBottom}px`, position: "fixed" }}
        >
          <KeyboardArrowUp />
        </button>
      </div>

      <div className="col-xs-12 col-lg-2" id="right-side">
        {isMediumScreen ? (
          <div className="position-fixed" style={{ top: `${top}%` }}>
            <SocialsSide />
          </div>
        ) : (
          <SocialsSide />
        )}
      </div>
    </section>
  );
}