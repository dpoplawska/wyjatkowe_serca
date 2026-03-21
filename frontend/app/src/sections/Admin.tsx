import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./css/Main.css";

import { API } from '../app/config.ts';

interface TableData {
  id: string;
  paczkomat: boolean;
  name: string;
  modifiedAt: string;
  paczkomat_id: string | null;
  address: string;
  amount: number;
  email: string;
  status: string;
  phone: string;
  units: number;
}

interface PaymentData {
  id: string;
  email: string;
  amount: number;
  status: string;
  modifiedAt?: string;
  beneficiary?: string;
}

type AdminProps = {
  password: string;
}

type SortConfig<T> = {
  key: keyof T;
  direction: 'asc' | 'desc' | null;
};

function sortByKey<T>(data: T[], key: keyof T, direction: 'asc' | 'desc'): T[] {
  return [...data].sort((a, b) => {
    const aVal = a[key], bVal = b[key];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string')
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    if (typeof aVal === 'number' && typeof bVal === 'number')
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    return 0;
  });
}

function useSortedData<T extends object>(initial: T[], defaultSort: { key: keyof T; direction: 'asc' | 'desc' }) {
  const [data, setData] = useState<T[]>(() => sortByKey(initial, defaultSort.key, defaultSort.direction));
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({ key: defaultSort.key, direction: defaultSort.direction });

  useEffect(() => { setData(sortByKey(initial, defaultSort.key, defaultSort.direction)); }, [initial, defaultSort.key, defaultSort.direction]);

  const sortData = (key: keyof T) => {
    const direction: 'asc' | 'desc' =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';

    const sorted = sortByKey(data, key, direction);

    setSortConfig({ key, direction });
    setData(sorted);
  };

  return { data, setData, sortConfig, sortData };
}

function SortTh<T>({ col, label, sortConfig, onSort }: { col: keyof T; label: string; sortConfig: SortConfig<T>; onSort: (k: keyof T) => void }) {
  const [hovered, setHovered] = React.useState(false);
  const isActive = sortConfig.key === col && sortConfig.direction;
  return (
    <th
      onClick={() => onSort(col)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "8px 12px",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        background: hovered ? "#dbeafe" : isActive ? "#eff6ff" : "#f3f4f6",
        borderBottom: isActive ? "2px solid #2383C5" : "2px solid transparent",
        color: isActive ? "#2383C5" : "#2E2E2E",
        fontWeight: isActive ? "bold" : "600",
        transition: "background 0.1s",
      }}
    >
      {label}
      <span style={{ marginLeft: "6px", opacity: isActive ? 1 : 0.3, fontSize: "12px" }}>
        {isActive ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  );
}

