import { useNavigate } from "react-router-dom";

type BeneficiaryCardProps = {
	beneficiary: {id: string;
    name: string;
    disorder: string;
    sectionsImageUrl: any;
    moreInfoLink: string;
    transferTitle: string;
    description: string;};
};

const BeneficiaryCard = ({
	beneficiary
}: BeneficiaryCardProps) => {
	const navigate = useNavigate();

	const handleButton = () => {
		console.log("Button clicked!");
		navigate(beneficiary.moreInfoLink);
	};
	return (
		<>
			<div className="col-md-6" style={{ marginBottom: "20px"}}>
				<div className="card mb-4 shadow-sm h-100">
					<img
						className="card-img-top"
						src={beneficiary.sectionsImageUrl}
						alt="Description"
						style={{ height: 225, width: "100%", objectFit: "contain" }}
					/>
          <div className="card-body">
            <p className="highlight" style={{fontSize:"20px"}}>{beneficiary.name}</p>
						<p className="card-text">{beneficiary.disorder}</p>
						<div className="d-flex align-items-center justify-content-center">
							<div className="btn-group">
								<button
									onClick={handleButton}
									type="button"
									style={{
										height: "30px",
										width: "120px",
										fontSize: "12px",
									}}
								>
									Więcej informacji
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default BeneficiaryCard;