// Helper function to check if a sphere/cylinder matches a range string
const checkRangeMatch = (sphere, cylinder, rangeString) => {
  const sph = parseFloat(sphere);
  const cyl = parseFloat(cylinder);

  if (rangeString.includes(" to ")) {
    const parts = rangeString.split(" to ");
    const sphLimit = parseFloat(parts[0]);
    const cylLimit = parseFloat(parts[1]);

    // Both negative
    if (sphLimit < 0 && cylLimit < 0) {
      if (sph === 0) {
        return cyl <= 0 && cyl >= cylLimit;
      }
      return sph <= 0 && sph >= sphLimit && cyl <= 0 && cyl >= cylLimit;
    }
    // Both positive
    if (sphLimit > 0 && cylLimit > 0) {
      if (sph === 0) {
        return cyl >= 0 && cyl <= cylLimit;
      }
      return sph >= 0 && sph <= sphLimit && cyl >= 0 && cyl <= cylLimit;
    }
    // Mixed sign (e.g., '+1.75 to -2.0')
    if (sphLimit > 0 && cylLimit < 0) {
      // Sph: 0 to sphLimit (positive), Cyl: 0 to cylLimit (negative)
      return sph >= 0 && sph <= sphLimit && cyl <= 0 && cyl >= cylLimit;
    }
    if (sphLimit < 0 && cylLimit > 0) {
      // Sph: 0 to sphLimit (negative), Cyl: 0 to cylLimit (positive)
      return sph <= 0 && sph >= sphLimit && cyl >= 0 && cyl <= cylLimit;
    }
    return false;
  }

  // Handle single sphere values
  if (rangeString.includes(" sph")) {
    const value = parseFloat(rangeString.replace(" sph", ""));
    return Math.abs(sph - value) <= 2.0;
  }

  // Handle ADD ranges
  if (rangeString.includes("/+ ADD") || /\/+\s*ADD/i.test(rangeString)) {
    // Parse base value before the '/' (e.g. '+3/+ ADD' -> '+3')
    const parts = rangeString.split("/");
    let basePart = parts[0] || rangeString;
    basePart = basePart.replace(/[+\s]/g, "");
    const baseValue = parseFloat(basePart);
    if (isNaN(baseValue)) return false;

    // Treat base as inclusive stepped range in 0.25 intervals from 0 to base (or base to 0 if negative)
    if (baseValue >= 0) {
      return sph >= 0 && sph <= baseValue;
    }
    return sph <= 0 && sph >= baseValue;
  }

  return false;
};
import React, { useState, useEffect } from "react";
import enterpriseData from "./enterpriseData";

