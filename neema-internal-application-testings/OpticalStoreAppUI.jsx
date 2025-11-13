import React, { useState } from "react";

const OpticalStoreAppUI = () => {
  // UI state only for controlled inputs
  const [calculationMode, setCalculationMode] = useState("single");
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

  // Dummy placeholders for rendering (no logic)
  const results = null;

  // Dummy renderLensOptions (returns null, since no logic/data)
  const renderLensOptions = () => null;

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
          .form-row { display: flex; flex-wrap: wrap; margin: 0 -15px; box-sizing: border-box; }
          .form-row .form-group { flex: 0 0 33.333333%; max-width: 33.333333%; padding: 0 15px; margin-bottom: 1rem; box-sizing: border-box; }
          .form-row .form-group label { display: block; margin-bottom: 0.5rem; }
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
                  NEEMA Opticals Store - Lens Finder & Prescription Manager
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
                        className={`btn btn-outline-primary ${calculationMode === "single" ? "active" : ""}`}
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
                        className={`btn btn-outline-primary ${calculationMode === "add-calculation" ? "active" : ""}`}
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
                        className={`btn btn-outline-primary ${calculationMode === "nv-calculation" ? "active" : ""}`}
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
                          <div className="form-row">
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
                          </div>
                          <button
                            className="btn btn-primary btn-block"
                            // No logic
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
                            // No logic
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
                            // No logic
                          >
                            Calculate Near Vision
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Section (hidden, placeholder only) */}
                {results && (
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="card border-success">
                        <div className="card-header bg-success text-white">
                          <h4 className="mb-0">Prescription Results</h4>
                        </div>
                        <div className="card-body">{/* ...omitted... */}</div>
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
                {/* End UI */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticalStoreAppUI;