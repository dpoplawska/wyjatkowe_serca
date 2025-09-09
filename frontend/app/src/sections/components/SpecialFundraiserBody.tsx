import HubertSzymborski from "./beneficiaries/HubertSzymborski.tsx";
import DanusiaGrzyb from "./beneficiaries/DanusiaGrzyb.tsx";
import FranciszekGrzyb from "./beneficiaries/FranciszekGrzyb.tsx";
import CyprianZawadzki from "./beneficiaries/CyprianZawadzki.tsx";
import CecyliaSuchocka from "./beneficiaries/CecyliaSuchocka.tsx";
import MikolajWegierski from "./beneficiaries/MikolajWegierski.tsx";
import NikodemKochel from "./beneficiaries/NikodemKochel.tsx";

type BeneficiaryProps = {
    beneficiary: string | undefined;
}

const SpecialFundraiserBody = ({beneficiary}: BeneficiaryProps) => {

let data;
switch (beneficiary) {
    case 'hubert_szymborski':
        data = <HubertSzymborski/>;
        break;
    case 'danusia_grzyb':
        data = <DanusiaGrzyb/>;
        break;
    case 'franciszek_grzyb':
        data = <FranciszekGrzyb/>;
        break;
    case 'cyprian_zawadzki':
        data = <CyprianZawadzki/>;
        break;
    case 'mikolaj_wegierski':
        data = <MikolajWegierski/>;
        break;
    case 'cecylia_suchocka':
        data = <CecyliaSuchocka/>;
        break;
    case 'nikodem_kochel':
        data = <NikodemKochel />;
        break;
    default:
        data = <div>Nieznany beneficjent</div>;
}

    return (
        <>
            {data}
        </>
    )
}

export default SpecialFundraiserBody;