export default function Admin({ password }: AdminProps) {
  const [activeTab, setActiveTab] = useState<'purchases' | 'payments'>('purchases');

  const [rawPurchases, setRawPurchases] = useState<TableData[]>([]);
  const [rawPayments, setRawPayments] = useState<PaymentData[]>([]);

  const [filterPurchaseStatus, setFilterPurchaseStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterBeneficiary, setFilterBeneficiary] = useState('');

  const purchases = useSortedData<TableData>(rawPurchases, { key: 'modifiedAt', direction: 'desc' });
  const payments = useSortedData<PaymentData>(rawPayments, { key: 'modifiedAt', direction: 'desc' });

  const uniquePurchaseStatuses = useMemo(() => Array.from(new Set(rawPurchases.map(r => r.status))), [rawPurchases]);
  const uniquePaymentStatuses = useMemo(() => Array.from(new Set(rawPayments.map(r => r.status))), [rawPayments]);
  const uniqueBeneficiaries = useMemo(() => Array.from(new Set(rawPayments.map(r => r.beneficiary ?? '(ogólna)'))).sort(), [rawPayments]);

  const fetchCollection = useCallback(async (path: string, setter: (data: any[]) => void) => {
    try {
      const res = await fetch(`${API}/${path}`, { headers: { 'x-password': password } });
      if (!res.ok) return;
      setter(await res.json());
    } catch { }
  }, [password]);

  useEffect(() => {
    fetchCollection('purchases', setRawPurchases);
    fetchCollection('payments/all', setRawPayments);
  }, [fetchCollection]);

  const filteredPurchases = useMemo(() =>
    filterPurchaseStatus ? purchases.data.filter(r => r.status === filterPurchaseStatus) : purchases.data,
    [purchases.data, filterPurchaseStatus]);

  const filteredPayments = useMemo(() =>
    payments.data
      .filter(r => !filterPaymentStatus || r.status === filterPaymentStatus)
      .filter(r => !filterBeneficiary || (r.beneficiary ?? '(ogólna)') === filterBeneficiary),
    [payments.data, filterPaymentStatus, filterBeneficiary]);

  const purchaseTotal = useMemo(() => filteredPurchases.filter(r => r.status === 'CONFIRMED').reduce((s, r) => s + r.amount, 0), [filteredPurchases]);
  const paymentTotal = useMemo(() => filteredPayments.filter(r => r.status === 'CONFIRMED').reduce((s, r) => s + r.amount, 0), [filteredPayments]);

  const noData = rawPurchases.length === 0 && rawPayments.length === 0;

  if (noData) {
    return (
      <section className="main">
        <div className="col-xs-12 col-lg-11" id="fundraiser-content">
          <div className="admin-panel">
            <h4>Brak danych do wyświetlenia lub błędne hasło.</h4>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="main">
      <div className="col-xs-12 col-lg-11" id="fundraiser-content">
        <div className="admin-panel">
          <h2>Panel administracyjny</h2>

          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            {([
              { key: 'purchases', label: `Sklep (${rawPurchases.length})` },
              { key: 'payments', label: `Wpłaty (${rawPayments.length})` },
            ] as { key: typeof activeTab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "8px 20px",
                  border: "2px solid #2383C5",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontFamily: "Quicksand",
                  fontWeight: "bold",
                  fontSize: "15px",
                  background: activeTab === key ? "#2383C5" : "white",
                  color: activeTab === key ? "white" : "#2383C5",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'purchases' && (
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <label className="mr-2 font-semibold">Filtruj po statusie:</label>
                <select
                  className="p-2 border rounded"
                  value={filterPurchaseStatus}
                  onChange={e => setFilterPurchaseStatus(e.target.value)}
                  style={{ margin: "10px" }}
                >
                  <option value="">Wszystkie</option>
                  {uniquePurchaseStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ marginLeft: "auto", fontWeight: "bold" }}>
                  Łącznie (CONFIRMED): {purchaseTotal} zł
                </span>
              </div>
              <table className="min-w-full border-collapse bg-white shadow-md">
                <thead>
                  <tr className="bg-gray-100">
                    {([
                      { col: 'name', label: 'Imię i nazwisko' },
                      { col: 'modifiedAt', label: 'Data modyfikacji' },
                      { col: 'address', label: 'Adres' },
                      { col: 'units', label: 'Ilość' },
                      { col: 'amount', label: 'Kwota' },
                      { col: 'email', label: 'E-mail' },
                      { col: 'phone', label: 'Telefon' },
                      { col: 'paczkomat', label: 'Paczkomat' },
                      { col: 'paczkomat_id', label: 'Kod paczkomatu' },
                      { col: 'status', label: 'Status' },
                    ] as { col: keyof TableData; label: string }[]).map(({ col, label }) => (
                      <SortTh key={col} col={col} label={label} sortConfig={purchases.sortConfig} onSort={purchases.sortData} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="border p-2">{row.name}</td>
                      <td className="border p-2">{row.modifiedAt?.split('T').join(' ').slice(0, -3)}</td>
                      <td className="border p-2">{row.address}</td>
                      <td className="border p-2">{row.units}</td>
                      <td className="border p-2">{row.amount} zł</td>
                      <td className="border p-2">{row.email}</td>
                      <td className="border p-2">{row.phone}</td>
                      <td className="border p-2">{row.paczkomat ? "Tak" : "Nie"}</td>
                      <td className="border p-2">{row.paczkomat_id ?? '-'}</td>
                      <td className="border p-2">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                <label className="font-semibold">Filtruj po statusie:</label>
                <select
                  className="p-2 border rounded"
                  value={filterPaymentStatus}
                  onChange={e => setFilterPaymentStatus(e.target.value)}
                >
                  <option value="">Wszystkie</option>
                  {uniquePaymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <label className="font-semibold">Podopieczny:</label>
                <select
                  className="p-2 border rounded"
                  value={filterBeneficiary}
                  onChange={e => setFilterBeneficiary(e.target.value)}
                >
                  <option value="">Wszyscy</option>
                  {uniqueBeneficiaries.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <span style={{ marginLeft: "auto", fontWeight: "bold" }}>
                  Łącznie (CONFIRMED): {paymentTotal} zł
                </span>
              </div>
              <table className="min-w-full border-collapse bg-white shadow-md">
                <thead>
                  <tr className="bg-gray-100">
                    {([
                      { col: 'beneficiary', label: 'Podopieczny' },
                      { col: 'email', label: 'E-mail' },
                      { col: 'amount', label: 'Kwota' },
                      { col: 'modifiedAt', label: 'Data' },
                      { col: 'status', label: 'Status' },
                    ] as { col: keyof PaymentData; label: string }[]).map(({ col, label }) => (
                      <SortTh key={col} col={col} label={label} sortConfig={payments.sortConfig} onSort={payments.sortData} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="border p-2">{row.beneficiary ?? <span style={{ color: '#999' }}>(ogólna)</span>}</td>
                      <td className="border p-2">{row.email}</td>
                      <td className="border p-2">{row.amount} zł</td>
                      <td className="border p-2">{row.modifiedAt?.split('T').join(' ').slice(0, -3) ?? '-'}</td>
                      <td className="border p-2">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
