import { useState } from "react";
import { useNavigate } from "react-router-dom";

type BeneficiaryCardProps = {
	beneficiary: {
		id: string;
		name: string;
		disorder: string;
		sectionsImageUrl: any;
		moreInfoLink: string;
		transferTitle: string;
		description: string;
		afterHeartTransplant?: boolean;
		angel?: boolean;
	};
};

const BeneficiaryCard = ({ beneficiary }: BeneficiaryCardProps) => {
	const navigate = useNavigate();
	const [hover, setHover] = useState(false);
	const angel = !!beneficiary.angel;

	const handleButton = () => {
		navigate(beneficiary.moreInfoLink);
	};

	return (
		<div className="col-12 col-md-6 col-xl-4 mb-4 d-flex">
			<div
				role="link"
				tabIndex={0}
				aria-label={`${beneficiary.name} – więcej informacji`}
				onClick={handleButton}
				onKeyDown={(e) => e.key === "Enter" && handleButton()}
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
				style={{
					display: "flex",
					flexDirection: "column",
					width: "100%",
					background: "#fff",
					border: "1px solid #eee",
					borderRadius: 16,
					overflow: "hidden",
					cursor: "pointer",
					boxShadow: hover
						? "0 12px 28px rgba(46,46,46,0.16)"
						: "0 2px 8px rgba(46,46,46,0.08)",
					transform: hover ? "translateY(-4px)" : "none",
					transition: "box-shadow .2s ease, transform .2s ease",
				}}
			>
				<div
					style={{
						position: "relative",
						width: "100%",
						paddingTop: "125%",
						background: "#f4f4f4",
						overflow: "hidden",
					}}
				>
					<img
						src={beneficiary.sectionsImageUrl[0]}
						alt={beneficiary.name}
						style={{
							position: "absolute",
							inset: 0,
							width: "100%",
							height: "100%",
							objectFit: "cover",
							objectPosition: "top",
							display: "block",
							filter: angel ? "grayscale(100%)" : "none",
						}}
					/>
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flexGrow: 1,
						padding: "16px 16px 18px",
						textAlign: "center",
						gap: 8,
					}}
				>
					<p
						className="highlight"
						style={{ fontSize: 20, margin: 0, lineHeight: 1.2 }}
					>
						{beneficiary.name}
					</p>

					{beneficiary.afterHeartTransplant && (
						<span
							style={{
								alignSelf: "center",
								background: "rgba(35,131,197,0.12)",
								color: "#2383C5",
								fontSize: 12,
								fontWeight: 700,
								padding: "4px 10px",
								borderRadius: 999,
								letterSpacing: 0.2,
							}}
						>
							po transplantacji serca
						</span>
					)}

					<p
						style={{
							color: "#616161",
							fontSize: 14,
							lineHeight: 1.4,
							margin: 0,
							flexGrow: 1,
						}}
					>
						{beneficiary.disorder}
					</p>

					<button
						onClick={(e) => {
							e.stopPropagation();
							handleButton();
						}}
						type="button"
						style={{
							width: "100%",
							height: 42,
							fontSize: 14,
							borderRadius: 12,
							marginTop: 6,
							...(angel
								? {
										background: "#fff",
										color: "#616161",
										border: "1px solid #ccc",
										fontWeight: 700,
									}
								: {}),
						}}
					>
						{angel ? "Wspomnienie" : "Poznaj historię"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default BeneficiaryCard;
