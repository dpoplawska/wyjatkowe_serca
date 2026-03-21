import { useState } from "react";
import "./css/Main.css";
import { TextField } from "@mui/material";
import { Button } from "react-scroll";
import Admin from "./Admin.tsx";


const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const [password, setPassword] = useState<string>("");
  const [showAdmin, setShowAdmin] = useState<boolean>(isDev);
  const handleButton = (newPassword: string) => {
    setShowAdmin(true);
  }

  return (
  <>
    {!showAdmin && (
        <section className="main">
            <div className="col-xs-12 col-lg-11" id="fundraiser-content">
            <div className="admin-panel">
        <h4>Panel administracyjny</h4>
        <TextField
          type="password"
          placeholder="Wpisz hasło"
          style={{padding:"2vw"}}
          value={password}
              onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button onClick={handleButton}>Wchodzę!</Button>
          </div>
      </section>

    ) }
      {(isDev || password.length > 0) && showAdmin && <Admin password={password} />}
        </>
  );
}