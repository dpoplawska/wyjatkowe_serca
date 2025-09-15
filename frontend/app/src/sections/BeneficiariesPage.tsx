import "./css/Main.css";
import HelpUsSide from "./HelpUsSide.tsx";
import SocialsSide from "./SocialsSide.tsx";
import BeneficiaryCard from "./components/BeneficiaryCard.tsx";
import { beneficiaries } from "./components/beneficiaries/BeneficiariesData.tsx";
import { useState } from 'react';

export default function BeneficiariesPage() {
  const [searchName, setSearchName] = useState('');
  const [filterDisorder, setFilterDisorder] = useState('');

  // Assuming each beneficiary has 'name' and 'disorder' properties; adjust if different
  const disorders = [...new Set(beneficiaries.map(b => b.disorder).filter(d => d))];
  const names = [...new Set(beneficiaries.map(b => b.name).filter(n => n))];

  const filteredBeneficiaries = beneficiaries
    .filter(b => !searchName || b.name.toLowerCase().includes(searchName.toLowerCase()))
    .filter(b => !filterDisorder || b.disorder.toLowerCase().includes(filterDisorder.toLowerCase()));

  return (
    <section className="main">
      <div className="col-xs-12 col-lg-2" id="left-side">
        <HelpUsSide showFundraiserBar={true} specialFundraiser={false} />
      </div>
      <div className="col-xs-12 col-lg-7" id="fundraiser-content">
        <div className="header" style={{ justifyContent: "center" }}>
          Nasi podopieczni
        </div>
        <div className="filters container py-3">
          <div className="row justify-content-center">
            <div className="col-md-5 mb-2 mb-md-0">
              <input
                list="names-list"
                type="text"
                className="form-control"
                placeholder="Szukaj po imieniu"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <datalist id="names-list">
                {names.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div className="col-md-5">
              <input
                list="disorders-list"
                type="text"
                className="form-control"
                placeholder="Szukaj po schorzeniu"
                value={filterDisorder}
                onChange={(e) => setFilterDisorder(e.target.value)}
              />
              <datalist id="disorders-list">
                {disorders.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>
        </div>
        <div className="album py-4">
          <div className="container">
            <div className="row">
              {filteredBeneficiaries.map((b) => (
                <BeneficiaryCard key={b.id || b.name} beneficiary={b} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="col-xs-12 col-lg-2" id="right-side">
        <SocialsSide />
      </div>
    </section>
  );
}