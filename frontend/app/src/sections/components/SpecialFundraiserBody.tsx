import { useNavigate } from "react-router-dom";
import { beneficiaries } from "./beneficiaries/BeneficiariesData.tsx";
import React from "react";

type BeneficiaryProps = {
	beneficiary: string | undefined;
};

const SpecialFundraiserBody = ({ beneficiary }: BeneficiaryProps) => {
    const navigate = useNavigate();
	const selectedBeneficiary = beneficiaries.find((b) => b.id === beneficiary);

	if (!selectedBeneficiary) {
		return <div>Brak takiego podopiecznego</div>;
	}

    const handleButton = () => {
        navigate("/podopieczni")
    }

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
					<img
						src={selectedBeneficiary.sectionsImageUrl}
						alt={`Zdjęcie przedstawiające ${selectedBeneficiary.name}`}
						width="500px"
						style={{ borderRadius: "15%" }}
					/>
				</div>
			</div>
			<section className="content" style={{ padding: "10px" }}>
				<div
					dangerouslySetInnerHTML={{ __html: selectedBeneficiary.description }}
				/>
			</section>
			<div style={{ display: "flex", justifyContent: "right" }}>
				<button onClick={handleButton} style={{ fontSize: "16px" }}>Wszyscy podopieczni</button>
			</div>
		</>
	);
};

export default SpecialFundraiserBody;
