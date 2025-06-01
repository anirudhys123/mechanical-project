// Fully parameterized: User-provided viscosities, densities, conductivities, Pr for hot & cold fluids
import React, { useState } from "react";
import { Table, Button, Row, Col } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function HeatExchangerForm() {
  const A = 0.278;
  const di = 0.02864;
  const Di = 0.0747;
  const L = 2.08;
  const do_inner = 0.04266;
  const Dh = Di - do_inner;

  const [readings, setReadings] = useState([
   {
      mh: 0.3051, mc: 0.19, Th_in: 64, Th_out: 61, Tc_in: 31, Tc_out: 34.5, cph: 4187,cpc: 4150,
      mu_h: 0.001, rho_h: 985, k_h: 0.6513, pr_h: 3.02,
      mu_c: 0.000515, rho_c: 1000.8, k_c: 0.72, pr_c: 4.75

    },
    {
      mh: 0.3051, mc: 0.21, Th_in: 66, Th_out: 63, Tc_in: 34, Tc_out: 37.5, cph: 4187, cpc: 4150,
      mu_h: 0.001, rho_h: 985, k_h: 0.6513, pr_h: 3.02,
      mu_c: 0.000550, rho_c: 1000.8, k_c: 0.72, pr_c: 4.95

    },
    {
      mh: 0.3051, mc: 0.23, Th_in: 65, Th_out: 62, Tc_in: 35, Tc_out: 39 , cph: 4187, cpc: 4150,
      mu_h: 0.001, rho_h: 985, k_h: 0.6513, pr_h: 3.02,
      mu_c: 0.000560, rho_c: 1000.8, k_c: 0.72, pr_c: 4.95

    }
      
  ]);

    const [results, setResults] = useState([]);

    const calculate = () => {
      const newResults = readings.map((r) => {
        const Qh = r.mh * r.cph * (r.Th_in - r.Th_out);
        const Qc = r.mc * r.cpc * (r.Tc_out - r.Tc_in);
        const Q = (Qh + Qc) / 2;
  
        const deltaT1 = r.Th_in - r.Tc_out;
        const deltaT2 = r.Th_out - r.Tc_in;
        const LMTD = Math.abs(deltaT1 - deltaT2) < 1e-6 ? deltaT1 : (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
        const U = Q / (A * LMTD);
  
        const Re_h = (4 * r.mh) / (Math.PI * di * r.mu_h);
        let Nu_h;
        if (Re_h < 2300) {
          Nu_h = 3.66;
        } else if (Re_h > 2300 && Re_h <= 4000) {
          Nu_h = 0.116 * Math.pow(Re_h, 0.67) * Math.pow(r.pr_h, 0.4);
        } else {
          Nu_h = 0.023 * Math.pow(Re_h, 0.8) * Math.pow(r.pr_h, 0.4);
        }
  
        let f_h;
        if (Re_h < 2300) {
          f_h = 64 / Re_h;
        } else if (Re_h > 2300 && Re_h <= 4000) {
          const f_laminar = 64 / 2300;
          const f_turbulent = 0.25 / Math.pow((1.82 * Math.log10(4000) - 1.64), 2);
          f_h = f_laminar + ((Re_h - 2300) / (4000 - 2300)) * (f_turbulent - f_laminar);
        } else {
          f_h = 0.25 / Math.pow((1.82 * Math.log10(Re_h) - 1.64), 2);
        }
  
        
      const A_h = Math.PI * Math.pow(di, 2) / 4;
      const v_h = r.mh / (r.rho_h * A_h);
      const dp_h = (r.rho_h * f_h * L * Math.pow(v_h, 2)) / (2 * di);
  
        const Ac = (Math.PI / 4) * (Math.pow(Di, 2) - Math.pow(do_inner, 2));
        const Vc = r.mc / (r.rho_c * Ac);
        const Re_c = (r.rho_c * Vc * Dh) / r.mu_c;
  
        let Nu_c;
        if (Re_c < 2300) {
          Nu_c = 3.66;
        } else if (Re_c > 2300 && Re_c <= 4000) {
          Nu_c = 0.116 * Math.pow(Re_c, 0.67) * Math.pow(r.pr_c, 0.4);
        } else {
          Nu_c = 0.023 * Math.pow(Re_c, 0.8) * Math.pow(r.pr_c, 0.4);
        }
  
        const hc = (Nu_c * r.k_c) / Dh;
  
        let f_c;
        if (Re_c < 2300) {
          f_c = 64 / Re_c;
        } else if (Re_c > 2300 && Re_c <= 4000) {
          const f_laminar = 64 / 2300;
          const f_turbulent = 0.25 / Math.pow((1.82 * Math.log10(4000) - 1.64), 2);
          f_c = f_laminar + ((Re_c - 2300) / (4000 - 2300)) * (f_turbulent - f_laminar);
        } else {
          f_c = 0.25 / Math.pow((1.82 * Math.log10(Re_c) - 1.64), 2);
        }
   const A_c = Math.PI * (Math.pow(Di, 2) - Math.pow(do_inner, 2)) / 4; // Annulus area
      const v_c = r.mc / (r.rho_c * A_c); // Velocity in annulus
      const dp_c = (r.rho_c * f_c * L * Math.pow(v_c, 2)) / (2 * Dh); // Pressure drop


        const dp_total = dp_h + dp_c;
  
        return { ...r, Qh, Qc, Q, deltaT1, deltaT2, LMTD, U, Re_h, Nu_h, dp_h, Re_c, Nu_c, hc, f_c, dp_c, dp_total };
      });
  
      setResults(newResults);
    };

  const chartDataVsMc = (label, key, color) => ({
    labels: results.map(r => r.mc.toFixed(3) + " kg/s"),
    datasets: [
      {
        label,
        data: results.map(r => r[key]),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 5
      }
    ]
  });

  const chartOptions = (label) => ({
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: {
        display: true,
        text: label,
        font: { size: 18 }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'ṁ𝒸 (kg/s)',
          font: { size: 16 }
        }
      },
      y: {
        title: {
          display: true,
          text: label,
          font: { size: 16 }
        }
      }
    }
  });

  return (
    <div style={{ padding: '2rem' }}>
      <h2 className="text-center mb-4">Double Pipe Heat Exchanger Analysis(CuO NanoFluid)</h2>
      

      <h4>Input Parameters</h4>
      <Table striped bordered responsive>
        <thead className="table-dark text-center">
          <tr>
            <th>Parameter</th>
            {readings.map((_, idx) => <th key={idx}>Reading {idx + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {['mh', 'mc', 'Th_in', 'Th_out', 'Tc_in', 'Tc_out'].map((param, i) => (

            <tr key={i}>
              <td className="fw-bold text-center">{param}</td>
              {readings.map((r, idx) => (
                <td key={idx}>
                  <input
                    type="number"
                    value={r[param] || ''}
                    onChange={(e) => {
                      const newReadings = [...readings];
                      newReadings[idx][param] = parseFloat(e.target.value);
                      setReadings(newReadings);
                    }}
                    className="form-control"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      <h4 className="mt-4">Fixed Geometry Parameters</h4>
      <Table striped bordered responsive>
        <tbody className="text-center">
          <tr><td><strong>Heat Transfer Area (A)</strong></td><td>0.278 m²</td></tr>
          <tr><td><strong>Inner Pipe Area (di)</strong></td><td>0.0006447 m²</td></tr>
          <tr><td><strong>Annulus Area (Ac)</strong></td><td>0.002953 m²</td></tr>
        </tbody>
      </Table>

      <Button variant="primary" onClick={calculate} className="mb-4">Compute</Button>

      {results.length > 0 && (
        <>
          <h4>Results Table</h4>
          <Table striped bordered responsive>
            <thead className="table-dark text-center">
              <tr>
                <th>ṁₕ</th><th>ṁ𝒸</th><th>Qₕ</th><th>Q𝒸</th><th>Qavg</th><th>ΔT₁</th><th>ΔT₂</th><th>LMTD</th><th>U</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="text-center">
                  <td>{r.mh}</td><td>{r.mc}</td><td>{r.Qh.toFixed(2)}</td><td>{r.Qc.toFixed(2)}</td>
                  <td>{r.Q.toFixed(2)}</td><td>{r.deltaT1.toFixed(2)}</td><td>{r.deltaT2.toFixed(2)}</td>
                  <td>{r.LMTD.toFixed(2)}</td><td>{r.U.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <h4 className="mt-4">Flow Parameters</h4>
                    <Table striped bordered responsive>
            <thead className="table-dark text-center">
              <tr>
                <th>Reₕ</th><th>Nuₕ</th><th>ΔPₕ</th>
                <th>Re𝒸</th><th>Nu𝒸</th><th>h𝒸</th><th>f𝒸</th><th>ΔP𝒸</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="text-center">
                  <td>{r.Re_h.toFixed(2)}</td>
                  <td>{r.Nu_h.toFixed(2)}</td>
                  <td>{r.dp_h.toFixed(2)}</td>
                  <td>{r.Re_c.toFixed(2)}</td>
                  <td>{r.Nu_c.toFixed(2)}</td>
                  <td>{r.hc.toFixed(2)}</td>
                  <td>{r.f_c.toFixed(4)}</td>
                 <td>{(r.dp_c * 10).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <h4 className="mt-4">Graphs</h4>
          <Row>
            <Col md={6}><Line data={chartDataVsMc("Qavg (W)", "Q", "blue")} options={chartOptions("Qavg vs ṁ𝒸")} /></Col>
            <Col md={6}><Line data={chartDataVsMc("U (W/m²·K)", "U", "green")} options={chartOptions("U vs ṁ𝒸")} /></Col>
            <Col md={6}><Line data={chartDataVsMc("ΔP Total (Pa)", "dp_total", "red")} options={chartOptions("ΔP vs ṁ𝒸")} /></Col>
          </Row>
        </>
      )}
    </div>
  );
}