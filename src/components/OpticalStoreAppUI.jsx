import React, { useState, useEffect } from "react";
import { availableBrands, loadBrandData } from '../utils/brandDataLoader';
import { findLensOptions, findAddPowerOptions, findNearVisionOptions, findCylKTOptions, findCompKTOptions, findProgressiveCylOptions, findProgressiveCompOptions, validateQuarterInterval, findCrizalLensOptions, findCrizalRxOptions } from '../utils/prescriptionCalculations';
import { findCrizalBifocalOptions } from '../utils/crizalBifocalCalculations';

const OpticalStoreAppUI = () => {
  // Brand selection state
  const [selectedBrand, setSelectedBrand] = useState("enterprise");
  const [brandData, setBrandData] = useState(null);
  const [isLoadingBrand, setIsLoadingBrand] = useState(true);

  // Calculation mode state
  const [calculationMode, setCalculationMode] = useState("single");

  // Single prescription state
  const [prescription, setPrescription] = useState({
    sphere: "",
    cylinder: "",
    axis: "",
  });

  // ADD calculation state
  const [addCalculation, setAddCalculation] = useState({
    distanceVision: { sphere: "", cylinder: "", axis: "" },
    nearVision: { sphere: "", cylinder: "", axis: "" },
    addPower: ""
  });

  // Near Vision calculation state
  const [nearVisionCalculation, setNearVisionCalculation] = useState({
    distanceVision: { sphere: "", cylinder: "", axis: "" },
    nearVision: { sphere: "", cylinder: "", axis: "" },
    addPower: ""
  });

  // Calculation results state
  const [calculationResults, setCalculationResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);

  // Modal state for lens details
  const [showModal, setShowModal] = useState(false);
  const [selectedLensDetails, setSelectedLensDetails] = useState(null);

  // State for showing RX options when FSV is displayed
  const [showRxOptions, setShowRxOptions] = useState(false);
  const [rxCalculationResults, setRxCalculationResults] = useState(null);

  // State for FSV type filter (FSV_STOCK_LENS, FSV_OTHER_RANGE, or RX_SINGLE_VISION)
  const [fsvTypeFilter, setFsvTypeFilter] = useState('FSV_STOCK_LENS');

  // State for lens type visibility checkboxes (radio button behavior)
  const [selectedLensType, setSelectedLensType] = useState('white');

  // Computed states for backward compatibility
  const showWhiteLenses = selectedLensType === 'white';
  const showTransitionsLenses = selectedLensType === 'transitions';
  const showSpecialLenses = selectedLensType === 'special';

  // State for selected colors in Transitions table
  const [selectedTransitionsColors, setSelectedTransitionsColors] = useState([]);

  // Toggle color selection
  const toggleColorSelection = (color) => {
    setSelectedTransitionsColors(prev => {
      if (prev.includes(color)) {
        return prev.filter(c => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  // Load brand data when brand changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingBrand(true);
      try {
        const data = await loadBrandData(selectedBrand);
        setBrandData(data);
      } catch (error) {
        console.error('Error loading brand data:', error);
        setCalculationError('Error loading brand data: ' + error.message);
      } finally {
        setIsLoadingBrand(false);
      }
    };

    loadData();
  }, [selectedBrand]);

  // Handle brand change
  const handleBrandChange = (event) => {
    setSelectedBrand(event.target.value);
    setCalculationResults(null);
    setCalculationError(null);
  };

  // Handle calculation mode change
  const handleModeChange = (mode) => {
    setCalculationMode(mode);
    setCalculationResults(null);
    setCalculationError(null);
  };

  // Handle single vision calculation
  const handleSingleVisionCalculation = () => {
    if (!brandData) {
      setCalculationError('Brand data not loaded');
      return;
    }

    // Validate 0.25 intervals
    if (!validateQuarterInterval(prescription.sphere) ||
      !validateQuarterInterval(prescription.cylinder)) {
      setCalculationError('Values must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)');
      return;
    }

    // Reset RX options when new calculation is performed
    setShowRxOptions(false);
    setRxCalculationResults(null);
    
    // Reset FSV type filter to default (FSV Stock Lens)
    setFsvTypeFilter('FSV_STOCK_LENS');

    const sphereValue = prescription.sphere || "0";
    const cylinderValue = prescription.cylinder || "0";
    const axisValue = prescription.axis || "90";

    setIsCalculating(true);
    setCalculationError(null);

    try {
      let results;
      
      // Use Crizal-specific calculation for Crizal brand
      if (selectedBrand === 'crizal') {
        results = findCrizalLensOptions(
          brandData,
          sphereValue,
          cylinderValue,
          axisValue
        );
      } else {
        // Use standard calculation for other brands
        results = findLensOptions(
          brandData,
          sphereValue,
          cylinderValue,
          axisValue,
          false // hasAddPower = false for single vision
        );
      }

      if (results.error) {
        setCalculationError(results.error);
        setCalculationResults(null);
      } else {
        setCalculationResults(results);
        
        // Set default filter based on available products for Crizal
        if (selectedBrand === 'crizal' && results.matches && results.matches.length > 0) {
          const hasFSVStock = results.matches.some(m => {
            const productType = brandData.products[m.productKey]?.type;
            return productType === 'FSV_STOCK_LENS';
          });
          const hasFSVOther = results.matches.some(m => {
            const productType = brandData.products[m.productKey]?.type;
            return productType === 'FSV_OTHER_RANGE';
          });
          const hasRxProducts = results.matches.some(m => {
            const productType = brandData.products[m.productKey]?.type;
            return productType === 'RX_SINGLE_VISION';
          });
          
          // Default priority: RX Single Vision > FSV Stock Lens > FSV Other
          if (hasRxProducts) {
            setFsvTypeFilter('RX_SINGLE_VISION');
          } else if (hasFSVStock) {
            setFsvTypeFilter('FSV_STOCK_LENS');
          } else if (hasFSVOther) {
            setFsvTypeFilter('FSV_OTHER_RANGE');
          }
        }
      }
    } catch (error) {
      setCalculationError('Error calculating lens options: ' + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle loading RX options (for Addon Optifog link)
  const handleLoadRxOptions = () => {
    if (!brandData || selectedBrand !== 'crizal') {
      return;
    }

    const sphereValue = prescription.sphere || "0";
    const cylinderValue = prescription.cylinder || "0";
    const axisValue = prescription.axis || "90";

    try {
      const results = findCrizalRxOptions(
        brandData,
        sphereValue,
        cylinderValue,
        axisValue
      );

      if (!results.error && results.matches && results.matches.length > 0) {
        // Filter to only show Crizal Rock RX products
        const crizalRockMatches = results.matches.filter(match => 
          match.productName && match.productName.toLowerCase().includes('crizal rock')
        );
        
        if (crizalRockMatches.length > 0) {
          // Update results to only include Crizal Rock
          const filteredResults = {
            ...results,
            matches: crizalRockMatches,
            bestMatch: crizalRockMatches[0],
            totalMatches: crizalRockMatches.length
          };
          setRxCalculationResults(filteredResults);
          setShowRxOptions(true);
        }
      }
    } catch (error) {
      console.error('Error loading RX options:', error);
    }
  };

  // Check if prescription matches Elements 1.60 range (cyl 0 to -4) and get matches
  const getElements160Matches = () => {
    if (!brandData || selectedBrand !== 'crizal') {
      return null;
    }

    const cylinderValue = parseFloat(prescription.cylinder) || 0;
    
    // Check if cylinder is in range 0 to -4
    if (cylinderValue > 0 || cylinderValue < -4) {
      return null;
    }

    // Look for Elements product with 1.60 index
    const elementsProduct = brandData.products['ELEMENTS'];
    if (!elementsProduct) {
      return null;
    }

    // Find the specific 1.60 variant with cyl range 0 to -4
    const elements160Variant = elementsProduct.variants?.find(variant => 
      variant.index === "1.60" && 
      variant.power_range?.cyl_min === 0 && 
      variant.power_range?.cyl_max === -4.0
    );

    if (!elements160Variant) {
      return null;
    }

    // Check if prescription matches this variant's power range
    const sphereValue = parseFloat(prescription.sphere) || 0;
    const pr = elements160Variant.power_range;
    
    // Check sphere range if it has sph_type
    let sphInRange = false;
    if (pr.sph_type === "Plano/-4") {
      sphInRange = sphereValue <= 0 && sphereValue >= -4;
    }

    if (sphInRange) {
      return {
        productName: elementsProduct.name,
        productKey: 'ELEMENTS',
        index: elements160Variant.index,
        dia: elements160Variant.dia,
        price: elements160Variant.price,
        power_range: elements160Variant.power_range,
        rp_max: elements160Variant.rp_max,
        max_cyl: elements160Variant.max_cyl
      };
    }

    return null;
  };

  // Handle ADD power calculation (Bi-Focal KT)
  const handleAddCalculation = () => {
    if (!brandData) {
      setCalculationError('Brand data not loaded');
      return;
    }

    // Get values, defaulting to 0 if empty
    const dvSphere = parseFloat(addCalculation.distanceVision.sphere) || 0;
    const dvCylinder = parseFloat(addCalculation.distanceVision.cylinder) || 0;
    const dvAxis = parseFloat(addCalculation.distanceVision.axis) || 0;
    const nvSphere = parseFloat(addCalculation.nearVision.sphere) || 0;
    const nvCylinder = parseFloat(addCalculation.nearVision.cylinder) || 0;
    const nvAxis = parseFloat(addCalculation.nearVision.axis) || 0;
    let addPower = parseFloat(addCalculation.addPower) || 0;

    // Auto-calculate ADD if empty: ADD = NV - DV
    if ((!addCalculation.addPower || addCalculation.addPower === "") &&
      (addCalculation.nearVision.sphere && addCalculation.nearVision.sphere !== "")) {
      addPower = nvSphere - dvSphere;
      // Update the state to show calculated value
      setAddCalculation({
        ...addCalculation,
        addPower: addPower.toFixed(2)
      });
    }

    // For Crizal bifocal, allow calculation with just sphere or just cylinder or both
    if (selectedBrand === 'crizal') {
      setIsCalculating(true);
      setCalculationError(null);

      try {
        console.log('Calling Crizal bifocal calculation with:', { dvSphere, dvCylinder, dvAxis, addPower });
        const results = findCrizalBifocalOptions(
          brandData,
          dvSphere,
          dvCylinder,
          dvAxis,
          addPower
        );
        console.log('Crizal bifocal results:', results);

        if (results.error) {
          setCalculationError(results.error);
          setCalculationResults(null);
        } else {
          setCalculationResults(results);
        }
      } catch (error) {
        setCalculationError('Error calculating lens options: ' + error.message);
      } finally {
        setIsCalculating(false);
      }
      return;
    }

    // Check if cylinder value is provided - determine which calculation type for other brands
    if (dvCylinder !== 0 || nvCylinder !== 0) {
      // Use whichever cylinder is non-zero
      const cylToUse = dvCylinder !== 0 ? dvCylinder : nvCylinder;
      const axisToUse = dvCylinder !== 0 ? dvAxis : nvAxis;

      setIsCalculating(true);
      setCalculationError(null);

      try {
        let results;

        if (dvSphere !== 0) {
          // COMP_KT calculation (sphere + cylinder + axis) for other brands
          results = findCompKTOptions(
            brandData,
            dvSphere,
            cylToUse,
            axisToUse,
            nvSphere !== 0 ? nvSphere : null,
            addPower !== 0 ? addPower : null
          );
        } else {
          // CYL_KT calculation (only cylinder + axis)
          results = findCylKTOptions(brandData, cylToUse, axisToUse);
        }

        if (results.error) {
          setCalculationError(results.error);
          setCalculationResults(null);
        } else {
          setCalculationResults(results);
        }
      } catch (error) {
        setCalculationError('Error calculating lens options: ' + error.message);
      } finally {
        setIsCalculating(false);
      }
      return;
    }

    // Validate 0.25 intervals
    if (!validateQuarterInterval(dvSphere) ||
      !validateQuarterInterval(addPower)) {
      setCalculationError('Values must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)');
      return;
    }

    // Validate ADD Power range (must be between +1.0 and +3.0)
    if (addPower < 1.0 || addPower > 3.0) {
      setCalculationError('ADD Power must be between +1.0 and +3.0');
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      const results = findAddPowerOptions(
        brandData,
        {
          sphere: dvSphere.toString(),
          cylinder: "0"
        },
        addPower.toString()
      );

      if (results.error) {
        setCalculationError(results.error);
        setCalculationResults(null);
      } else {
        setCalculationResults(results);
      }
    } catch (error) {
      setCalculationError('Error calculating lens options: ' + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle Near Vision calculation (Progressive)
  const handleNearVisionCalculation = () => {
    if (!brandData) {
      setCalculationError('Brand data not loaded');
      return;
    }

    const dvSphere = parseFloat(nearVisionCalculation.distanceVision.sphere) || 0;
    const dvCylinder = parseFloat(nearVisionCalculation.distanceVision.cylinder) || 0;
    const dvAxis = parseFloat(nearVisionCalculation.distanceVision.axis) || 0;
    const nvSphere = parseFloat(nearVisionCalculation.nearVision.sphere) || 0;
    const addPower = parseFloat(nearVisionCalculation.addPower) || 0;

    // Determine calculation type based on input
    // Progressive COMP: sphere + cylinder + axis all provided
    // Progressive CYL: only cylinder + axis (sphere = 0)
    // Progressive SPH: only sphere (cylinder = 0)

    if (dvCylinder !== 0) {
      // Check if sphere is also provided → Progressive COMP
      if (dvSphere !== 0) {
        // Progressive COMP calculation

        // Validate required fields
        if (!nearVisionCalculation.distanceVision.sphere || nearVisionCalculation.distanceVision.sphere === "") {
          setCalculationError('DV Sphere value is required for Progressive COMP');
          return;
        }

        if (!nearVisionCalculation.distanceVision.cylinder || nearVisionCalculation.distanceVision.cylinder === "") {
          setCalculationError('DV Cylinder value is required for Progressive COMP');
          return;
        }

        if (!nearVisionCalculation.distanceVision.axis || nearVisionCalculation.distanceVision.axis === "") {
          setCalculationError('DV Axis value is required for Progressive COMP');
          return;
        }

        // Validate 0.25 intervals
        if (!validateQuarterInterval(nearVisionCalculation.distanceVision.sphere) ||
          !validateQuarterInterval(nearVisionCalculation.distanceVision.cylinder)) {
          setCalculationError('Sphere and Cylinder values must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)');
          return;
        }

        setIsCalculating(true);
        setCalculationError(null);

        try {
          const results = findProgressiveCompOptions(
            brandData,
            nearVisionCalculation.distanceVision.sphere,
            nearVisionCalculation.distanceVision.cylinder,
            nearVisionCalculation.distanceVision.axis,
            nvSphere !== 0 ? nvSphere : null,
            addPower !== 0 ? addPower : null
          );

          if (results.error) {
            setCalculationError(results.error);
            setCalculationResults(null);
          } else {
            setCalculationResults(results);
          }
        } catch (error) {
          setCalculationError('Error calculating Progressive COMP options: ' + error.message);
        } finally {
          setIsCalculating(false);
        }
        return;
      } else {
        // Progressive CYL calculation (cylinder + axis, no sphere)

        // Validate required fields
        if (!nearVisionCalculation.distanceVision.cylinder || nearVisionCalculation.distanceVision.cylinder === "") {
          setCalculationError('DV Cylinder value is required for Progressive CYL');
          return;
        }

        if (!nearVisionCalculation.distanceVision.axis || nearVisionCalculation.distanceVision.axis === "") {
          setCalculationError('DV Axis value is required for Progressive CYL');
          return;
        }

        // Validate 0.25 intervals
        if (!validateQuarterInterval(nearVisionCalculation.distanceVision.cylinder)) {
          setCalculationError('Cylinder value must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)');
          return;
        }

        setIsCalculating(true);
        setCalculationError(null);

        try {
          const results = findProgressiveCylOptions(
            brandData,
            nearVisionCalculation.distanceVision.cylinder,
            nearVisionCalculation.distanceVision.axis
          );

          if (results.error) {
            setCalculationError(results.error);
            setCalculationResults(null);
          } else {
            setCalculationResults(results);
          }
        } catch (error) {
          setCalculationError('Error calculating Progressive CYL options: ' + error.message);
        } finally {
          setIsCalculating(false);
        }
        return;
      }
    }

    // Progressive SPH calculation (original logic)

    // Validation for Progressive SPH
    if (!nearVisionCalculation.distanceVision.sphere || nearVisionCalculation.distanceVision.sphere === "") {
      setCalculationError('Distance Vision Sphere value is required');
      return;
    }

    if (!nearVisionCalculation.addPower || nearVisionCalculation.addPower === "") {
      setCalculationError('ADD Power value is required');
      return;
    }

    // Validate ADD Power range (must be between +1.0 and +3.0)
    const addPowerValue = parseFloat(nearVisionCalculation.addPower);
    if (addPowerValue < 1.0 || addPowerValue > 3.0) {
      setCalculationError('ADD Power must be between +1.0 and +3.0');
      return;
    }

    // Validate 0.25 intervals
    if (!validateQuarterInterval(nearVisionCalculation.distanceVision.sphere) ||
      !validateQuarterInterval(nearVisionCalculation.addPower)) {
      setCalculationError('Values must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)');
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      const results = findNearVisionOptions(
        brandData,
        {
          sphere: nearVisionCalculation.distanceVision.sphere,
          cylinder: nearVisionCalculation.distanceVision.cylinder || "0"
        },
        nearVisionCalculation.addPower
      );

      if (results.error) {
        setCalculationError(results.error);
        setCalculationResults(null);
      } else {
        setCalculationResults(results);
      }
    } catch (error) {
      setCalculationError('Error calculating lens options: ' + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  // Clear results
  const clearResults = () => {
    setCalculationResults(null);
    setCalculationError(null);

    // Clear input fields based on current calculation mode
    if (calculationMode === "single") {
      setPrescription({
        sphere: "",
        cylinder: "",
        axis: "",
      });
    } else if (calculationMode === "add-calculation") {
      setAddCalculation({
        distanceVision: { sphere: "", cylinder: "", axis: "" },
        nearVision: { sphere: "", cylinder: "", axis: "" },
        addPower: ""
      });
    } else if (calculationMode === "nv-calculation") {
      setNearVisionCalculation({
        distanceVision: { sphere: "", cylinder: "", axis: "" },
        nearVision: { sphere: "", cylinder: "", axis: "" },
        addPower: ""
      });
    }
  };

  return (
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
              {/* Brand Selection */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header bg-dark text-white">
                      <h5 className="mb-0">
                        <i className="fas fa-building mr-2"></i>
                        Brand Selection
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="form-group mb-0">
                        <label htmlFor="brandSelect" className="font-weight-bold">
                          Select Brand:
                        </label>
                        <select
                          id="brandSelect"
                          className="form-control"
                          value={selectedBrand}
                          onChange={handleBrandChange}
                          disabled={isLoadingBrand}
                        >
                          {availableBrands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                        {isLoadingBrand && (
                          <small className="text-muted">Loading brand data...</small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Mode Selection */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header bg-secondary text-white">
                      <h5 className="mb-0">
                        <i className="fas fa-calculator mr-2"></i>
                        Select Calculation Mode
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="btn-group btn-group-toggle w-100" data-toggle="buttons">
                        <label className={`btn btn-outline-primary ${calculationMode === "single" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="mode"
                            value="single"
                            checked={calculationMode === "single"}
                            onChange={(e) => handleModeChange(e.target.value)}
                          />
                          Single Prescription
                        </label>
                        <label className={`btn btn-outline-primary ${calculationMode === "add-calculation" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="mode"
                            value="add-calculation"
                            checked={calculationMode === "add-calculation"}
                            onChange={(e) => handleModeChange(e.target.value)}
                          />
                          Bi-Focal KT
                        </label>
                        <label className={`btn btn-outline-primary ${calculationMode === "nv-calculation" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="mode"
                            value="nv-calculation"
                            checked={calculationMode === "nv-calculation"}
                            onChange={(e) => handleModeChange(e.target.value)}
                          />
                          Progressive
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {calculationError && (
                <div className="alert alert-danger">
                  <h6 className="alert-heading">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Calculation Error
                  </h6>
                  <p className="mb-0">{calculationError}</p>
                </div>
              )}

              {/* Input Forms */}
              {calculationMode === "single" && (
                <div className="row">
                  <div className="col-md-12">
                    <div className="card">
                      <div className="card-header bg-info text-white">
                        <h5 className="mb-0">Single Prescription Input</h5>
                      </div>
                      <div className="card-body">
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 calc(33.333% - 10px)', minWidth: '150px' }}>
                            <label htmlFor="sphere" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Sphere (Sph)</label>
                            <input
                              id="sphere"
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
                              placeholder="e.g., -2.50, +1.25"
                            />
                            <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>Optional. Must be in 0.25 intervals if entered.</small>
                          </div>
                          <div style={{ flex: '1 1 calc(33.333% - 10px)', minWidth: '150px' }}>
                            <label htmlFor="cylinder" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Cylinder (Cyl)</label>
                            <input
                              id="cylinder"
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
                              placeholder="e.g., -1.00, +0.75 (optional)"
                            />
                            <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>Optional. Must be in 0.25 intervals if entered.</small>
                          </div>
                          <div style={{ flex: '1 1 calc(33.333% - 10px)', minWidth: '150px' }}>
                            <label htmlFor="axis" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Axis</label>
                            <input
                              id="axis"
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
                              placeholder="1-180° (optional for single vision)"
                            />
                            <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>Optional. Not considered in single vision calculations.</small>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn-block"
                          onClick={handleSingleVisionCalculation}
                          disabled={isCalculating || isLoadingBrand}
                        >
                          {isCalculating ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Calculating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-calculator mr-2"></i>
                              Calculate & Find Lenses
                            </>
                          )}
                        </button>
                        {calculationResults && (
                          <button
                            className="btn btn-secondary btn-block mt-2"
                            onClick={clearResults}
                          >
                            Clear Results
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bi-Focal KT Input Form */}
              {calculationMode === "add-calculation" && (
                <div className="row">
                  <div className="col-md-12">
                    <div className="card">
                      <div className="card-header bg-warning text-dark">
                        <h5 className="mb-0">Bi-Focal KT Input</h5>
                      </div>
                      <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '1rem' }}>
                          {/* DV Sphere Column */}
                          <div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0c5460' }}>DV Sphere (Sph)</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={addCalculation.distanceVision.sphere}
                                onChange={(e) => {
                                  const dvSph = e.target.value;
                                  const newAddCalc = {
                                    ...addCalculation,
                                    distanceVision: {
                                      ...addCalculation.distanceVision,
                                      sphere: dvSph,
                                    },
                                  };

                                  // Auto-calculate NV if ADD is provided: NV = DV + ADD
                                  if (addCalculation.addPower && addCalculation.addPower !== "") {
                                    const dv = parseFloat(dvSph) || 0;
                                    const add = parseFloat(addCalculation.addPower) || 0;
                                    const nv = dv + add;
                                    newAddCalc.nearVision = {
                                      ...newAddCalc.nearVision,
                                      sphere: nv.toFixed(2)
                                    };
                                  }

                                  setAddCalculation(newAddCalc);
                                }}
                                placeholder="e.g., -2.50, +1.25"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#155724' }}>NV Sphere (Sph)</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={addCalculation.nearVision.sphere}
                                onChange={(e) => {
                                  const nvSph = e.target.value;
                                  const newAddCalc = {
                                    ...addCalculation,
                                    nearVision: {
                                      ...addCalculation.nearVision,
                                      sphere: nvSph,
                                    },
                                  };

                                  // Auto-calculate ADD if DV is provided: ADD = NV - DV
                                  if (addCalculation.distanceVision.sphere && addCalculation.distanceVision.sphere !== "") {
                                    const nv = parseFloat(nvSph) || 0;
                                    const dv = parseFloat(addCalculation.distanceVision.sphere) || 0;
                                    const add = nv - dv;
                                    newAddCalc.addPower = add.toFixed(2);
                                  }

                                  setAddCalculation(newAddCalc);
                                }}
                                placeholder="e.g., -1.50, +2.00"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#004085' }}>ADD Power</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={addCalculation.addPower}
                                onChange={(e) => {
                                  const addPwr = e.target.value;
                                  const newAddCalc = {
                                    ...addCalculation,
                                    addPower: addPwr,
                                  };

                                  // Auto-calculate NV if DV is provided: NV = DV + ADD
                                  if (addCalculation.distanceVision.sphere && addCalculation.distanceVision.sphere !== "") {
                                    const dv = parseFloat(addCalculation.distanceVision.sphere) || 0;
                                    const add = parseFloat(addPwr) || 0;
                                    const nv = dv + add;
                                    newAddCalc.nearVision = {
                                      ...newAddCalc.nearVision,
                                      sphere: nv.toFixed(2)
                                    };
                                  }

                                  setAddCalculation(newAddCalc);
                                }}
                                placeholder="e.g., +1.00, +2.50"
                              />
                              <small className="text-muted">Auto-calculated from NV - DV if empty</small>
                            </div>
                          </div>

                          {/* DV Cylinder Column */}
                          <div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0c5460' }}>DV Cylinder (Cyl)</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={addCalculation.distanceVision.cylinder}
                                onChange={(e) =>
                                  setAddCalculation({
                                    ...addCalculation,
                                    distanceVision: {
                                      ...addCalculation.distanceVision,
                                      cylinder: e.target.value,
                                    },
                                    nearVision: {
                                      ...addCalculation.nearVision,
                                      cylinder: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g., -1.00, +0.75 (optional)"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#155724' }}>NV Cylinder (Cyl)</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={addCalculation.nearVision.cylinder}
                                readOnly
                                placeholder="Auto-synced from DV"
                              />
                            </div>
                          </div>

                          {/* DV Axis Column */}
                          <div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0c5460' }}>DV Axis (Axis)</label>
                              <input
                                type="number"
                                min="1"
                                max="180"
                                className="form-control"
                                value={addCalculation.distanceVision.axis}
                                onChange={(e) =>
                                  setAddCalculation({
                                    ...addCalculation,
                                    distanceVision: {
                                      ...addCalculation.distanceVision,
                                      axis: e.target.value,
                                    },
                                    nearVision: {
                                      ...addCalculation.nearVision,
                                      axis: e.target.value,
                                    },
                                  })
                                }
                                placeholder="1-180° (optional)"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#155724' }}>NV Axis (Axis)</label>
                              <input
                                type="number"
                                min="1"
                                max="180"
                                className="form-control"
                                value={addCalculation.nearVision.axis}
                                readOnly
                                placeholder="Auto-synced from DV"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          className="btn btn-warning btn-block"
                          onClick={handleAddCalculation}
                          disabled={isCalculating || isLoadingBrand}
                        >
                          {isCalculating ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Calculating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-plus mr-2"></i>
                              Calculate Bi-Focal KT Lenses
                            </>
                          )}
                        </button>
                        {calculationResults && (
                          <button
                            className="btn btn-secondary btn-block mt-2"
                            onClick={clearResults}
                          >
                            Clear Results
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progressive Input Form */}
              {calculationMode === "nv-calculation" && (
                <div className="row">
                  <div className="col-md-12">
                    <div className="card">
                      <div className="card-header bg-success text-white">
                        <h5 className="mb-0">Progressive Input</h5>
                      </div>
                      <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '1rem' }}>
                          {/* DV Sphere Column */}
                          <div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0c5460' }}>DV Sphere (Sph)</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={nearVisionCalculation.distanceVision.sphere}
                                onChange={(e) => {
                                  const dvSph = e.target.value;
                                  const newNVCalc = {
                                    ...nearVisionCalculation,
                                    distanceVision: {
                                      ...nearVisionCalculation.distanceVision,
                                      sphere: dvSph,
                                    },
                                  };

                                  // Auto-calculate NV if ADD is provided: NV = DV + ADD
                                  if (nearVisionCalculation.addPower && nearVisionCalculation.addPower !== "") {
                                    const dv = parseFloat(dvSph) || 0;
                                    const add = parseFloat(nearVisionCalculation.addPower) || 0;
                                    const nv = dv + add;
                                    newNVCalc.nearVision = {
                                      ...newNVCalc.nearVision,
                                      sphere: nv.toFixed(2)
                                    };
                                  }

                                  setNearVisionCalculation(newNVCalc);
                                }}
                                placeholder="e.g., -2.50, +1.25"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#155724' }}>NV Sphere (Sph)</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={nearVisionCalculation.nearVision.sphere}
                                onChange={(e) => {
                                  const nvSph = e.target.value;
                                  const newNVCalc = {
                                    ...nearVisionCalculation,
                                    nearVision: {
                                      ...nearVisionCalculation.nearVision,
                                      sphere: nvSph,
                                    },
                                  };

                                  // Auto-calculate ADD if DV is provided: ADD = NV - DV
                                  if (nearVisionCalculation.distanceVision.sphere && nearVisionCalculation.distanceVision.sphere !== "") {
                                    const nv = parseFloat(nvSph) || 0;
                                    const dv = parseFloat(nearVisionCalculation.distanceVision.sphere) || 0;
                                    const add = nv - dv;
                                    newNVCalc.addPower = add.toFixed(2);
                                  }

                                  setNearVisionCalculation(newNVCalc);
                                }}
                                placeholder="e.g., -1.50, +2.00"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#004085' }}>ADD Power</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={nearVisionCalculation.addPower}
                                onChange={(e) => {
                                  const addPwr = e.target.value;
                                  const newNVCalc = {
                                    ...nearVisionCalculation,
                                    addPower: addPwr,
                                  };

                                  // Auto-calculate NV if DV is provided: NV = DV + ADD
                                  if (nearVisionCalculation.distanceVision.sphere && nearVisionCalculation.distanceVision.sphere !== "") {
                                    const dv = parseFloat(nearVisionCalculation.distanceVision.sphere) || 0;
                                    const add = parseFloat(addPwr) || 0;
                                    const nv = dv + add;
                                    newNVCalc.nearVision = {
                                      ...newNVCalc.nearVision,
                                      sphere: nv.toFixed(2)
                                    };
                                  }

                                  setNearVisionCalculation(newNVCalc);
                                }}
                                placeholder="e.g., +1.00, +2.50"
                              />
                              <small className="text-muted">Auto-calculated from NV - DV if empty</small>
                            </div>
                          </div>

                          {/* DV Cylinder Column */}
                          <div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0c5460' }}>DV Cylinder (Cyl)</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={nearVisionCalculation.distanceVision.cylinder}
                                onChange={(e) =>
                                  setNearVisionCalculation({
                                    ...nearVisionCalculation,
                                    distanceVision: {
                                      ...nearVisionCalculation.distanceVision,
                                      cylinder: e.target.value,
                                    },
                                    nearVision: {
                                      ...nearVisionCalculation.nearVision,
                                      cylinder: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g., -1.00, +0.75 (optional)"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#155724' }}>NV Cylinder (Cyl)</label>
                              <input
                                type="number"
                                step="0.25"
                                className="form-control"
                                value={nearVisionCalculation.nearVision.cylinder}
                                readOnly
                                placeholder="Auto-synced from DV"
                              />
                            </div>
                          </div>

                          {/* DV Axis Column */}
                          <div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0c5460' }}>DV Axis (Axis)</label>
                              <input
                                type="number"
                                min="1"
                                max="180"
                                className="form-control"
                                value={nearVisionCalculation.distanceVision.axis}
                                onChange={(e) =>
                                  setNearVisionCalculation({
                                    ...nearVisionCalculation,
                                    distanceVision: {
                                      ...nearVisionCalculation.distanceVision,
                                      axis: e.target.value,
                                    },
                                    nearVision: {
                                      ...nearVisionCalculation.nearVision,
                                      axis: e.target.value,
                                    },
                                  })
                                }
                                placeholder="1-180° (optional)"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#155724' }}>NV Axis (Axis)</label>
                              <input
                                type="number"
                                min="1"
                                max="180"
                                className="form-control"
                                value={nearVisionCalculation.nearVision.axis}
                                readOnly
                                placeholder="Auto-synced from DV"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          className="btn btn-success btn-block"
                          onClick={handleNearVisionCalculation}
                          disabled={isCalculating || isLoadingBrand}
                        >
                          {isCalculating ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Calculating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-eye mr-2"></i>
                              Calculate Progressive Lenses
                            </>
                          )}
                        </button>
                        {calculationResults && (
                          <button
                            className="btn btn-secondary btn-block mt-2"
                            onClick={clearResults}
                          >
                            Clear Results
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Section */}
              {calculationResults && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card border-success">
                      <div className="card-header bg-success text-white">
                        <h4 className="mb-0">
                          <i className="fas fa-check-circle mr-2"></i>
                          Prescription Results
                        </h4>
                      </div>
                      <div className="card-body">
                        {/* Search Strategy */}
                        {calculationResults.searchStrategy && (
                          <div className="alert alert-info">
                            <h6 className="alert-heading">
                              <i className="fas fa-info-circle mr-2"></i>
                              Search Strategy
                            </h6>
                            <p className="mb-0">{calculationResults.searchStrategy}</p>
                          </div>
                        )}

                        <div className="row">
                          {/* Original Prescription */}
                          <div className={`${calculationResults.transposed ? 'col-md-6' : 'col-md-12'} mb-3`}>
                            <div className="card">
                              <div className="card-header bg-primary text-white">
                                <h6 className="mb-0">Original Prescription</h6>
                              </div>
                              <div className="card-body">
                                {calculationResults.original.sphere !== undefined && (
                                  <p><strong>Sphere:</strong> {calculationResults.original.sphere}</p>
                                )}
                                {calculationResults.original.cylinder !== undefined && (
                                  <p><strong>Cylinder:</strong> {calculationResults.original.cylinder}</p>
                                )}
                                {calculationResults.original.axis !== undefined && (
                                  <p><strong>Axis:</strong> {calculationResults.original.axis}°</p>
                                )}
                                {/* Display Resultant Power for Crizal */}
                                {selectedBrand === 'crizal' && calculationResults.original.sphere !== undefined && calculationResults.original.cylinder !== undefined && (
                                  <p className="text-info"><strong>Resultant Power (RP):</strong> {(parseFloat(calculationResults.original.sphere) + parseFloat(calculationResults.original.cylinder)).toFixed(2)}</p>
                                )}
                                {calculationResults.mappedAxis && !calculationResults.calculatedAdd && !calculationResults.calculatedNV && (
                                  <p><strong>Mapped Axis (CYL_KT):</strong> {calculationResults.mappedAxis}°</p>
                                )}
                                {calculationResults.mappedAxis && (calculationResults.calculatedAdd || calculationResults.calculatedNV) && (
                                  <p><strong>Mapped Axis (COMP_KT):</strong> {calculationResults.mappedAxis}°</p>
                                )}
                                {calculationResults.original.addPower && (
                                  <p><strong>ADD Power:</strong> {calculationResults.original.addPower}</p>
                                )}
                                {calculationResults.calculatedAdd && (
                                  <p><strong>Calculated ADD:</strong> {calculationResults.calculatedAdd}</p>
                                )}
                                {calculationResults.calculatedNV && (
                                  <p><strong>Calculated NV Sphere:</strong> {calculationResults.calculatedNV}</p>
                                )}
                                {calculationResults.categoryInfo && (
                                  <p><strong>Category:</strong> {calculationResults.categoryInfo.category}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Transposed Prescription - For Single Vision and COMP_KT */}
                          {calculationResults.transposed && (
                            <div className="col-md-6 mb-3">
                              <div className="card">
                                <div className="card-header bg-secondary text-white">
                                  <h6 className="mb-0">Transposed Prescription</h6>
                                </div>
                                <div className="card-body">
                                  <p><strong>Sphere:</strong> {calculationResults.transposed.sphere}</p>
                                  <p><strong>Cylinder:</strong> {calculationResults.transposed.cylinder}</p>
                                  <p><strong>Axis:</strong> {calculationResults.transposed.axis}°</p>
                                  {/* Display Resultant Power for Crizal */}
                                  {selectedBrand === 'crizal' && (
                                    <p className="text-info"><strong>Resultant Power (RP):</strong> {(calculationResults.transposed.sphere + calculationResults.transposed.cylinder).toFixed(2)}</p>
                                  )}
                                  {(calculationResults.calculatedAdd || calculationResults.calculatedNV) ? (
                                    <small className="text-muted">Used for priority matching (COMP_KT)</small>
                                  ) : (
                                    <small className="text-muted">Used for category determination</small>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Best Match */}
                        {selectedBrand === 'crizal' && calculationResults.matches && calculationResults.matches.length > 0 ? (
                          // Crizal-specific results display in table format
                          <div className="mt-4">
                            <h5 className="text-success mb-3">
                              <i className="fas fa-check-circle mr-2"></i>
                              Matching Lens Options
                            </h5>

                            {/* Check if we have bifocal products */}
                            {(() => {
                              const hasBifocal = calculationResults.matches.some(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'BIFOCAL' || productType === 'BIFOCAL_PHOTOCHROMIC';
                              });

                              // If bifocal products, show bifocal table format
                              if (hasBifocal && calculationMode === 'add-calculation') {
                                // Group bifocal matches by product name and index
                                const bifocalGroups = {};
                                
                                calculationResults.matches.forEach(match => {
                                  const productType = brandData.products[match.productKey]?.type;
                                  if (productType === 'BIFOCAL' || productType === 'BIFOCAL_PHOTOCHROMIC') {
                                    const key = `${match.productName}_${match.index}`;
                                    if (!bifocalGroups[key]) {
                                      bifocalGroups[key] = {
                                        productName: match.productName,
                                        index: match.index,
                                        variants: []
                                      };
                                    }
                                    bifocalGroups[key].variants.push(match);
                                  }
                                });

                                console.log('Bifocal groups created:', Object.keys(bifocalGroups));
                                console.log('Full bifocal groups:', bifocalGroups);

                                // Define coating order
                                const coatings = ['SHC', 'TITUS', 'Crizal Easy Pro', 'Crizal Rock', 'Crizal Prevencia'];

                                return (
                                  <div className="table-responsive">
                                    <table className="table table-striped table-bordered table-hover">
                                      <thead className="thead-dark">
                                        <tr>
                                          <th scope="col">VARIANT</th>
                                          <th scope="col">INDEX</th>
                                          {coatings.map((coating, idx) => (
                                            <th key={idx} scope="col">{coating}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {Object.values(bifocalGroups).map((group, groupIdx) => {
                                          // Create a map of coating to variant details for this group
                                          const coatingVariantMap = {};
                                          group.variants.forEach(v => {
                                            coatingVariantMap[v.coating] = v;
                                          });

                                          return (
                                            <tr key={groupIdx}>
                                              <td><strong>{group.productName}</strong></td>
                                              <td>{group.index}</td>
                                              {coatings.map((coating, coatingIdx) => {
                                                const variant = coatingVariantMap[coating];
                                                return (
                                                  <td key={coatingIdx}>
                                                    {variant ? (
                                                      <span 
                                                        onClick={() => {
                                                          setSelectedLensDetails(variant);
                                                          setShowModal(true);
                                                        }}
                                                        style={{ 
                                                          cursor: 'pointer', 
                                                          color: '#007bff',
                                                          textDecoration: 'underline'
                                                        }}
                                                      >
                                                        ₹{variant.price.toLocaleString()}
                                                      </span>
                                                    ) : '-'}
                                                  </td>
                                                );
                                              })}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>

                                    {/* Optifog Upgrade Card for Bifocals */}
                                    <div className="mt-4">
                                      <div className="card border-info">
                                        <div className="card-body text-center">
                                          <h6 className="text-info mb-3">
                                            <i className="fas fa-plus-circle mr-2"></i>
                                            ADD-ON UPGRADE AVAILABLE
                                          </h6>
                                          <div className="d-flex align-items-center justify-content-center">
                                            <div className="mr-4">
                                              <img 
                                                src="/optifog-icon.svg" 
                                                alt="Fog Free Vision Optifog"
                                                className="rounded"
                                                style={{ border: '2px solid #007bff', width: '80px', height: '80px' }}
                                              />
                                            </div>
                                            <div className="text-left">
                                              <h5 className="mb-1">FOG FREE VISION (Optifog)</h5>
                                              <p className="mb-1 text-muted">Available for Crizal Rock Bifocals</p>
                                              <h4 className="text-success mb-0">
                                                <strong>+₹2000/Pair</strong>
                                              </h4>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Essidrive Upgrade Card for Bifocals */}
                                    <div className="mt-3">
                                      <div className="card border-info">
                                        <div className="card-body text-center">
                                          <h6 className="text-info mb-3">
                                            <i className="fas fa-plus-circle mr-2"></i>
                                            ADD-ON UPGRADE AVAILABLE
                                          </h6>
                                          <div className="d-flex align-items-center justify-content-center">
                                            <div className="mr-4">
                                              <img 
                                                src="/essidrive-icon.svg" 
                                                alt="Essidrive"
                                                className="rounded"
                                                style={{ border: '2px solid #007bff', width: '80px', height: '80px' }}
                                              />
                                            </div>
                                            <div className="text-left">
                                              <h5 className="mb-1">ESSIDRIVE™</h5>
                                              <p className="mb-1 text-muted">Available for Crizal Rock Bifocals</p>
                                              <h4 className="text-success mb-0">
                                                <strong>+₹2000/Pair</strong>
                                              </h4>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              // Otherwise show single vision dropdown and table
                              const hasFSVStock = calculationResults.matches.some(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'FSV_STOCK_LENS';
                              });
                              const hasFSVOther = calculationResults.matches.some(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'FSV_OTHER_RANGE';
                              });
                              const hasRxProducts = calculationResults.matches.some(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'RX_SINGLE_VISION';
                              });

                              // Show dropdown if:
                              // 1. Both FSV types available (cylinder inside -2 to +2)
                              // 2. RX products available AND FSV Other available (for Elements 1.60 case with cyl 0 to -4)
                              const showDropdown = (hasFSVStock && hasFSVOther) || (hasRxProducts && hasFSVOther && !hasFSVStock);

                              // Only show dropdown if White checkbox is ticked
                              if (showDropdown && showWhiteLenses) {
                                return (
                                  <div className="mb-3">
                                    <label htmlFor="fsvTypeSelect" className="mr-2"><strong>Select Type:</strong></label>
                                    <select
                                      id="fsvTypeSelect"
                                      className="form-control d-inline-block w-auto"
                                      value={fsvTypeFilter}
                                      onChange={(e) => setFsvTypeFilter(e.target.value)}
                                    >
                                      {hasFSVStock && <option value="FSV_STOCK_LENS">FSV Stock Lens</option>}
                                      {hasFSVOther && <option value="FSV_OTHER_RANGE">Other FSV</option>}
                                      {hasRxProducts && <option value="RX_SINGLE_VISION">RX Single Vision</option>}
                                    </select>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Lens Type Selection Checkboxes */}
                            {(() => {
                              const hasFSVStock = calculationResults.matches.some(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'FSV_STOCK_LENS' || productType === 'FSV_OTHER_RANGE';
                              });
                              const hasTransitions = calculationResults.matches.some(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'FSV_PHOTOCHROMIC';
                              });
                              const hasEyezen = calculationResults.matches.some(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'DIGITAL_ENHANCED_SINGLE_VISION';
                              });

                              if (!hasFSVStock && !hasTransitions && !hasEyezen) return null;

                              return (
                                <div className="mb-3 p-3 border rounded bg-light">
                                  <div className="d-flex flex-wrap align-items-center">
                                    <strong className="mr-3">Select Lens Types:</strong>
                                    {hasFSVStock && (
                                      <div className="custom-control custom-checkbox mr-4">
                                        <input
                                          type="checkbox"
                                          className="custom-control-input"
                                          id="whiteCheck"
                                          checked={showWhiteLenses}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedLensType('white');
                                            }
                                          }}
                                        />
                                        <label className="custom-control-label" htmlFor="whiteCheck">
                                          White
                                        </label>
                                      </div>
                                    )}
                                    {hasTransitions && (
                                      <div className="custom-control custom-checkbox mr-4">
                                        <input
                                          type="checkbox"
                                          className="custom-control-input"
                                          id="transitionsCheck"
                                          checked={showTransitionsLenses}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedLensType('transitions');
                                            }
                                          }}
                                        />
                                        <label className="custom-control-label" htmlFor="transitionsCheck">
                                          Transitions (Photochromatic)
                                        </label>
                                      </div>
                                    )}
                                    {hasEyezen && (
                                      <div className="custom-control custom-checkbox">
                                        <input
                                          type="checkbox"
                                          className="custom-control-input"
                                          id="specialCheck"
                                          checked={showSpecialLenses}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedLensType('special');
                                            }
                                          }}
                                        />
                                        <label className="custom-control-label" htmlFor="specialCheck">
                                          Special Lenses (Eyezen)
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* FSV Main Table - Only show if White checkbox is checked */}
                            {showWhiteLenses && (
                            <div className="table-responsive">
                              <table className="table table-striped table-bordered table-hover">
                                <thead className="thead-dark">
                                  <tr>
                                    <th scope="col">Index</th>
                                    {/* Get unique product names for column headers */}
                                    {(() => {
                                      // Use the selected filter from dropdown
                                      const filteredMatches = calculationResults.matches.filter(m => {
                                        const productType = brandData.products[m.productKey]?.type;
                                        return productType === fsvTypeFilter;
                                      });
                                      
                                      const uniqueProducts = [...new Set(filteredMatches.map(m => m.productName))];
                                      return uniqueProducts.map((productName, idx) => (
                                        <th key={idx} scope="col">{productName}</th>
                                      ));
                                    })()}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    // Use the selected filter from dropdown
                                    const filteredMatches = calculationResults.matches.filter(m => {
                                      const productType = brandData.products[m.productKey]?.type;
                                      return productType === fsvTypeFilter;
                                    });

                                    // Group matches by index
                                    const groupedByIndex = {};
                                    const matchDetailsMap = {};
                                    
                                    filteredMatches.forEach(match => {
                                      if (!groupedByIndex[match.index]) {
                                        groupedByIndex[match.index] = {};
                                      }
                                      if (!groupedByIndex[match.index][match.productName]) {
                                        groupedByIndex[match.index][match.productName] = [];
                                      }
                                      groupedByIndex[match.index][match.productName].push(match.price);
                                      
                                      // Store full match details for modal
                                      const key = `${match.index}_${match.productName}_${match.price}`;
                                      matchDetailsMap[key] = match;
                                    });

                                    const uniqueProducts = [...new Set(filteredMatches.map(m => m.productName))];
                                    const sphereValue = parseFloat(calculationResults.original?.sphere) || 0;
                                    
                                    // Helper function to get recommendation tag
                                    const getRecommendationTag = (index) => {
                                      if (sphereValue < -3.75) {
                                        const indexValue = parseFloat(index);
                                        if (indexValue === 1.60) {
                                          return <span className="badge badge-info ml-1">Recommended</span>;
                                        } else if (indexValue === 1.67 || indexValue === 1.74) {
                                          return <span className="badge badge-success ml-1">Best</span>;
                                        }
                                      }
                                      return null;
                                    };

                                    // Handler for price click
                                    const handlePriceClick = (index, productName, price) => {
                                      const key = `${index}_${productName}_${price}`;
                                      const details = matchDetailsMap[key];
                                      if (details) {
                                        setSelectedLensDetails(details);
                                        setShowModal(true);
                                      }
                                    };
                                    
                                    return Object.keys(groupedByIndex).sort().map((index, rowIdx) => (
                                      <tr key={rowIdx}>
                                        <td className="font-weight-bold">
                                          {index}
                                          {getRecommendationTag(index)}
                                        </td>
                                        {uniqueProducts.map((productName, colIdx) => (
                                          <td key={colIdx} className="text-success font-weight-bold">
                                            {groupedByIndex[index][productName] ? 
                                              groupedByIndex[index][productName].map((price, priceIdx) => (
                                                <div 
                                                  key={priceIdx}
                                                  onClick={() => handlePriceClick(index, productName, price)}
                                                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                  title="Click for details"
                                                >
                                                  ₹{price}
                                                </div>
                                              )) 
                                              : '-'}
                                          </td>
                                        ))}
                                      </tr>
                                    ));
                                  })()}
                                </tbody>
                              </table>
                            </div>
                            )}

                            {/* Check if FSV or RX products are displayed */}
                            {showWhiteLenses && (() => {
                              // Use the current filter selection to determine what's displayed
                              const filteredMatches = calculationResults.matches.filter(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === fsvTypeFilter;
                              });

                              const hasFSV = filteredMatches.some(match => {
                                const productType = brandData.products[match.productKey]?.type;
                                return productType === 'FSV_STOCK_LENS' || productType === 'FSV_OTHER_RANGE';
                              });
                              
                              const hasRxSingleVision = fsvTypeFilter === 'RX_SINGLE_VISION' && filteredMatches.length > 0;
                              
                              // Show "Addon Optifog?" link only for FSV_STOCK_LENS (not for Other FSV or RX)
                              if (hasFSV && !showRxOptions && fsvTypeFilter === 'FSV_STOCK_LENS') {
                                return (
                                  <div className="mt-3 text-center">
                                    <button 
                                      onClick={handleLoadRxOptions}
                                      className="btn btn-link text-primary"
                                      style={{ fontSize: '16px', textDecoration: 'underline', cursor: 'pointer' }}
                                    >
                                      <i className="fas fa-plus-circle mr-1"></i>
                                      Addon Optifog?
                                    </button>
                                  </div>
                                );
                              }
                              
                              // Show Optifog upgrade card if RX Single Vision products are displayed
                              if (hasRxSingleVision) {
                                return (
                                  <div className="mt-4">
                                    <div className="card border-info">
                                      <div className="card-body text-center">
                                        <h6 className="text-info mb-3">
                                          <i className="fas fa-plus-circle mr-2"></i>
                                          ADD-ON UPGRADE AVAILABLE
                                        </h6>
                                        <div className="d-flex align-items-center justify-content-center">
                                          <div className="mr-4">
                                            <img 
                                              src="/optifog-icon.svg" 
                                              alt="Fog Free Vision Optifog"
                                              className="rounded"
                                              style={{ border: '2px solid #007bff', width: '80px', height: '80px' }}
                                            />
                                          </div>
                                          <div className="text-left">
                                            <h5 className="mb-1">FOG FREE VISION (Optifog)</h5>
                                            <p className="mb-1 text-muted">Available for Crizal Rock RX</p>
                                            <h4 className="text-success mb-0">
                                              <strong>+₹2000/Pair</strong>
                                            </h4>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              return null;
                            })()}

                            {/* Transitions FSV Photochromic Table */}
                            {showTransitionsLenses && (() => {
                              const fsvPhotochromicMatches = calculationResults.matches.filter(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'FSV_PHOTOCHROMIC' && (fsvTypeFilter === 'FSV_STOCK_LENS' || fsvTypeFilter === 'FSV_OTHER_RANGE');
                              });

                              if (fsvPhotochromicMatches.length === 0) return null;

                              // Group by product name (Classic vs Gen S)
                              const productGroups = {};
                              fsvPhotochromicMatches.forEach(match => {
                                const productName = match.productName;
                                if (!productGroups[productName]) {
                                  productGroups[productName] = [];
                                }
                                productGroups[productName].push(match);
                              });

                              return (
                                <div className="mt-4">
                                  <h5 className="text-primary mb-3">
                                    <i className="fas fa-sun mr-2"></i>
                                    Transitions FSV
                                  </h5>
                                  <div className="table-responsive">
                                    <table className="table table-bordered">
                                      <thead>
                                        <tr className="table-primary">
                                          <th rowSpan="2" className="align-middle">INDEX</th>
                                          {Object.keys(productGroups).map((productName, idx) => (
                                            <th key={idx} colSpan="2" className="text-center">
                                              {productName.replace('Transitions FSV ', '')}
                                            </th>
                                          ))}
                                        </tr>
                                        <tr className="table-light">
                                          {Object.keys(productGroups).map((productName, idx) => (
                                            <React.Fragment key={idx}>
                                              <th className="text-center">POWERED BY CRIZAL</th>
                                              <th className="text-center">TRANSITIONS COLOURS (INDIA)</th>
                                            </React.Fragment>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(() => {
                                          // Get unique indices
                                          const indices = [...new Set(fsvPhotochromicMatches.map(m => m.index))].sort();
                                          
                                          return indices.map((index, rowIdx) => (
                                            <tr key={rowIdx}>
                                              <td className="font-weight-bold">{index}</td>
                                              {Object.keys(productGroups).map((productName, colIdx) => {
                                                const variantsForIndex = productGroups[productName].filter(m => m.index === index);
                                                const variant = variantsForIndex[0];
                                                
                                                return (
                                                  <React.Fragment key={colIdx}>
                                                    <td className="text-center">
                                                      {variant ? (
                                                        <span
                                                          onClick={() => {
                                                            setSelectedLensDetails(variant);
                                                            setShowModal(true);
                                                          }}
                                                          style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                                                        >
                                                          ₹{variant.price.toLocaleString()}
                                                        </span>
                                                      ) : '-'}
                                                    </td>
                                                    <td className="text-center">
                                                      {variant && variant.colors ? (
                                                        <div className="d-flex justify-content-center flex-wrap">
                                                          {variant.colors.map((color, colorIdx) => (
                                                            <span
                                                              key={colorIdx}
                                                              className="badge badge-pill badge-secondary m-1"
                                                              style={{
                                                                backgroundColor: color === 'Grey' ? '#6c757d' :
                                                                  color === 'Brown' ? '#8B4513' :
                                                                  color === 'Green' ? '#28a745' :
                                                                  color === 'Emerald' ? '#50C878' :
                                                                  color === 'Sapphire' ? '#0F52BA' :
                                                                  color === 'Amethyst' ? '#9966CC' :
                                                                  color === 'Amber' ? '#FFBF00' : '#6c757d'
                                                              }}
                                                            >
                                                              {color}
                                                            </span>
                                                          ))}
                                                        </div>
                                                      ) : '-'}
                                                    </td>
                                                  </React.Fragment>
                                                );
                                              })}
                                            </tr>
                                          ));
                                        })()}
                                      </tbody>
                                    </table>
                                  </div>
                                  {fsvPhotochromicMatches.some(m => m.tat_note) && (
                                    <p className="text-muted small">
                                      <i className="fas fa-info-circle mr-1"></i>
                                      Gen S except grey all colours will have +1 day TAT.
                                    </p>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Eyezen Start Stock Table */}
                            {showSpecialLenses && (() => {
                              const eyezenMatches = calculationResults.matches.filter(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'DIGITAL_ENHANCED_SINGLE_VISION' && (fsvTypeFilter === 'FSV_STOCK_LENS' || fsvTypeFilter === 'FSV_OTHER_RANGE');
                              });

                              if (eyezenMatches.length === 0) return null;

                              // Group by index and dia
                              const groupedByIndex = {};
                              eyezenMatches.forEach(match => {
                                if (!groupedByIndex[match.index]) {
                                  groupedByIndex[match.index] = [];
                                }
                                groupedByIndex[match.index].push(match);
                              });

                              return (
                                <div className="mt-4">
                                  <h5 className="text-primary mb-3">
                                    <i className="fas fa-eye mr-2"></i>
                                    Eyezen Start Stock
                                  </h5>
                                  <div className="table-responsive">
                                    <table className="table table-bordered table-sm">
                                      <thead>
                                        <tr className="table-primary">
                                          <th className="text-center align-middle">INDEX</th>
                                          <th className="text-center align-middle">COATING</th>
                                          <th className="text-center align-middle">PRICE</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {Object.keys(groupedByIndex).sort().map((index, indexIdx) => {
                                          const variants = groupedByIndex[index];
                                          return variants.map((variant, variantIdx) => (
                                            <tr key={`${indexIdx}-${variantIdx}`}>
                                              {variantIdx === 0 && (
                                                <td className="text-center align-middle font-weight-bold" rowSpan={variants.length}>
                                                  {index}
                                                </td>
                                              )}
                                              <td className="text-center">
                                                <span className="badge badge-info">{variant.coating}</span>
                                              </td>
                                              <td className="text-center">
                                                <span
                                                  onClick={() => {
                                                    setSelectedLensDetails(variant);
                                                    setShowModal(true);
                                                  }}
                                                  style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                                                >
                                                  ₹{variant.price.toLocaleString()}
                                                </span>
                                              </td>
                                            </tr>
                                          ));
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div className="text-muted small">
                                    <p className="mb-0">
                                      <i className="fas fa-info-circle mr-1"></i>
                                      Digital enhanced single vision lenses designed for digital device users with Blue UV Capture technology.
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Transitions RX Photochromic Table */}
                            {(() => {
                              const rxPhotochromicMatches = calculationResults.matches.filter(m => {
                                const productType = brandData.products[m.productKey]?.type;
                                return productType === 'RX_PHOTOCHROMIC' && fsvTypeFilter === 'RX_SINGLE_VISION';
                              });

                              if (rxPhotochromicMatches.length === 0) return null;

                              // Separate by product type and coating
                              const classicEasyProMatches = rxPhotochromicMatches.filter(m => 
                                m.productName.includes('Classic') && m.productName.includes('Crizal Easy Pro')
                              );
                              const classicRockMatches = rxPhotochromicMatches.filter(m => 
                                m.productName.includes('Classic') && m.productName.includes('Crizal Rock')
                              );
                              const genSMatches = rxPhotochromicMatches.filter(m => m.productName.includes('Gen S') && !m.productName.includes('Classic'));
                              const xtractiveMatches = rxPhotochromicMatches.filter(m => m.productName.includes('Xtractive'));

                              // Helper function to get color background
                              const getColorBackground = (color) => {
                                // Check if it's a hex code
                                if (color.startsWith('#')) {
                                  return color;
                                }
                                // Named color mapping
                                const colorMap = {
                                  'Grey': '#6c757d',
                                  'Brown': '#8B4513',
                                  'Green': '#28a745',
                                  'Dark Graphite Green': '#3D5941',
                                  'Emerald': '#50C878',
                                  'Sapphire': '#0F52BA',
                                  'Sapphire Blue': '#0F52BA',
                                  'Amethyst': '#9966CC',
                                  'Amethyst Purple': '#9966CC',
                                  'Amber': '#FFBF00',
                                  'Ruby': '#E0115F'
                                };
                                return colorMap[color] || '#6c757d';
                              };

                              // Get unique indices
                              const indices = [...new Set(rxPhotochromicMatches.map(m => m.index))].sort();

                              return (
                                <div className="mt-4">
                                  <h5 className="text-primary mb-3">
                                    <i className="fas fa-sun mr-2"></i>
                                    Transitions RX SV
                                  </h5>
                                  <div className="table-responsive">
                                    <table className="table table-bordered table-sm">
                                      <thead>
                                        <tr className="table-primary">
                                          <th rowSpan="3" className="align-middle text-center" style={{minWidth: '60px'}}>INDEX</th>
                                          <th colSpan="4" className="text-center">CLASSIC</th>
                                          <th colSpan="3" className="text-center">GEN S</th>
                                          <th colSpan="3" className="text-center">Gen S / Xtractive NG</th>
                                        </tr>
                                        <tr className="table-info">
                                          <th colSpan="2" className="text-center">Crizal Easy Pro</th>
                                          <th colSpan="2" className="text-center">Crizal Rock</th>
                                          <th colSpan="3" className="text-center">Crizal Easy Pro</th>
                                          <th colSpan="3" className="text-center">Crizal Rock</th>
                                        </tr>
                                        <tr className="table-light">
                                          <th className="text-center" style={{minWidth: '80px'}}>CLASSIC</th>
                                          <th className="text-center" style={{minWidth: '60px'}}>INDIA</th>
                                          <th className="text-center" style={{minWidth: '80px'}}>CLASSIC</th>
                                          <th className="text-center" style={{minWidth: '60px'}}>INDIA</th>
                                          <th className="text-center" style={{minWidth: '80px'}}>Price</th>
                                          <th className="text-center" style={{minWidth: '80px'}}>INDIA</th>
                                          <th className="text-center" style={{minWidth: '100px'}}>INTERNATIONAL*</th>
                                          <th className="text-center" style={{minWidth: '80px'}}>Price</th>
                                          <th className="text-center" style={{minWidth: '80px'}}>INDIA</th>
                                          <th className="text-center" style={{minWidth: '100px'}}>INTERNATIONAL*</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {indices.map((index, rowIdx) => {
                                          // Classic - Crizal Easy Pro
                                          const classicEasyPro = classicEasyProMatches.find(m => m.index === index);
                                          
                                          // Classic - Crizal Rock
                                          const classicRock = classicRockMatches.find(m => m.index === index);

                                          // Gen S - Crizal Easy Pro (India and International)
                                          const genS = genSMatches.find(m => m.index === index);

                                          // Xtractive NG - Crizal Rock (India and International)
                                          const xtractive = xtractiveMatches.find(m => m.index === index);

                                          return (
                                            <tr key={rowIdx}>
                                              <td className="font-weight-bold text-center">{index}</td>
                                              
                                              {/* Classic - Crizal Easy Pro - Price */}
                                              <td className="text-center">
                                                {classicEasyPro && classicEasyPro.price > 0 ? (
                                                  <span
                                                    onClick={() => {
                                                      setSelectedLensDetails(classicEasyPro);
                                                      setShowModal(true);
                                                    }}
                                                    style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                                                  >
                                                    {classicEasyPro.price.toLocaleString()}
                                                  </span>
                                                ) : '-'}
                                              </td>
                                              
                                              {/* Classic - Crizal Easy Pro - Colors */}
                                              <td className="text-center">
                                                {classicEasyPro && classicEasyPro.colors && classicEasyPro.colors.length > 0 ? (
                                                  <div className="d-flex justify-content-center flex-wrap">
                                                    {classicEasyPro.colors.map((color, colorIdx) => (
                                                      <div key={colorIdx} className="d-inline-block m-1">
                                                        <span
                                                          className="rounded-circle d-inline-block"
                                                          style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            backgroundColor: getColorBackground(color),
                                                            border: selectedTransitionsColors.includes(color) ? '2px solid #007bff' : '1px solid #dee2e6',
                                                            cursor: 'pointer'
                                                          }}
                                                          title={color}
                                                          onClick={() => toggleColorSelection(color)}
                                                        />
                                                        {selectedTransitionsColors.includes(color) && (
                                                          <div className="badge badge-primary badge-pill mt-1" style={{fontSize: '0.7rem'}}>
                                                            {color}
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : '-'}
                                              </td>

                                              {/* Classic - Crizal Rock - Price */}
                                              <td className="text-center">
                                                {classicRock && classicRock.price > 0 ? (
                                                  <span
                                                    onClick={() => {
                                                      setSelectedLensDetails(classicRock);
                                                      setShowModal(true);
                                                    }}
                                                    style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                                                  >
                                                    {classicRock.price.toLocaleString()}
                                                  </span>
                                                ) : '-'}
                                              </td>

                                              {/* Classic - Crizal Rock - Colors */}
                                              <td className="text-center">
                                                {classicRock && classicRock.colors && classicRock.colors.length > 0 ? (
                                                  <div className="d-flex justify-content-center flex-wrap">
                                                    {classicRock.colors.map((color, colorIdx) => (
                                                      <div key={colorIdx} className="d-inline-block m-1">
                                                        <span
                                                          className="rounded-circle d-inline-block"
                                                          style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            backgroundColor: getColorBackground(color),
                                                            border: selectedTransitionsColors.includes(color) ? '2px solid #007bff' : '1px solid #dee2e6',
                                                            cursor: 'pointer'
                                                          }}
                                                          title={color}
                                                          onClick={() => toggleColorSelection(color)}
                                                        />
                                                        {selectedTransitionsColors.includes(color) && (
                                                          <div className="badge badge-primary badge-pill mt-1" style={{fontSize: '0.7rem'}}>
                                                            {color}
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : '-'}
                                              </td>

                                              {/* Gen S - Price */}
                                              <td className="text-center">
                                                {genS ? (
                                                  genS.price > 0 ? (
                                                    <span
                                                      onClick={() => {
                                                        setSelectedLensDetails(genS);
                                                        setShowModal(true);
                                                      }}
                                                      style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                                                    >
                                                      {genS.price.toLocaleString()}
                                                    </span>
                                                  ) : '-'
                                                ) : '-'}
                                              </td>

                                              {/* Gen S - India Colors */}
                                              <td className="text-center">
                                                {genS && genS.colors_INDIA && genS.colors_INDIA.length > 0 ? (
                                                  <div className="d-flex justify-content-center flex-wrap">
                                                    {genS.colors_INDIA.map((color, colorIdx) => (
                                                      <div key={colorIdx} className="d-inline-block m-1">
                                                        <span
                                                          className="rounded-circle d-inline-block"
                                                          style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            backgroundColor: getColorBackground(color),
                                                            border: selectedTransitionsColors.includes(color) ? '2px solid #007bff' : '1px solid #dee2e6',
                                                            cursor: 'pointer'
                                                          }}
                                                          title={color}
                                                          onClick={() => toggleColorSelection(color)}
                                                        />
                                                        {selectedTransitionsColors.includes(color) && (
                                                          <div className="badge badge-primary badge-pill mt-1" style={{fontSize: '0.7rem'}}>
                                                            {color}
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : '-'}
                                              </td>

                                              {/* Gen S - International Colors */}
                                              <td className="text-center">
                                                {genS && genS.colors_INTERNATIONAL && genS.colors_INTERNATIONAL.length > 0 ? (
                                                  <div className="d-flex justify-content-center flex-wrap">
                                                    {genS.colors_INTERNATIONAL.map((color, colorIdx) => (
                                                      <div key={colorIdx} className="d-inline-block m-1">
                                                        <span
                                                          className="rounded-circle d-inline-block"
                                                          style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            backgroundColor: getColorBackground(color),
                                                            border: selectedTransitionsColors.includes(color) ? '2px solid #007bff' : '1px solid #dee2e6',
                                                            cursor: 'pointer'
                                                          }}
                                                          title={color}
                                                          onClick={() => toggleColorSelection(color)}
                                                        />
                                                        {selectedTransitionsColors.includes(color) && (
                                                          <div className="badge badge-primary badge-pill mt-1" style={{fontSize: '0.7rem'}}>
                                                            {color}
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : '-'}
                                              </td>

                                              {/* Xtractive NG - Price */}
                                              <td className="text-center">
                                                {xtractive ? (
                                                  xtractive.price > 0 ? (
                                                    <span
                                                      onClick={() => {
                                                        setSelectedLensDetails(xtractive);
                                                        setShowModal(true);
                                                      }}
                                                      style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                                                    >
                                                      {xtractive.price.toLocaleString()}
                                                    </span>
                                                  ) : '-'
                                                ) : '-'}
                                              </td>

                                              {/* Xtractive NG - India Colors */}
                                              <td className="text-center">
                                                {xtractive && xtractive.colors_INDIA && xtractive.colors_INDIA.length > 0 ? (
                                                  <div className="d-flex justify-content-center flex-wrap">
                                                    {xtractive.colors_INDIA.map((color, colorIdx) => (
                                                      <div key={colorIdx} className="d-inline-block m-1">
                                                        <span
                                                          className="rounded-circle d-inline-block"
                                                          style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            backgroundColor: getColorBackground(color),
                                                            border: selectedTransitionsColors.includes(color) ? '2px solid #007bff' : '1px solid #dee2e6',
                                                            cursor: 'pointer'
                                                          }}
                                                          title={color}
                                                          onClick={() => toggleColorSelection(color)}
                                                        />
                                                        {selectedTransitionsColors.includes(color) && (
                                                          <div className="badge badge-primary badge-pill mt-1" style={{fontSize: '0.7rem'}}>
                                                            {color}
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : '-'}
                                              </td>

                                              {/* Xtractive NG - International Colors */}
                                              <td className="text-center">
                                                {xtractive && xtractive.colors_INTERNATIONAL && xtractive.colors_INTERNATIONAL.length > 0 ? (
                                                  <div className="d-flex justify-content-center flex-wrap">
                                                    {xtractive.colors_INTERNATIONAL.map((color, colorIdx) => (
                                                      <div key={colorIdx} className="d-inline-block m-1">
                                                        <span
                                                          className="rounded-circle d-inline-block"
                                                          style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            backgroundColor: getColorBackground(color),
                                                            border: selectedTransitionsColors.includes(color) ? '2px solid #007bff' : '1px solid #dee2e6',
                                                            cursor: 'pointer'
                                                          }}
                                                          title={color}
                                                          onClick={() => toggleColorSelection(color)}
                                                        />
                                                        {selectedTransitionsColors.includes(color) && (
                                                          <div className="badge badge-primary badge-pill mt-1" style={{fontSize: '0.7rem'}}>
                                                            {color}
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : '-'}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div className="text-muted small">
                                    <p className="mb-1">
                                      <i className="fas fa-info-circle mr-1"></i>
                                      Gen S except grey all colours will have +1 day TAT.
                                    </p>
                                    <p className="mb-0">
                                      <i className="fas fa-globe mr-1"></i>
                                      International order will be charged ₹3000 extra. Up to +15 days TAT.
                                    </p>
                                  </div>

                                  {/* Optifog Upgrade Card for Transitions RX SV */}
                                  <div className="mt-4">
                                    <div className="card border-info">
                                      <div className="card-body text-center">
                                        <h6 className="text-info mb-3">
                                          <i className="fas fa-plus-circle mr-2"></i>
                                          ADD-ON UPGRADE AVAILABLE
                                        </h6>
                                        <div className="d-flex align-items-center justify-content-center">
                                          <div className="mr-4">
                                            <img 
                                              src="/optifog-icon.svg" 
                                              alt="Fog Free Vision Optifog"
                                              className="rounded"
                                              style={{ border: '2px solid #007bff', width: '80px', height: '80px' }}
                                            />
                                          </div>
                                          <div className="text-left">
                                            <h5 className="mb-1">FOG FREE VISION (Optifog)</h5>
                                            <p className="mb-1 text-muted">Available for Crizal Rock</p>
                                            <h4 className="text-success mb-0">
                                              <strong>+₹2000/Pair</strong>
                                            </h4>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Essidrive Upgrade Card for Transitions RX SV */}
                                  <div className="mt-3">
                                    <div className="card border-info">
                                      <div className="card-body text-center">
                                        <h6 className="text-info mb-3">
                                          <i className="fas fa-plus-circle mr-2"></i>
                                          ADD-ON UPGRADE AVAILABLE
                                        </h6>
                                        <div className="d-flex align-items-center justify-content-center">
                                          <div className="mr-4">
                                            <img 
                                              src="/essidrive-icon.svg" 
                                              alt="Essidrive"
                                              className="rounded"
                                              style={{ border: '2px solid #007bff', width: '80px', height: '80px' }}
                                            />
                                          </div>
                                          <div className="text-left">
                                            <h5 className="mb-1">ESSIDRIVE™</h5>
                                            <p className="mb-1 text-muted">Available for Crizal Rock</p>
                                            <h4 className="text-success mb-0">
                                              <strong>+₹2000/Pair</strong>
                                            </h4>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* RX Options Table - Show when "Addon Optifog?" is clicked and FSV Stock Lens is selected */}
                            {showRxOptions && rxCalculationResults && rxCalculationResults.matches && rxCalculationResults.matches.length > 0 && fsvTypeFilter === 'FSV_STOCK_LENS' && (
                              <div className="mt-4">
                                <h5 className="text-info mb-3">
                                  <i className="fas fa-flask mr-2"></i>
                                  Crizal Rock RX (+₹2000/Pair for Optifog)
                                </h5>
                                <div className="table-responsive">
                                  <table className="table table-striped table-bordered table-hover">
                                    <thead className="thead-dark">
                                      <tr>
                                        <th scope="col">Index</th>
                                        {/* Get unique product names for column headers */}
                                        {(() => {
                                          const uniqueProducts = [...new Set(rxCalculationResults.matches.map(m => m.productName))];
                                          return uniqueProducts.map((productName, idx) => (
                                            <th key={idx} scope="col">{productName}</th>
                                          ));
                                        })()}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(() => {
                                        // Group matches by index
                                        const groupedByIndex = {};
                                        const matchDetailsMap = {};
                                        
                                        rxCalculationResults.matches.forEach(match => {
                                          if (!groupedByIndex[match.index]) {
                                            groupedByIndex[match.index] = {};
                                          }
                                          if (!groupedByIndex[match.index][match.productName]) {
                                            groupedByIndex[match.index][match.productName] = [];
                                          }
                                          groupedByIndex[match.index][match.productName].push(match.price);
                                          
                                          // Store full match details for modal
                                          const key = `${match.index}_${match.productName}_${match.price}`;
                                          matchDetailsMap[key] = match;
                                        });

                                        const uniqueProducts = [...new Set(rxCalculationResults.matches.map(m => m.productName))];
                                        const sphereValue = parseFloat(rxCalculationResults.original?.sphere) || 0;
                                        
                                        // Helper function to get recommendation tag
                                        const getRecommendationTag = (index) => {
                                          if (sphereValue < -3.75) {
                                            const indexValue = parseFloat(index);
                                            if (indexValue === 1.60) {
                                              return <span className="badge badge-info ml-1">Recommended</span>;
                                            } else if (indexValue === 1.67 || indexValue === 1.74) {
                                              return <span className="badge badge-success ml-1">Best</span>;
                                            }
                                          }
                                          return null;
                                        };

                                        // Handler for price click
                                        const handlePriceClick = (index, productName, price) => {
                                          const key = `${index}_${productName}_${price}`;
                                          const details = matchDetailsMap[key];
                                          if (details) {
                                            setSelectedLensDetails(details);
                                            setShowModal(true);
                                          }
                                        };
                                        
                                        return Object.keys(groupedByIndex).sort().map((index, rowIdx) => (
                                          <tr key={rowIdx}>
                                            <td className="font-weight-bold">
                                              {index}
                                              {getRecommendationTag(index)}
                                            </td>
                                            {uniqueProducts.map((productName, colIdx) => (
                                              <td key={colIdx} className="text-info font-weight-bold">
                                                {groupedByIndex[index][productName] ? 
                                                  groupedByIndex[index][productName].map((price, priceIdx) => (
                                                    <div 
                                                      key={priceIdx}
                                                      onClick={() => handlePriceClick(index, productName, price)}
                                                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                      title="Click for details"
                                                    >
                                                      ₹{price}
                                                    </div>
                                                  )) 
                                                  : '-'}
                                              </td>
                                            ))}
                                          </tr>
                                        ));
                                      })()}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Optifog Upgrade Section - Always show for Crizal Rock RX */}
                                <div className="mt-3 text-center">
                                  <div className="d-inline-block px-4 py-2 bg-light border rounded">
                                    <h6 className="mb-0">
                                      <i className="fas fa-plus-circle mr-2 text-info"></i>
                                      <strong>Crizal Rock RX with Optifog: +₹2000/Pair</strong>
                                    </h6>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : calculationResults.bestMatch && (
                          // Standard results display for other brands
                          <div className="mt-4">
                            <h5 className="text-success">
                              <i className="fas fa-star mr-2"></i>
                              Best Matching Lens Option
                              {calculationResults.bestMatch.isTransposed && (
                                <span className="badge badge-info ml-2">Transposed Match</span>
                              )}
                            </h5>
                            <div className="card">
                              <div className="card-body">
                                <h6 className="card-title">Range: {calculationResults.bestMatch.range}</h6>
                                <div className="row">
                                  {Object.entries(calculationResults.bestMatch).map(([key, value]) => {
                                    if (key !== 'range' && key !== 'isTransposed' && key !== 'colors' && value !== undefined) {
                                      return (
                                        <div key={key} className="col-md-3 col-sm-6 mb-2">
                                          <div className="text-center">
                                            <small className="text-muted d-block">{key}</small>
                                            <span 
                                              className="font-weight-bold" 
                                              style={{ color: calculationResults.bestMatch.colors?.[key] || '#28a745' }}
                                            >
                                              ₹{value}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* All Matches */}
                        {/* {calculationResults.matches && calculationResults.matches.length > 1 && (
                          <div className="mt-4">
                            <h6 className="text-info">
                              <i className="fas fa-list mr-2"></i>
                              All Matching Ranges ({calculationResults.matches.length} found)
                            </h6>
                            <div className="row">
                              {calculationResults.matches.map((match, index) => (
                                <div key={index} className="col-md-6 col-lg-4 mb-3">
                                  <div className="card h-100">
                                    <div className="card-body">
                                      <h6 className="card-title">
                                        {match.range}
                                        {match.isTransposed && (
                                          <span className="badge badge-info ml-2 small">Transposed</span>
                                        )}
                                      </h6>
                                      <div className="row">
                                        {Object.entries(match).map(([key, value]) => {
                                          if (key !== 'range' && key !== 'isTransposed' && key !== 'colors' && value !== undefined) {
                                            return (
                                              <div key={key} className="col-6 mb-1">
                                                <small className="text-muted">{key}:</small>
                                                <br />
                                                <span 
                                                  className="font-weight-bold" 
                                                  style={{ color: match.colors?.[key] || '#28a745' }}
                                                >
                                                  ₹{value}
                                                </span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )} */}

                        {/* No Results Message */}
                        {(!calculationResults.bestMatch && (!calculationResults.matches || calculationResults.matches.length === 0)) && (
                          <div className="alert alert-warning">
                            <h6 className="alert-heading">
                              <i className="fas fa-exclamation-triangle mr-2"></i>
                              No Lens Options Found
                            </h6>
                            <p className="mb-0">
                              No matching lens ranges found for the given prescription. Please check the values or try a different brand.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lens Details Modal */}
      {showModal && selectedLensDetails && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-eye mr-2"></i>
                  Lens Details
                </h5>
                <button 
                  type="button" 
                  className="close text-white" 
                  onClick={() => setShowModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-6 mb-3">
                    <strong className="text-muted">Product Name:</strong>
                    <p className="mb-0">{selectedLensDetails.productName}</p>
                  </div>
                  <div className="col-6 mb-3">
                    <strong className="text-muted">Index:</strong>
                    <p className="mb-0">{selectedLensDetails.index}</p>
                  </div>
                  <div className="col-6 mb-3">
                    <strong className="text-muted">Diameter:</strong>
                    <p className="mb-0">{selectedLensDetails.dia} mm</p>
                  </div>
                  {selectedLensDetails.coating && (
                    <div className="col-6 mb-3">
                      <strong className="text-muted">Coating:</strong>
                      <p className="mb-0">{selectedLensDetails.coating}</p>
                    </div>
                  )}
                  <div className="col-6 mb-3">
                    <strong className="text-muted">Price:</strong>
                    <p className="mb-0 text-success font-weight-bold">₹{selectedLensDetails.price?.toLocaleString()}</p>
                  </div>
                  {selectedLensDetails.rp_max && (
                    <div className="col-6 mb-3">
                      <strong className="text-muted">RP Max:</strong>
                      <p className="mb-0">{selectedLensDetails.rp_max}</p>
                    </div>
                  )}
                  {selectedLensDetails.max_cyl && (
                    <div className="col-6 mb-3">
                      <strong className="text-muted">Max Cylinder:</strong>
                      <p className="mb-0">{selectedLensDetails.max_cyl}</p>
                    </div>
                  )}
                  {selectedLensDetails.power_range && (
                    <div className="col-12 mb-3">
                      <strong className="text-muted">Power Range:</strong>
                      {selectedLensDetails.power_range.sph_type ? (
                        <p className="mb-0">{selectedLensDetails.power_range.sph_type}</p>
                      ) : (
                        <>
                          <p className="mb-0">
                            SPH: {selectedLensDetails.power_range.sph_min} to {selectedLensDetails.power_range.sph_max}
                          </p>
                          <p className="mb-0">
                            CYL: {selectedLensDetails.power_range.cyl_min} to {selectedLensDetails.power_range.cyl_max}
                          </p>
                          {selectedLensDetails.power_range.add_min !== undefined && selectedLensDetails.power_range.add_max !== undefined && (
                            <p className="mb-0">
                              ADD: {selectedLensDetails.power_range.add_min} to {selectedLensDetails.power_range.add_max}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpticalStoreAppUI;