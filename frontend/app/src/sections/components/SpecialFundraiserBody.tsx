import { useNavigate } from "react-router-dom";
import { beneficiaries } from "./beneficiaries/BeneficiariesData.tsx";
import React, { useState } from "react";
import Carousel from "react-bootstrap/esm/Carousel";

type BeneficiaryProps = {
	beneficiary: string | undefined;
};

const SpecialFundraiserBody = ({ beneficiary }: BeneficiaryProps) => {
	const [index, setIndex] = useState<number>(0);

	const navigate = useNavigate();
	const selectedBeneficiary = beneficiaries.find((b) => b.id === beneficiary);

	if (!selectedBeneficiary) {
		return <div>Brak takiego podopiecznego</div>;
	}

	const handleButton = () => {
		navigate("/podopieczni");
	};

	const handleSelect = (selectedIndex: number) => {
		setIndex(selectedIndex);
	};

	const imageUrls = Array.isArray(selectedBeneficiary.sectionsImageUrl)
		? selectedBeneficiary.sectionsImageUrl
		: [];

	return (
		<>
			<h1
				className="header"
				style={{ display: "flex", justifyContent: "center" }}
			>
				{selectedBeneficiary.name}
			</h1>
			<div className="sub-highlight">{selectedBeneficiary.disorder}</div>

			<div
				style={{ padding: "10px", marginTop: "5px", marginBottom: "20px" }}
				className="logo"
			>
				<div
					className="container"
					style={{
						display: "flex",
						justifyContent: "center",
						alignContent: "center",
					}}
				>
					{imageUrls.length > 1 ? (
						<>
							<Carousel activeIndex={index} onSelect={handleSelect}>
								{imageUrls.map(
									(
										url,
										idx
									) => (
										<Carousel.Item key={idx}>
											<img
												className="d-block w-100"
												src={url}
												alt={`Zdjęcie przedstawiające ${selectedBeneficiary.name} ${idx + 1}`}
												style={{ borderRadius: "15%", maxWidth: "500px" }}
											/>
										</Carousel.Item>
									)
								)}
							</Carousel>
						</>
					) : (
						<>
							<img
								src={selectedBeneficiary.sectionsImageUrl[0]}
								alt={`Zdjęcie przedstawiające ${selectedBeneficiary.name}`}
								width="500px"
								style={{ borderRadius: "15%" }}
							/>
						</>
					)}
				</div>
			</div>
			<section className="content" style={{ padding: "10px" }}>
				<div
					dangerouslySetInnerHTML={{ __html: selectedBeneficiary.description }}
				/>
			</section>
			<div style={{ display: "flex", justifyContent: "right" }}>
				<button onClick={handleButton} style={{ fontSize: "16px" }}>
					Wszyscy podopieczni
				</button>
			</div>
		</>
	);
};

export default SpecialFundraiserBody;
