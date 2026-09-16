import "./css/Main.css";
import HelpUsSide from "./HelpUsSide.tsx";
import SocialsSide from "./SocialsSide.tsx";
import BeneficiaryCard from "./components/BeneficiaryCard.tsx";
import { beneficiaries } from "./components/beneficiaries/BeneficiariesData.tsx";
import { useState, type CSSProperties } from "react";
import SearchIcon from "@mui/icons-material/Search";
import MedicalInformationOutlinedIcon from "@mui/icons-material/MedicalInformationOutlined";
import { Autocomplete, Checkbox, FormControlLabel, TextField } from "@mui/material";
import useSidePositionAdjustment from "./hooks/useSidePositionAdjustment.tsx";

export default function BeneficiariesPage() {
	const { isMediumScreen, top } = useSidePositionAdjustment();
	const [searchName, setSearchName] = useState("");
	const [filterDisorder, setFilterDisorder] = useState("");
	const [onlyAfterHeartTransplant, setOnlyAfterHeartTransplant] =
		useState(false);

	const disorders = [
		...new Set(
			beneficiaries
				.filter((b) => !b.angel)
				.map((b) => b.disorder)
				.filter((d) => d),
		),
	];
	const names = [...new Set(beneficiaries.map((b) => b.name).filter((n) => n))];

	const active = beneficiaries.filter((b) => !b.angel);
	const angels = beneficiaries.filter((b) => b.angel);

	const filteredBeneficiaries = active
		.filter((b) => !onlyAfterHeartTransplant || b.afterHeartTransplant)
		.filter(
			(b) =>
				!searchName || b.name.toLowerCase().includes(searchName.toLowerCase())
		)
		.filter(
			(b) =>
				!filterDisorder ||
				b.disorder?.toLowerCase().includes(filterDisorder.toLowerCase())
		);

	const filtersActive = !!searchName || !!filterDisorder || onlyAfterHeartTransplant;
	const clearFilters = () => {
		setSearchName("");
		setFilterDisorder("");
		setOnlyAfterHeartTransplant(false);
	};

	const iconStyle: CSSProperties = {
		position: "absolute",
		left: 24,
		top: "50%",
		transform: "translateY(-50%)",
		color: "#9a9a9a",
		pointerEvents: "none",
	};

	return (
		<section className="main">
			<div className="col-xs-12 col-lg-2" id="left-side">
				{isMediumScreen ? (
					<div className="position-fixed" style={{ top: top + '%' }}><HelpUsSide showFundraiserBar={true} specialFundraiser={false} /></div>
				) : <HelpUsSide showFundraiserBar={true} specialFundraiser={false} />}
			</div>

			<div className="col-xs-12 col-lg-7" id="fundraiser-content">
				<div className="header" style={{ justifyContent: "center" }}>
					Nasi podopieczni
				</div>
				<p
					style={{
						textAlign: "center",
						color: "#616161",
						maxWidth: 560,
						margin: "8px auto 0",
						fontSize: 16,
						lineHeight: 1.5,
					}}
				>
					Dzieci z wadami i chorobami serca, które wspieramy na co dzień.
					Kliknij w kartę, aby poznać historię i wesprzeć zbiórkę.
				</p>

				<div className="filters container py-3">
					<div className="row justify-content-center g-2">
						<div className="col-md-5 position-relative">
							<SearchIcon fontSize="small" style={iconStyle} />
							<Autocomplete
								freeSolo
								options={names}
								value={searchName}
								onInputChange={(_, newValue) => setSearchName(newValue)}
								renderInput={(params) => (
									<TextField
										{...params}
										placeholder="Szukaj po imieniu"
										sx={{
											"& .MuiOutlinedInput-root": {
												height: 44,
												borderRadius: 3,
												fontFamily: "Quicksand",
												paddingLeft: "40px !important",
											},
										}}
									/>
								)}
							/>
						</div>

						<div className="col-md-5 position-relative">
							<MedicalInformationOutlinedIcon fontSize="small" style={iconStyle} />
							<Autocomplete
								freeSolo
								options={disorders}
								value={filterDisorder}
								onInputChange={(_, newValue) => setFilterDisorder(newValue)}
								renderInput={(params) => (
									<TextField
										{...params}
										placeholder="Szukaj po schorzeniu"
										sx={{
											"& .MuiOutlinedInput-root": {
												height: 44,
												borderRadius: 3,
												fontFamily: "Quicksand",
												paddingLeft: "40px !important",
											},
										}}
									/>
								)}
							/>
						</div>
						<div className="col-md-10 col-lg-12 d-flex justify-content-center align-items-center flex-wrap">
							<FormControlLabel
								control={
									<Checkbox
										checked={onlyAfterHeartTransplant}
										onChange={(e) =>
											setOnlyAfterHeartTransplant(e.target.checked)
										}
										color="primary"
									/>
								}
								label="Pokaż tylko podopiecznych po transplantacji serca"
								labelPlacement="end"
								sx={{
									margin: 0,
									marginTop: 1,
									fontFamily: "Quicksand",
									color: "#2E2E2E",
								}}
							/>
						</div>
						<div
							className="col-12 d-flex justify-content-center align-items-center"
							style={{ gap: 12, color: "#616161", fontSize: 14, marginTop: 4 }}
						>
							<span>
								Pokazujemy {filteredBeneficiaries.length} z {active.length} podopiecznych
							</span>
							{filtersActive && (
<button
									type="button"
									onClick={clearFilters}
									style={{
										background: "none",
										border: "none",
										width: "auto",
										height: "auto",
										padding: 0,
										color: "#2383C5",
										fontWeight: 700,
										fontSize: 14,
									}}
								>
									Wyczyść filtry
								</button>
							)}
						</div>
					</div>
				</div>

				<div className="album py-3">
					<div className="container">
						{filteredBeneficiaries.length === 0 ? (
							<div
								style={{
									textAlign: "center",
									padding: "48px 16px",
									color: "#616161",
								}}
							>
								<p className="highlight" style={{ fontSize: 22, marginBottom: 8 }}>
									Nie znaleźliśmy podopiecznych
								</p>
								<p style={{ marginBottom: 20 }}>
									Spróbuj innego imienia lub schorzenia albo wyczyść filtry.
								</p>
								<button
									type="button"
									onClick={clearFilters}
									style={{ height: 44, width: 180, fontSize: 15 }}
								>
									Wyczyść filtry
								</button>
							</div>
						) : (
							<div className="row">
								{filteredBeneficiaries.map((b) => (
									<BeneficiaryCard key={b.id || b.name} beneficiary={b} />
								))}
							</div>
						)}
					</div>
				</div>

				{angels.length > 0 && (
					<div className="album py-3">
						<div className="container">
							<div
								style={{
									borderTop: "1px solid #e5e5e5",
									paddingTop: 32,
									marginBottom: 24,
									textAlign: "center",
								}}
							>
								<div
									className="header"
									style={{ justifyContent: "center", fontSize: 34, color: "#616161" }}
								>
									Nasze Aniołki
								</div>
								<p style={{ color: "#616161", margin: "8px auto 0", maxWidth: 520 }}>
									Pamiętamy o dzieciach, które odeszły. Ich historie pozostają
									częścią Fundacji.
								</p>
							</div>
							<div className="row justify-content-center">
								{angels.map((b) => (
									<BeneficiaryCard key={b.id || b.name} beneficiary={b} />
								))}
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="col-xs-12 col-lg-2" id="right-side">
				{isMediumScreen ? (
					<div className="position-fixed" style={{ top: top + '%' }}><SocialsSide /></div>
				) : <SocialsSide />}
			</div>
		</section>
	);
}