const OpticalStoreApp = () => {
  const [prescription, setPrescription] = useState({
    sphere: "",
    cylinder: "",
    axis: "",
    add: "",
    type: "DV",
  });

  const [dvPrescription, setDvPrescription] = useState({
    sphere: "",
    cylinder: "",
    axis: "",
  });

  const [nvPrescription, setNvPrescription] = useState({
    sphere: "",
    cylinder: "",
    axis: "",
  });

  const [calculationMode, setCalculationMode] = useState("single");
  const [results, setResults] = useState(null);
  const [transposedValues, setTransposedValues] = useState(null);

  // Transpose formula with 0.25 interval validation
  const transpose = (sphere, cylinder, axis) => {
    const sph = parseFloat(sphere);
    const cyl = parseFloat(cylinder);
    const ax = parseFloat(axis) || 90;

    // Round to nearest 0.25 interval
    const roundToQuarter = (value) => {
      return Math.round(value * 4) / 4;
    };

    const newSphere = roundToQuarter(sph + cyl);
    const newCylinder = roundToQuarter(-cyl);
    let newAxis = ax;

    // Adjust axis by 90 degrees
    if (newAxis <= 90) {
      newAxis += 90;
    } else {
      newAxis -= 90;
    }

    return {
      sphere: newSphere.toFixed(2),
      cylinder: newCylinder.toFixed(2),
      axis: newAxis,
    };
  };

  // Find matching lens range based on ORIGINAL prescription values only
  const findLensRange = (sphere, cylinder, hasAddPower = false, axis = 90) => {
    const sph = parseFloat(sphere);
    const cyl = parseFloat(cylinder || 0);

    // Calculate transposed values for comparison
    const transposed = transpose(sphere, cylinder || 0, 90);
    const transposedSph = parseFloat(transposed.sphere);
    const transposedCyl = parseFloat(transposed.cylinder);

    // If this is an ADD power calculation, choose between CYL_KT (when cylinder present) or Bifocal KT
    if (hasAddPower) {
        // Explicit rules for ADD calculations per request:
        // - If sphere > 0 and cylinder == 0 => search ONLY in Bifocal KT
        // - If sphere == 0 and cylinder > 0 => search ONLY in CYL_KT

        // Case: sphere > 0 and zero cylinder => Bifocal KT only
        if (sph > 0 && (!cyl || Math.abs(cyl) === 0)) {
          let match = findInBifocalKT(sph, cyl);
          if (match) {
            return { range: match, type: "Bifocal KT (Original)", useOriginal: true };
          }
          match = findInBifocalKT(transposedSph, transposedCyl);
          if (match) {
            return { range: match, type: "Bifocal KT (Transposed)", useOriginal: false };
          }
          return null;
        }

        // Case: sphere == 0 and cylinder > 0 => CYL_KT only (axis-aware)
        if ((sph === 0 || Math.abs(sph) === 0) && cyl && Math.abs(cyl) > 0) {
          let match = findInCylKT(sph, cyl, axis);
          if (match) {
            return { range: match, type: "CYL KT (Original)", useOriginal: true };
          }
          match = findInCylKT(transposedSph, transposedCyl, axis);
          if (match) {
            return { range: match, type: "CYL KT (Transposed)", useOriginal: false };
          }
          return null;
        }

        // Fallback: previous behavior — if cylinder is non-zero prefer CYL_KT, otherwise Bifocal KT
        if (cyl && Math.abs(cyl) > 0) {
          let match = findInCylKT(sph, cyl, axis);
          if (match) {
            return { range: match, type: "CYL KT (Original)", useOriginal: true };
          }
          match = findInCylKT(transposedSph, transposedCyl, axis);
          if (match) {
            return { range: match, type: "CYL KT (Transposed)", useOriginal: false };
          }
        }

        // Otherwise try Bifocal KT
        let match = findInBifocalKT(sph, cyl);
        if (match) {
          return { range: match, type: "Bifocal KT (Original)", useOriginal: true };
        }
        match = findInBifocalKT(transposedSph, transposedCyl);
        if (match) {
          return { range: match, type: "Bifocal KT (Transposed)", useOriginal: false };
        }
        return null;
    }

    // Default behavior: search single vision categories in priority order
    const priorities = [
      { type: "Minus Comp", label: "Single Vision - Minus Comp" },
      { type: "Plus Comp", label: "Single Vision - Plus Comp" },
      { type: "SV Cross Comp", label: "Single Vision - SV Cross Comp" },
    ];

    for (const p of priorities) {
      let bestMatch = findInLensType(p.type, sph, cyl);
      if (bestMatch) {
        return {
          range: bestMatch,
          type: p.label + " (Original)",
          useOriginal: true,
        };
      }
      bestMatch = findInLensType(p.type, transposedSph, transposedCyl);
      if (bestMatch) {
        return {
          range: bestMatch,
          type: p.label + " (Transposed)",
          useOriginal: false,
        };
      }
    }

    return null;
  };

  // Helper function to find match in specific lens type (single vision categories)
  const findInLensType = (lensTypeName, sphere, cylinder) => {
    const sph = parseFloat(sphere);
    const cyl = parseFloat(cylinder);

    for (const range of enterpriseData.single_vision[lensTypeName]) {
      if (checkRangeMatch(sph, cyl, range.range)) {
        console.log(`Match found in ${lensTypeName}: ${range.range}`);
        return range;
      }
    }
    return null;
  };

  // Helper function to find match in Bifocal KT
  const findInBifocalKT = (sphere, cylinder) => {
    const sphRaw = parseFloat(sphere);
    const cyl = parseFloat(cylinder);

    if (isNaN(sphRaw)) return null;

    // Round to nearest 0.25 for matching
    const roundToQuarter = (v) => Math.round(v * 4) / 4;
    const sph = roundToQuarter(sphRaw);

    // Parse all bifocal ranges, compute base values and whether sph falls in their discrete range
    const candidates = [];
    const fallback = [];

    for (const range of enterpriseData["Bifocal KT"]) {
      // get base value before '/'
      const parts = range.range.split("/");
      let basePart = parts[0] || range.range;
      basePart = basePart.replace(/[+\s]/g, "");
      const baseValue = parseFloat(basePart);
      if (isNaN(baseValue)) continue;

      // Determine if sph (rounded) lies within inclusive stepped range [0..base] or [base..0]
      let inRange = false;
      if (baseValue >= 0) {
        inRange = sph >= 0 && sph <= baseValue;
      } else {
        inRange = sph <= 0 && sph >= baseValue;
      }

      // Only consider this range if the checkRangeMatch also thinks it's a match
      if (checkRangeMatch(sph, cyl, range.range)) {
        fallback.push({ range, baseValue });
      }

      if (inRange && checkRangeMatch(sph, cyl, range.range)) {
        candidates.push({ range, baseValue });
      }
    }

    // If we have exact-range candidates (sph within discrete base range), choose closest base (tie -> higher)
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const da = Math.abs(sph - a.baseValue);
        const db = Math.abs(sph - b.baseValue);
        if (da === db) return b.baseValue - a.baseValue;
        return da - db;
      });
      console.log(`Bifocal KT candidates (in discrete base range): ${candidates.map(c=>c.range.range).join(', ')}`);
      return candidates[0].range;
    }

    // Fallback: pick nearest base from any matching ranges
    if (fallback.length > 0) {
      fallback.sort((a, b) => {
        const da = Math.abs(sph - a.baseValue);
        const db = Math.abs(sph - b.baseValue);
        if (da === db) return b.baseValue - a.baseValue;
        return da - db;
      });
      console.log(`Bifocal KT fallback candidates: ${fallback.map(c=>c.range.range).join(', ')}`);
      return fallback[0].range;
    }

    return null;
  };

  // Helper function to find match in CYL_KT
  const findInCylKT = (sphere, cylinder, axis) => {
    const sph = parseFloat(sphere);
    const cyl = parseFloat(cylinder);
    const ax = parseInt(axis, 10) || 90;

    if (isNaN(cyl)) return null;

    // Normalize axis to 0-180
    const normalizeAxis = (a) => {
      let v = a % 180;
      if (v <= 0) v += 180;
      return v;
    };

    const targetAxis = normalizeAxis(ax);

    for (const range of enterpriseData["CYL_KT"]) {
      const r = range.range; // e.g. '+2, 180' or '-2, 180'
      // Split magnitude part and axis part
      const [magPart, axisPart] = r.split(" ").map((s) => s && s.trim());
      if (!magPart) continue;

      // parse magnitudes like '+2,-2' -> [2, -2]
      const mags = magPart.split(",").map((m) => parseFloat(m.replace(/[+]/g, "")));
      const absCyl = Math.abs(cyl);
      let magMatch = false;
      for (const m of mags) {
        if (Math.abs(m) === Math.abs(absCyl)) {
          magMatch = true;
          break;
        }
      }
      if (!magMatch) continue;

      if (!axisPart) continue;
      const axisCandidates = axisPart.split("/").map((s) => parseInt(s.replace(/[^0-9]/g, ""), 10)).filter(n => !isNaN(n));
      const normalizedAxes = axisCandidates.map(normalizeAxis);

      if (normalizedAxes.includes(targetAxis)) {
        return range;
      }
    }

    return null;
  };

  // Calculate prescription based on different cases
  const calculatePrescription = () => {
    if (calculationMode === "single") {
      handleSinglePrescription();
    } else if (calculationMode === "add-calculation") {
      handleAddCalculation();
    } else if (calculationMode === "nv-calculation") {
      handleNVCalculation();
    }
  };

  const handleSinglePrescription = () => {
    const { sphere, cylinder, axis } = prescription;

    if (!sphere || !cylinder || !axis) {
      alert("Please fill in all prescription values");
      return;
    }

    // Find range using ORIGINAL prescription only
    const originalRange = findLensRange(sphere, cylinder, false);

    // Calculate transposed values for reference only
    const transposed = transpose(sphere, cylinder, axis);
    setTransposedValues(transposed);

    setResults({
      original: { sphere, cylinder, axis },
      transposed: transposed,
      range: originalRange,
      prescriptionType: determinePrescriptionCase(sphere, cylinder),
    });
  };

  const handleAddCalculation = () => {
    const dvSph = parseFloat(dvPrescription.sphere);
    const nvSph = parseFloat(nvPrescription.sphere);

    if (isNaN(dvSph) || isNaN(nvSph)) {
      alert("Please fill in DV and NV sphere values");
      return;
    }

    // Case 5: ADD = NV - DV
    const addPower = (nvSph - dvSph).toFixed(2);

    // For ADD calculations, prioritize Bifocal KT
    const range = findLensRange(
      dvPrescription.sphere,
      dvPrescription.cylinder || "0",
      true,
      dvPrescription.axis || "90"
    );

    setResults({
      dv: dvPrescription,
      nv: nvPrescription,
      add: addPower,
      range: range ? { ...range, type: range.type || "Bifocal KT" } : null,
      prescriptionType: "Add Power Calculation",
    });
  };

  const handleNVCalculation = () => {
    const dvSph = parseFloat(dvPrescription.sphere);
    const addPower = parseFloat(prescription.add);

    if (isNaN(dvSph) || isNaN(addPower)) {
      alert("Please fill in DV sphere and ADD values");
      return;
    }

    // Case 7: NV = DV + ADD
    const nvSphere = (dvSph + addPower).toFixed(2);

    const calculatedNV = {
      sphere: nvSphere,
      cylinder: dvPrescription.cylinder || "0",
      axis: dvPrescription.axis || "90",
    };

    // For NV calculations, prioritize Bifocal KT
    const range = findLensRange(
      dvPrescription.sphere,
      dvPrescription.cylinder || "0",
      true,
      dvPrescription.axis || "90"
    );

    setResults({
      dv: dvPrescription,
      nv: calculatedNV,
      add: prescription.add,
      range: range ? { ...range, type: range.type || "Bifocal KT" } : null,
      prescriptionType: "Near Vision Calculation",
    });
  };

  const determinePrescriptionCase = (sphere, cylinder) => {
    const sph = parseFloat(sphere);
    const cyl = parseFloat(cylinder);

    if (cyl === 0) return "Zero Cylinder - Minus/Plus Comp";
    if (sph < 0 && cyl < 0) return "Both Negative - Minus Comp Priority";
    if (sph > 0 && cyl > 0) return "Both Positive - Plus Comp Priority";
    if ((sph < 0 && cyl > 0) || (sph > 0 && cyl < 0))
      return "Crossed Signs - SV Cross Comp";
    if (Math.abs(sph) > 4) return "Higher Power with Constraints";
    return "Basic Display Range";
  };

  const renderLensOptions = (range) => {
    if (!range || !range.range) return null;

    const lensData = range.range;
    const availableLenses = Object.entries(lensData).filter(
      ([key, value]) => key !== "range" && value !== undefined
    );

    return (
      <div className="mt-4">
        <h5 className="text-primary">Available Lenses ({range.type}):</h5>
        <div className="row">
          {availableLenses.map(([lensType, price]) => (
            <div key={lensType} className="col-md-4 mb-2">
              <div className="card">
                <div className="card-body text-center">
                  <h6 className="card-title">{lensType}</h6>
                  <p className="card-text text-success font-weight-bold">
                    ₹{price}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Custom Bootstrap-like styles */}
      <style>
        {`
          .container-fluid { padding: 0 15px; }
          .row { display: flex; flex-wrap: wrap; margin: 0 -15px; }
          .col-12 { flex: 0 0 100%; max-width: 100%; padding: 0 15px; }
          .col-md-3 { flex: 0 0 25%; max-width: 25%; padding: 0 15px; }
          .col-md-4 { flex: 0 0 33.333333%; max-width: 33.333333%; padding: 0 15px; }
          .col-md-6 { flex: 0 0 50%; max-width: 50%; padding: 0 15px; }
          .card { 
            border: 1px solid #dee2e6; 
            border-radius: 0.25rem; 
            margin-bottom: 1rem;
            box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
          }
          .card-header { 
            padding: 0.75rem 1.25rem; 
            background-color: #f8f9fa; 
            border-bottom: 1px solid #dee2e6;
            border-radius: 0.25rem 0.25rem 0 0;
          }
          .card-body { padding: 1.25rem; }
          .form-group { margin-bottom: 1rem; }
          .form-control { 
            display: block; 
            width: 100%; 
            padding: 0.375rem 0.75rem; 
            font-size: 1rem; 
            line-height: 1.5; 
            color: #495057; 
            background-color: #fff; 
            border: 1px solid #ced4da; 
            border-radius: 0.25rem; 
            box-sizing: border-box;
          }
          .btn { 
            display: inline-block; 
            font-weight: 400; 
            text-align: center; 
            white-space: nowrap; 
            vertical-align: middle; 
            padding: 0.375rem 0.75rem; 
            font-size: 1rem; 
            line-height: 1.5; 
            border-radius: 0.25rem; 
            border: 1px solid transparent; 
            cursor: pointer; 
            text-decoration: none;
          }
          .btn-primary { color: #fff; background-color: #007bff; border-color: #007bff; }
          .btn-success { color: #fff; background-color: #28a745; border-color: #28a745; }
          .btn-info { color: #fff; background-color: #17a2b8; border-color: #17a2b8; }
          .btn-outline-primary { color: #007bff; border-color: #007bff; background-color: transparent; }
          .btn-outline-success { color: #28a745; border-color: #28a745; background-color: transparent; }
          .btn-outline-info { color: #17a2b8; border-color: #17a2b8; background-color: transparent; }
          .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
          .btn-block { display: block; width: 100%; }
          .btn-group { position: relative; display: inline-flex; }
          .btn-group .btn { position: relative; flex: 1 1 auto; }
          .btn-group .btn.active { background-color: #007bff; color: white; }
          .bg-primary { background-color: #007bff !important; }
          .bg-success { background-color: #28a745 !important; }
          .bg-info { background-color: #17a2b8 !important; }
          .bg-warning { background-color: #ffc107 !important; }
          .bg-secondary { background-color: #6c757d !important; }
          .bg-dark { background-color: #343a40 !important; }
          .text-white { color: #fff !important; }
          .text-primary { color: #007bff !important; }
          .text-success { color: #28a745 !important; }
          .text-info { color: #17a2b8 !important; }
          .text-warning { color: #ffc107 !important; }
          .text-muted { color: #6c757d !important; }
          .border-primary { border-color: #007bff !important; }
          .border-success { border-color: #28a745 !important; }
          .border-info { border-color: #17a2b8 !important; }
          .alert { 
            padding: 0.75rem 1.25rem; 
            margin-bottom: 1rem; 
            border: 1px solid transparent; 
            border-radius: 0.25rem; 
          }
          .alert-info { color: #0c5460; background-color: #d1ecf1; border-color: #bee5eb; }
          .alert-warning { color: #856404; background-color: #fff3cd; border-color: #ffeaa7; }
          .alert-heading { margin-bottom: 0.5rem; }
          .font-weight-bold { font-weight: 700 !important; }
          .mb-0 { margin-bottom: 0 !important; }
          .mb-2 { margin-bottom: 0.5rem !important; }
          .mb-4 { margin-bottom: 1.5rem !important; }
          .mt-3 { margin-top: 1rem !important; }
          .mt-4 { margin-top: 1.5rem !important; }
          .mr-2 { margin-right: 0.5rem !important; }
          .py-4 { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
          .list-unstyled { padding-left: 0; list-style: none; }
          .small { font-size: 0.875em; }
          .shadow { box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important; }
          h2 { font-size: 2rem; margin-bottom: 0.5rem; }
          h4 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          h5 { font-size: 1.25rem; margin-bottom: 0.5rem; }
          h6 { font-size: 1rem; margin-bottom: 0.5rem; }
          label { display: inline-block; margin-bottom: 0.5rem; font-weight: 600; }
          input[type="radio"] { margin-right: 0.25rem; }
          @media (max-width: 768px) {
            .col-md-3, .col-md-4, .col-md-6 { 
              flex: 0 0 100%; 
              max-width: 100%; 
              margin-bottom: 1rem; 
            }
          }
        `}
      </style>
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h2 className="mb-0">
                  <i className="fas fa-eye mr-2"></i>
                  Optical Store - Lens Calculator & Prescription Manager
                </h2>
              </div>

              <div className="card-body">
                {/* Calculation Mode Selection */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5>Select Calculation Mode:</h5>
                    <div
                      className="btn-group btn-group-toggle"
                      data-toggle="buttons"
                    >
                      <label
                        className={`btn btn-outline-primary ${
                          calculationMode === "single" ? "active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="mode"
                          value="single"
                          checked={calculationMode === "single"}
                          onChange={(e) => setCalculationMode(e.target.value)}
                        />
                        Single Prescription
                      </label>
                      <label
                        className={`btn btn-outline-primary ${
                          calculationMode === "add-calculation" ? "active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="mode"
                          value="add-calculation"
                          checked={calculationMode === "add-calculation"}
                          onChange={(e) => setCalculationMode(e.target.value)}
                        />
                        ADD Power Calculation
                      </label>
                      <label
                        className={`btn btn-outline-primary ${
                          calculationMode === "nv-calculation" ? "active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="mode"
                          value="nv-calculation"
                          checked={calculationMode === "nv-calculation"}
                          onChange={(e) => setCalculationMode(e.target.value)}
                        />
                        Near Vision Calculation
                      </label>
                    </div>
                  </div>
                </div>

                {/* Input Forms */}
                {calculationMode === "single" && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header bg-info text-white">
                          <h5 className="mb-0">Prescription Input</h5>
                        </div>
                        <div className="card-body">
                          <div className="form-group">
                            <label>Sphere (Sph)</label>
                            <input
                              type="number"
                              step="0.25"
                              className="form-control"
                              value={prescription.sphere}
                              onChange={(e) =>
                                setPrescription({
                                  ...prescription,
                                  sphere: e.target.value,
                                })
                              }
                              placeholder="e.g., -0.25, +2.0"
                            />
                          </div>
                          <div className="form-group">
                            <label>Cylinder (Cyl)</label>
                            <input
                              type="number"
                              step="0.25"
                              className="form-control"
                              value={prescription.cylinder}
                              onChange={(e) =>
                                setPrescription({
                                  ...prescription,
                                  cylinder: e.target.value,
                                })
                              }
                              placeholder="e.g., -1.0, +1.25"
                            />
                          </div>
                          <div className="form-group">
                            <label>Axis</label>
                            <input
                              type="number"
                              min="1"
                              max="180"
                              className="form-control"
                              value={prescription.axis}
                              onChange={(e) =>
                                setPrescription({
                                  ...prescription,
                                  axis: e.target.value,
                                })
                              }
                              placeholder="1-180°"
                            />
                          </div>
                          <button
                            className="btn btn-primary btn-block"
                            onClick={calculatePrescription}
                          >
                            Calculate & Find Lenses
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {calculationMode === "add-calculation" && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header bg-success text-white">
                          <h5 className="mb-0">Distance Vision (DV)</h5>
                        </div>
                        <div className="card-body">
                          <div className="form-group">
                            <label>Sphere</label>
                            <input
                              type="number"
                              step="0.25"
                              className="form-control"
                              value={dvPrescription.sphere}
                              onChange={(e) =>
                                setDvPrescription({
                                  ...dvPrescription,
                                  sphere: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Cylinder</label>
                            <input
                              type="number"
                              step="0.25"
                              className="form-control"
                              value={dvPrescription.cylinder}
                              onChange={(e) =>
                                setDvPrescription({
                                  ...dvPrescription,
                                  cylinder: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Axis</label>
                            <input
                              type="number"
                              min="1"
                              max="180"
                              className="form-control"
                              value={dvPrescription.axis}
                              onChange={(e) =>
                                setDvPrescription({
                                  ...dvPrescription,
                                  axis: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header bg-warning text-white">
                          <h5 className="mb-0">Near Vision (NV)</h5>
                        </div>
                        <div className="card-body">
                          <div className="form-group">
                            <label>Sphere</label>
                            <input
                              type="number"
                              step="0.25"
                              className="form-control"
                              value={nvPrescription.sphere}
                              onChange={(e) =>
                                setNvPrescription({
                                  ...nvPrescription,
                                  sphere: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Cylinder</label>
                            <input
                              type="number"
                              step="0.25"
                              className="form-control"
                              value={nvPrescription.cylinder}
                              onChange={(e) =>
                                setNvPrescription({
                                  ...nvPrescription,
                                  cylinder: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Axis</label>
                            <input
                              type="number"
                              min="1"
                              max="180"
                              className="form-control"
                              value={nvPrescription.axis}
                              onChange={(e) =>
                                setNvPrescription({
                                  ...nvPrescription,
                                  axis: e.target.value,
                                })
                              }
                            />
                          </div>
                          <button
                            className="btn btn-success btn-block"
                            onClick={calculatePrescription}
                          >
                            Calculate ADD Power
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {calculationMode === "nv-calculation" && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header bg-success text-white">
                          <h5 className="mb-0">Distance Vision (DV)</h5>
                        </div>
                        <div className="card-body">
                          <div className="form-group">
                            <label>Sphere</label>
                            <input
                              type="number"
                              step="0.25"
                              className="form-control"
                              value={dvPrescription.sphere}
                              onChange={(e) =>
                                setDvPrescription({
                                  ...dvPrescription,
                                  sphere: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Cylinder</label>
                            <input
                              type="number"
                              step="0.25"
                              className="form-control"
                              value={dvPrescription.cylinder}
                              onChange={(e) =>
                                setDvPrescription({
                                  ...dvPrescription,
                                  cylinder: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Axis</label>
                            <input
                              type="number"
                              min="1"
                              max="180"
                              className="form-control"
                              value={dvPrescription.axis}
                              onChange={(e) =>
                                setDvPrescription({
                                  ...dvPrescription,
                                  axis: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header bg-info text-white">
                          <h5 className="mb-0">ADD Power</h5>
                        </div>
                        <div className="card-body">
                          <div className="form-group">
                            <label>ADD Value</label>
                            <input
                              type="number"
                              step="0.25"
                              className="form-control"
                              value={prescription.add}
                              onChange={(e) =>
                                setPrescription({
                                  ...prescription,
                                  add: e.target.value,
                                })
                              }
                              placeholder="e.g., +1.25, +2.0"
                            />
                          </div>
                          <button
                            className="btn btn-info btn-block mt-4"
                            onClick={calculatePrescription}
                          >
                            Calculate Near Vision
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Section */}
                {results && (
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="card border-success">
                        <div className="card-header bg-success text-white">
                          <h4 className="mb-0">Prescription Results</h4>
                        </div>
                        <div className="card-body">
                          {/* Display prescription details */}
                          {results.original && (
                            <div className="row">
                              <div className="col-md-6">
                                <h6 className="text-primary">
                                  Original Prescription (Used for Range):
                                </h6>
                                <p>
                                  Sphere: {results.original.sphere}, Cylinder:{" "}
                                  {results.original.cylinder}, Axis:{" "}
                                  {results.original.axis}°
                                </p>
                                <p>
                                  <strong>Case Type:</strong>{" "}
                                  {results.prescriptionType}
                                </p>
                              </div>
                              {results.transposed && (
                                <div className="col-md-6">
                                  <h6 className="text-info">
                                    Transposed Values (Reference Only):
                                  </h6>
                                  <p>
                                    Sphere: {results.transposed.sphere},
                                    Cylinder: {results.transposed.cylinder},
                                    Axis: {results.transposed.axis}°
                                  </p>
                                  <p>
                                    <small className="text-muted">
                                      Transposed values shown for reference
                                      only. Range matching uses original values.
                                    </small>
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Display ADD calculations */}
                          {results.dv && (
                            <div className="row">
                              <div className="col-md-4">
                                <h6 className="text-success">
                                  Distance Vision (DV):
                                </h6>
                                <p>Sphere: {results.dv.sphere}</p>
                                {results.dv.cylinder && (
                                  <p>Cylinder: {results.dv.cylinder}</p>
                                )}
                                {results.dv.axis && (
                                  <p>Axis: {results.dv.axis}°</p>
                                )}
                              </div>
                              <div className="col-md-4">
                                <h6 className="text-warning">
                                  Near Vision (NV):
                                </h6>
                                <p>Sphere: {results.nv.sphere}</p>
                                {results.nv.cylinder && (
                                  <p>Cylinder: {results.nv.cylinder}</p>
                                )}
                                {results.nv.axis && (
                                  <p>Axis: {results.nv.axis}°</p>
                                )}
                              </div>
                              <div className="col-md-4">
                                <h6 className="text-info">ADD Power:</h6>
                                <p className="font-weight-bold text-primary">
                                  +{results.add}
                                </p>
                                <p>
                                  <strong>Type:</strong>{" "}
                                  {results.prescriptionType}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Display lens range and options */}
                          {results.range && (
                            <div className="mt-4">
                              <div className="alert alert-info">
                                <h6 className="alert-heading">
                                  <i className="fas fa-info-circle mr-2"></i>
                                  Recommended Range: {results.range.range.range}
                                </h6>
                                <p className="mb-0">
                                  Brand: {enterpriseData.brand} | Type:{" "}
                                  {results.range.type}
                                </p>
                              </div>
                              {renderLensOptions(results.range)}
                            </div>
                          )}

                          {!results.range && (
                            <div className="alert alert-warning mt-4">
                              <h6 className="alert-heading">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                No Matching Range Found
                              </h6>
                              <p className="mb-0">
                                The prescription values don't match any
                                available lens ranges. Please check the values
                                or contact lens manufacturer.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Information Panel */}
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header bg-secondary text-white">
                        <h5 className="mb-0">
                          <i className="fas fa-info-circle mr-2"></i>
                          Updated Priority Logic & Rules
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <h6 className="text-primary">
                              Priority Order (Using Original Values Only):
                            </h6>
                            <ul className="list-unstyled">
                              <li>
                                <strong>1. ADD Power:</strong> If ADD/NV/DV →
                                Bifocal KT first
                              </li>
                              <li>
                                <strong>2. Zero Cylinder:</strong> Negative →
                                Minus Comp, Positive → Plus Comp
                              </li>
                              <li>
                                <strong>3. Same Signs (-, -):</strong> → Minus
                                Comp (Single Vision)
                              </li>
                              <li>
                                <strong>4. Same Signs (+, +):</strong> → Plus
                                Comp (Single Vision)
                              </li>
                              <li>
                                <strong>5. Cross Signs:</strong> → SV Cross Comp
                                (if transposed also crossed)
                              </li>
                              <li>
                                <strong>6. Fallback:</strong> Try all categories
                                with original values
                              </li>
                            </ul>
                          </div>
                          <div className="col-md-6">
                            <h6 className="text-success">
                              Updated Data Structure:
                            </h6>
                            <ul className="list-unstyled">
                              <li>
                                <strong>Single Vision:</strong>
                              </li>
                              <li>
                                &nbsp;&nbsp;- Minus Comp (negative
                                prescriptions)
                              </li>
                              <li>
                                &nbsp;&nbsp;- Plus Comp (positive prescriptions)
                              </li>
                              <li>
                                &nbsp;&nbsp;- SV Cross Comp (crossed signs)
                              </li>
                              <li>
                                <strong>Bifocal KT:</strong> For ADD power
                                prescriptions
                              </li>
                              <li>
                                <strong>Range Display:</strong> Shows as "Single
                                Vision - [Type]"
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Calculations Panel */}
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header bg-dark text-white">
                        <h5 className="mb-0">
                          <i className="fas fa-calculator mr-2"></i>
                          Updated Examples
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-4">
                            <div className="card border-primary">
                              <div className="card-header bg-primary text-white">
                                <h6 className="mb-0">Minus Comp Example</h6>
                              </div>
                              <div className="card-body">
                                <p>
                                  <strong>Input:</strong> Sph -2.5, Cyl -1.0,
                                  Axis 90°
                                </p>
                                <p>
                                  <strong>Expected:</strong> Single Vision -
                                  Minus Comp
                                </p>
                                <p>
                                  <strong>Rule:</strong> Both negative signs
                                </p>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    setPrescription({
                                      sphere: "-2.5",
                                      cylinder: "-1.0",
                                      axis: "90",
                                      add: "",
                                      type: "DV",
                                    });
                                    setCalculationMode("single");
                                  }}
                                >
                                  Try This Example
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="card border-success">
                              <div className="card-header bg-success text-white">
                                <h6 className="mb-0">Plus Comp Example</h6>
                              </div>
                              <div className="card-body">
                                <p>
                                  <strong>Input:</strong> Sph +2.5, Cyl +1.5,
                                  Axis 180°
                                </p>
                                <p>
                                  <strong>Expected:</strong> Single Vision -
                                  Plus Comp
                                </p>
                                <p>
                                  <strong>Rule:</strong> Both positive signs
                                </p>
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => {
                                    setPrescription({
                                      sphere: "2.5",
                                      cylinder: "1.5",
                                      axis: "180",
                                      add: "",
                                      type: "DV",
                                    });
                                    setCalculationMode("single");
                                  }}
                                >
                                  Try This Example
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="card border-info">
                              <div className="card-header bg-info text-white">
                                <h6 className="mb-0">SV Cross Comp Example</h6>
                              </div>
                              <div className="card-body">
                                <p>
                                  <strong>Input:</strong> Sph +1.0, Cyl -1.5,
                                  Axis 90°
                                </p>
                                <p>
                                  <strong>Expected:</strong> Single Vision - SV
                                  Cross Comp
                                </p>
                                <p>
                                  <strong>Rule:</strong> Crossed signs (+/-)
                                </p>
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => {
                                    setPrescription({
                                      sphere: "1.0",
                                      cylinder: "-1.5",
                                      axis: "90",
                                      add: "",
                                      type: "DV",
                                    });
                                    setCalculationMode("single");
                                  }}
                                >
                                  Try This Example
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticalStoreApp;
