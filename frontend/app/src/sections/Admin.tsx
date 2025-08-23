import React, { useEffect, useState } from "react";
import "./css/Main.css";

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

type AdminProps = {
  password: string;
}

export default function Admin({password}: AdminProps) {
  const [data, setData] = useState<TableData[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{
        key: keyof TableData;
        direction: 'asc' | 'desc' | null;
      }>({ key: 'id', direction: null });
  const [filterStatus, setFilterStatus] = React.useState<string>('');
  const uniqueStatuses = Array.from(new Set(data.map((item) => item.status)));

  const sortData = (key: keyof TableData) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
        }

        const sortedData = [...data].sort((a, b) => {
          const aValue = a[key];
          const bValue = b[key];

          if (aValue === null || aValue === undefined) return 1;
          if (bValue === null || bValue === undefined) return -1;

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
          }
          if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
            return direction === 'asc'
              ? aValue === bValue
                ? 0
                : aValue
                ? -1
                : 1
              : aValue === bValue
              ? 0
              : aValue
              ? 1
              : -1;
          }
          return 0;
        });

        setSortConfig({ key, direction });
        setData(sortedData);
  };

  const filteredData = filterStatus
  ? data.filter((row) => row.status === filterStatus)
  : data;

  const getData = async () => {
    try {
            const response = fetch("https://wyjatkowe-serca-38835307240.europe-central2.run.app/purchases", {
            headers: {
                'x-password': password
            }
        })
              .then((response) => {
                  if (!response.ok) {
                      throw new Error("Network response was not ok");
                }
                return response.json();
              })
              .then((data) => {
                   console.log(data)
                  setData(data);
              })
              .catch((error) => {
                  console.error("There was a problem with the fetch operation:", error);
              });
      } catch (error) {
          console.error("Error:", error);
      }
  };

  useEffect(() => {
      getData();
  }, [password]);

  return (
    <>
      {data.length === 0 ? (        <section className="main">
        <div className="col-xs-12 col-lg-11" id="fundraiser-content">
          <div className="admin-panel">
          </div>
          <h4>Brak danych do wyświetlenia lub błędne hasło.</h4>
        </div>
      </section>
      ) : (
          <section className="main">
            <div className="col-xs-12 col-lg-11" id="fundraiser-content">
              <div className="admin-panel">
                <h2>Panel administracyjny sklepu</h2>
     <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <label className="mr-2 font-semibold">Filtruj po statusie:</label>
            <select
              className="p-2 border rounded"
              value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ margin: "10px"}}
            >
              <option value="">Wszystkie</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <table className="min-w-full border-collapse bg-white shadow-md">
              <thead>
                <tr className="bg-gray-100">
                  {[
                    { key: 'name', label: 'Imię i nazwisko' },
                    { key: 'modifiedAt', label: 'Data modyfikacji' },
                    { key: 'address', label: 'Adres' },
                    { key: 'units', label: 'Ilość' },
                    { key: 'amount', label: 'Kwota' },
                    { key: 'email', label: 'E-mail' },
                    { key: 'phone', label: 'Telefon' },
                    { key: 'paczkomat', label: 'Paczkomat' },
                    { key: 'paczkomat_id', label: 'Kod paczkomatu' },
                            { key: 'status', label: 'Status' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="border p-2 text-left cursor-pointer hover:bg-gray-200"
                      onClick={() => sortData(key as keyof TableData)}
                    >
                      {label}
                      {sortConfig.key === key && sortConfig.direction && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border p-2">{row.name}</td>
                    <td className="border p-2">{row.modifiedAt.split('T').join(' ').slice(0, -3)}</td>
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
        </div>
          </div>
        </div>
        </section>
            )}
      </>
  );
}