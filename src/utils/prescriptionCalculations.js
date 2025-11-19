// prescriptionCalculations.js

/**
 * Transpose prescription from plus cylinder to minus cylinder or vice versa
 * @param {number} sphere - Original sphere value
 * @param {number} cylinder - Original cylinder value
 * @param {number} axis - Original axis value
 * @returns {object} Transposed prescription {sphere, cylinder, axis}
 */
export const transposePrescription = (sphere, cylinder, axis) => {
    if (!sphere && !cylinder && !axis) return { sphere: 0, cylinder: 0, axis: 0 };

    const sph = parseFloat(sphere) || 0;
    const cyl = parseFloat(cylinder) || 0;
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
        sphere: newSphere,
        cylinder: newCylinder,
        axis: newAxis
    };
};

/**
 * Validate that values are in 0.25 intervals
 * @param {number} value - Value to validate
 * @returns {boolean} True if value is in 0.25 intervals
 */
export const validateQuarterInterval = (value) => {
    if (!value || value === "" || value === 0) return true; // Empty or zero is allowed
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    // Check if value is in 0.25 intervals
    return (Math.round(num * 4) / 4) === num;
};

/**
 * Generate range values in 0.25 increments from 0 to target value
 * @param {number} value - Target value
 * @returns {array} Array of values from 0 to target value in 0.25 steps
 */
export const generateRange = (value) => {
    if (!value || value === 0) return [0];

    const targetValue = parseFloat(value);
    const range = [];

    if (targetValue < 0) {
        // For negative values: [0, -0.25, -0.50, ..., targetValue]
        for (let i = 0; i >= targetValue; i -= 0.25) {
            range.push(Math.round(i * 100) / 100);
        }
    } else {
        // For positive values: [0, 0.25, 0.50, ..., targetValue]
        for (let i = 0; i <= targetValue; i += 0.25) {
            range.push(Math.round(i * 100) / 100);
        }
    }

    return range;
};

/**
 * Determine prescription type based on sphere and cylinder signs with updated priority
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value
 * @returns {string} Prescription type: 'Minus Comp', 'Plus Comp', or 'SV Cross Comp'
 */
export const determinePrescriptionType = (sphere, cylinder) => {
    const sph = parseFloat(sphere) || 0;
    const cyl = parseFloat(cylinder) || 0;

    // Zero cylinder cases
    if (cyl === 0) {
        return sph < 0 ? 'Minus Comp' : 'Plus Comp';
    }

    // Both negative signs - Priority 1
    if (sph < 0 && cyl < 0) {
        return 'Minus Comp';
    }

    // Both positive signs - Priority 2  
    if (sph > 0 && cyl > 0) {
        return 'Plus Comp';
    }

    // Cross signs (different signs) - Priority 3
    if ((sph < 0 && cyl > 0) || (sph > 0 && cyl < 0)) {
        return 'SV Cross Comp';
    }

    // Default to Minus Comp
    return 'Minus Comp';
};

/**
 * Determine if prescription should use same sign category
 * @param {number} sphere - Sphere value  
 * @param {number} cylinder - Cylinder value
 * @param {number} transposedSphere - Transposed sphere value
 * @param {number} transposedCylinder - Transposed cylinder value
 * @returns {object} Category information with priority
 */
export const determineCategoryWithPriority = (sphere, cylinder, transposedSphere, transposedCylinder) => {
    const originalType = determinePrescriptionType(sphere, cylinder);
    const transposedType = determinePrescriptionType(transposedSphere, transposedCylinder);

    // Priority 1: Same signs (Minus) - if either original or transposed has both negative
    if (originalType === 'Minus Comp' || transposedType === 'Minus Comp') {
        return {
            category: 'Minus Comp',
            priority: 1,
            reason: 'Same signs priority: Both negative values found',
            useOriginal: originalType === 'Minus Comp',
            useTransposed: transposedType === 'Minus Comp'
        };
    }

    // Priority 2: Same signs (Plus) - if either original or transposed has both positive
    if (originalType === 'Plus Comp' || transposedType === 'Plus Comp') {
        return {
            category: 'Plus Comp',
            priority: 2,
            reason: 'Same signs priority: Both positive values found',
            useOriginal: originalType === 'Plus Comp',
            useTransposed: transposedType === 'Plus Comp'
        };
    }

    // Priority 3: Cross signs - only if both original AND transposed have cross signs
    if (originalType === 'SV Cross Comp' && transposedType === 'SV Cross Comp') {
        return {
            category: 'SV Cross Comp',
            priority: 3,
            reason: 'Cross signs: Original and transposed both have mixed signs',
            useOriginal: true,
            useTransposed: true
        };
    }

    // Fallback to Minus Comp
    return {
        category: 'Minus Comp',
        priority: 4,
        reason: 'Fallback to Minus Comp',
        useOriginal: true,
        useTransposed: false
    };
};

/**
 * Check if a prescription range matches the given sphere and cylinder values with precise matching
 * @param {string} rangeStr - Range string from data (e.g., "-6.0 to -2.0")
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value
 * @returns {boolean} True if prescription fits precisely within the range
 */
/**
 * Check if a prescription range matches the given sphere and cylinder values
 * @param {string} rangeStr - Range string from data (e.g., "-6.0 to -2.0", "+3.0 to +2.0", "+1.75 to -2.0")
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value
 * @returns {boolean} True if prescription fits within the range
 */
export const matchesRange = (rangeStr, sphere, cylinder) => {
    if (!rangeStr) return false;

    const sph = parseFloat(sphere) || 0;
    const cyl = parseFloat(cylinder) || 0;

    // Handle single sphere values (e.g., "-25.0 sph", "+18.0 sph")
    if (rangeStr.includes('sph')) {
        const match = rangeStr.match(/([+-]?\d+\.?\d*)\s*sph/);
        if (match) {
            const targetSph = parseFloat(match[1]);
            // For single sphere ranges, sphere should be close to target and cylinder should be small
            return Math.abs(sph - targetSph) <= 1.0 && Math.abs(cyl) <= 1.0;
        }
        return false;
    }

    // Handle "to" ranges (e.g., "-6.0 to -2.0", "+3.0 to +2.0", "+1.75 to -2.0")
    if (rangeStr.includes('to')) {
        const parts = rangeStr.split('to').map(part => part.trim());
        if (parts.length === 2) {
            const val1Match = parts[0].match(/([+-]?\d+\.?\d*)/);
            const val2Match = parts[1].match(/([+-]?\d+\.?\d*)/);

            if (val1Match && val2Match) {
                const sphereLimit = parseFloat(val1Match[1]); // First value is sphere range limit
                const cylinderLimit = parseFloat(val2Match[1]); // Second value is cylinder range limit

                // Sphere range check: from 0 to sphereLimit (or sphereLimit to 0 if negative)
                let sphInRange;
                if (sphereLimit < 0) {
                    // Negative sphere range: sphere should be from sphereLimit to 0 (e.g., -6.0 to 0)
                    sphInRange = sph <= 0 && sph >= sphereLimit;
                } else {
                    // Positive sphere range: sphere should be from 0 to sphereLimit (e.g., 0 to +3.0)
                    sphInRange = sph >= 0 && sph <= sphereLimit;
                }

                // Cylinder range check: from 0 to cylinderLimit (or cylinderLimit to 0 if negative)
                let cylInRange;
                if (cylinderLimit < 0) {
                    // Negative cylinder range: cylinder should be from cylinderLimit to 0 (e.g., -2.0 to 0)
                    cylInRange = cyl <= 0 && cyl >= cylinderLimit;
                } else {
                    // Positive cylinder range: cylinder should be from 0 to cylinderLimit (e.g., 0 to +2.0)
                    cylInRange = cyl >= 0 && cyl <= cylinderLimit;
                }

                return sphInRange && cylInRange;
            }
        }
    }

    // Handle ADD ranges (for bifocal/progressive)
    // Format: "+3/+ ADD" or "-3/+ ADD"
    if (rangeStr.includes('ADD')) {
        const match = rangeStr.match(/([+-]?\d+\.?\d*)/);
        if (match) {
            const baseValue = parseFloat(match[1]);

            // Cylinder can be 0 or empty (optional)
            // If cylinder is provided and not 0, return false
            if (cyl !== 0) {
                return false;
            }

            // For positive ranges like "+3/+ ADD"
            // +3/+ADD matches 0 to +3.0
            // +4/+ADD matches 3.25 to +4.0
            // +5/+ADD matches 4.25 to +5.0
            // +6/+ADD matches 5.25 to +6.0
            if (baseValue > 0) {
                let lowerLimit = 0;

                // For ranges above +3, calculate the lower limit
                if (baseValue > 3) {
                    lowerLimit = baseValue - 1 + 0.25;
                }

                const upperLimit = baseValue;
                return sph >= lowerLimit && sph <= upperLimit;
            }
            // For negative ranges like "-2/+ ADD"
            // -2/+ADD matches 0 to -2.0
            // -3/+ADD matches -2.25 to -3.0
            // -4/+ADD matches -3.25 to -4.0
            // -5/+ADD matches -4.25 to -5.0
            // -6/+ADD matches -5.25 to -6.0
            else if (baseValue < 0) {
                let upperLimit = 0;

                // For ranges below -2, calculate the upper limit
                if (baseValue < -2) {
                    upperLimit = baseValue + 1 - 0.25;
                }

                const lowerLimit = baseValue;
                return sph >= lowerLimit && sph <= upperLimit;
            } else {
                // baseValue is 0
                return sph === 0;
            }
        }
    }

    return false;
};/**
 * Find the most specific matching lens option (best fit)
 * @param {array} matches - Array of matching lens options
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value
 * @returns {object|null} The most specific match or null
 */
export const findBestMatch = (matches, sphere, cylinder) => {
    if (!matches || matches.length === 0) return null;

    // Simply return the first match since matchesRange already validated the fit
    // The priority system in findLensOptions ensures we get the right category
    return matches[0];
};

/**
 * Find matching lens options from brand data with updated priority logic
 * @param {object} brandData - Brand data object
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value  
 * @param {number} axis - Axis value
 * @param {boolean} hasAddPower - Whether this is for ADD/NV/DV calculation
 * @returns {object} Calculation results with best matches
 */
export const findLensOptions = (brandData, sphere, cylinder, axis, hasAddPower = false) => {
    if (!brandData) {
        return { error: 'Brand data not available' };
    }

    // Validate 0.25 intervals
    if (!validateQuarterInterval(sphere) || !validateQuarterInterval(cylinder)) {
        return { error: 'Values must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)' };
    }

    // Validation rules
    const sph = parseFloat(sphere) || 0;
    const cyl = parseFloat(cylinder) || 0;
    const ax = parseFloat(axis) || 0;

    // For ADD/NV/DV calculations - use Bifocal and Progressive data
    if (hasAddPower) {
        // Cylinder and axis validation for bifocal/progressive
        if (cyl !== 0 && (!axis || axis === "" || ax === 0)) {
            return { error: 'For bifocal/progressive calculations, axis is required when cylinder is entered' };
        }

        const bifocalMatches = brandData["Bifocal KT"] ?
            brandData["Bifocal KT"].filter(item => matchesRange(item.range, sphere, cylinder)) : [];

        const progressiveMatches = brandData["Progressive"] ?
            brandData["Progressive"].filter(item => matchesRange(item.range, sphere, cylinder)) : [];

        const allMatches = [...bifocalMatches, ...progressiveMatches];

        return {
            original: { sphere: sph, cylinder: cyl, axis: ax },
            transposed: transposePrescription(sphere, cylinder, axis),
            matches: allMatches,
            bestMatch: findBestMatch(allMatches, sphere, cylinder),
            priority: 'Bifocal/Progressive',
            searchStrategy: 'ADD power calculation - searched in Bifocal KT and Progressive data'
        };
    }

    // Single vision validation rules
    // 1. Axis not considered in single vision
    // 2. Only sphere entered (cylinder and axis empty) is allowed
    // 3. Cylinder entered with axis empty is allowed

    // Calculate transposed values
    const transposed = transposePrescription(sphere, cylinder || 0, axis || 90);

    const results = {
        original: { sphere: sph, cylinder: cyl, axis: ax },
        transposed: transposed,
        matches: [],
        bestMatch: null,
        searchStrategy: ''
    };

    if (!brandData.single_vision) {
        return { error: 'Single vision data not available' };
    }

    // NEW PRIORITY LOGIC: Try all categories in order: Minus Comp -> Plus Comp -> SV Cross Comp
    // For each category, try original values first, then transposed values

    // Priority 1: Try Minus Comp first (highest priority)
    if (brandData.single_vision["Minus Comp"]) {
        // Try original values first
        const originalMatches = brandData.single_vision["Minus Comp"].filter(item =>
            matchesRange(item.range, sph, cyl)
        );
        if (originalMatches.length > 0) {
            results.matches = originalMatches;
            results.bestMatch = findBestMatch(originalMatches, sph, cyl);
            results.searchStrategy = 'Priority 1: Minus Comp (Original values)';
            results.categoryInfo = { category: 'Minus Comp', priority: 1 };
            return results;
        }

        // Try transposed values
        const transposedMatches = brandData.single_vision["Minus Comp"].filter(item =>
            matchesRange(item.range, transposed.sphere, transposed.cylinder)
        );
        if (transposedMatches.length > 0) {
            results.matches = transposedMatches;
            results.bestMatch = findBestMatch(transposedMatches, transposed.sphere, transposed.cylinder);
            results.searchStrategy = 'Priority 1: Minus Comp (Transposed values)';
            results.categoryInfo = { category: 'Minus Comp', priority: 1 };
            return results;
        }
    }

    // Priority 2: Try Plus Comp second
    if (brandData.single_vision["Plus Comp"]) {
        // Try original values first
        const originalMatches = brandData.single_vision["Plus Comp"].filter(item =>
            matchesRange(item.range, sph, cyl)
        );
        if (originalMatches.length > 0) {
            results.matches = originalMatches;
            results.bestMatch = findBestMatch(originalMatches, sph, cyl);
            results.searchStrategy = 'Priority 2: Plus Comp (Original values)';
            results.categoryInfo = { category: 'Plus Comp', priority: 2 };
            return results;
        }

        // Try transposed values
        const transposedMatches = brandData.single_vision["Plus Comp"].filter(item =>
            matchesRange(item.range, transposed.sphere, transposed.cylinder)
        );
        if (transposedMatches.length > 0) {
            results.matches = transposedMatches;
            results.bestMatch = findBestMatch(transposedMatches, transposed.sphere, transposed.cylinder);
            results.searchStrategy = 'Priority 2: Plus Comp (Transposed values)';
            results.categoryInfo = { category: 'Plus Comp', priority: 2 };
            return results;
        }
    }

    // Priority 3: Try SV Cross Comp last
    if (brandData.single_vision["SV Cross Comp"]) {
        // Try original values first
        const originalMatches = brandData.single_vision["SV Cross Comp"].filter(item =>
            matchesRange(item.range, sph, cyl)
        );
        if (originalMatches.length > 0) {
            results.matches = originalMatches;
            results.bestMatch = findBestMatch(originalMatches, sph, cyl);
            results.searchStrategy = 'Priority 3: SV Cross Comp (Original values)';
            results.categoryInfo = { category: 'SV Cross Comp', priority: 3 };
            return results;
        }

        // Try transposed values
        const transposedMatches = brandData.single_vision["SV Cross Comp"].filter(item =>
            matchesRange(item.range, transposed.sphere, transposed.cylinder)
        );
        if (transposedMatches.length > 0) {
            results.matches = transposedMatches;
            results.bestMatch = findBestMatch(transposedMatches, transposed.sphere, transposed.cylinder);
            results.searchStrategy = 'Priority 3: SV Cross Comp (Transposed values)';
            results.categoryInfo = { category: 'SV Cross Comp', priority: 3 };
            return results;
        }
    }

    // No matches found
    results.searchStrategy = 'No matches found in any category';
    return results;
};

/**
 * Find ADD power matching options from brand data
 * @param {object} brandData - Brand data object
 * @param {object} distanceVision - Distance vision values {sphere, cylinder}
 * @param {number} addPower - ADD power value
 * @returns {object} Calculation results with best matches for ADD power
 */
export const findAddPowerOptions = (brandData, distanceVision, addPower) => {
    if (!brandData) {
        return { error: 'Brand data not available' };
    }

    // Validate 0.25 intervals
    if (!validateQuarterInterval(distanceVision.sphere) || !validateQuarterInterval(distanceVision.cylinder) || !validateQuarterInterval(addPower)) {
        return { error: 'Values must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)' };
    }

    const sph = parseFloat(distanceVision.sphere) || 0;
    const cyl = parseFloat(distanceVision.cylinder) || 0;

    const bifocalMatches = brandData["Bifocal KT"] ?
        brandData["Bifocal KT"].filter(item => matchesRange(item.range, sph, cyl)) : [];

    const progressiveMatches = brandData["Progressive"] ?
        brandData["Progressive"].filter(item => matchesRange(item.range, sph, cyl)) : [];

    const allMatches = [...bifocalMatches, ...progressiveMatches];

    return {
        original: { sphere: sph, cylinder: cyl, addPower },
        matches: allMatches,
        bestMatch: findBestMatch(allMatches, sph, cyl),
        searchStrategy: 'ADD power calculation - searched in Bifocal KT and Progressive data'
    };
};

/**
 * Find Near Vision matching options from brand data (Progressive SPH)
 * @param {object} brandData - Brand data object
 * @param {object} distanceVision - Distance vision values {sphere, cylinder}
 * @param {number} addPower - ADD power value
 * @returns {object} Calculation results with best matches for Progressive SPH
 */
export const findNearVisionOptions = (brandData, distanceVision, addPower) => {
    if (!brandData) {
        return { error: 'Brand data not available' };
    }

    // Validate 0.25 intervals
    if (!validateQuarterInterval(distanceVision.sphere) || !validateQuarterInterval(distanceVision.cylinder) || !validateQuarterInterval(addPower)) {
        return { error: 'Values must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)' };
    }

    const sph = parseFloat(distanceVision.sphere) || 0;
    const cyl = parseFloat(distanceVision.cylinder) || 0;

    // Search in PROGRESSIVE_SPH data (same logic as Bi-Focal KT)
    const progressiveSphMatches = brandData["PROGRESSIVE_SPH"] ?
        brandData["PROGRESSIVE_SPH"].filter(item => matchesRange(item.range, sph, cyl)) : [];

    return {
        original: { sphere: sph, cylinder: cyl, addPower },
        matches: progressiveSphMatches,
        bestMatch: findBestMatch(progressiveSphMatches, sph, cyl),
        searchStrategy: 'Progressive SPH calculation - searched in PROGRESSIVE_SPH data based on DV sphere'
    };
};

/**
 * Map axis value to CYL_KT standard axis (45, 90, 135, or 180)
 * @param {number} axis - Axis value (0-180)
 * @returns {number} Mapped axis value
 */
export const mapAxisForCylKT = (axis) => {
    const ax = parseFloat(axis) || 0;

    // 21-69 → 45
    if (ax >= 21 && ax <= 69) {
        return 45;
    }
    // 70-110 → 90
    else if (ax >= 70 && ax <= 110) {
        return 90;
    }
    // 111-155 → 135
    else if (ax >= 111 && ax <= 155) {
        return 135;
    }
    // 156-180 and 0-20 → 180
    else if ((ax >= 156 && ax <= 180) || (ax >= 0 && ax <= 20)) {
        return 180;
    }

    // Default to 180
    return 180;
};

/**
 * Check if cylinder and axis match CYL_KT range
 * @param {string} rangeStr - Range string from CYL_KT data (e.g., "+2, 180", "-4, 90")
 * @param {number} cylinder - Cylinder value
 * @param {number} axis - Axis value
 * @returns {boolean} True if matches the range
 */
export const matchesCylKTRange = (rangeStr, cylinder, axis) => {
    if (!rangeStr) return false;

    const cyl = parseFloat(cylinder) || 0;
    const ax = parseFloat(axis) || 0;

    // Parse the range string (e.g., "+2, 180" or "-4, 90")
    const parts = rangeStr.split(',').map(p => p.trim());
    if (parts.length !== 2) return false;

    const rangeCyl = parseFloat(parts[0]);
    const rangeAxis = parseFloat(parts[1]);

    // Map the input axis to standard CYL_KT axis
    const mappedAxis = mapAxisForCylKT(ax);

    // Check if axis matches
    if (mappedAxis !== rangeAxis) {
        return false;
    }

    // Check cylinder range with sequential logic
    // +2 means: 0.25 to 2.0
    // +3 means: 2.25 to 3.0
    // +4 means: 3.25 to 4.0
    // -2 means: -0.25 to -2.0
    // -3 means: -2.25 to -3.0
    // -4 means: -3.25 to -4.0

    let lowerLimit, upperLimit;

    if (rangeCyl > 0) {
        // Positive cylinder
        if (rangeCyl === 2) {
            lowerLimit = 0.25;
            upperLimit = 2.0;
        } else if (rangeCyl === 3) {
            lowerLimit = 2.25;
            upperLimit = 3.0;
        } else if (rangeCyl === 4) {
            lowerLimit = 3.25;
            upperLimit = 4.0;
        } else {
            // For any other positive value, use default logic
            lowerLimit = 0.25;
            upperLimit = rangeCyl;
        }
        return cyl > 0 && cyl >= lowerLimit && cyl <= upperLimit;

    } else if (rangeCyl < 0) {
        // Negative cylinder
        if (rangeCyl === -2) {
            lowerLimit = -0.25;
            upperLimit = -2.0;
        } else if (rangeCyl === -3) {
            lowerLimit = -2.25;
            upperLimit = -3.0;
        } else if (rangeCyl === -4) {
            lowerLimit = -3.25;
            upperLimit = -4.0;
        } else {
            // For any other negative value, use default logic
            lowerLimit = -0.25;
            upperLimit = rangeCyl;
        }
        return cyl < 0 && cyl >= upperLimit && cyl <= lowerLimit;
    }

    return false;
};

/**
 * Find CYL_KT matching options from brand data
 * @param {object} brandData - Brand data object
 * @param {number} cylinder - Cylinder value
 * @param {number} axis - Axis value
 * @returns {object} Calculation results with best matches for CYL_KT
 */
export const findCylKTOptions = (brandData, cylinder, axis) => {
    if (!brandData) {
        return { error: 'Brand data not available' };
    }

    // Validate 0.25 intervals for cylinder
    if (!validateQuarterInterval(cylinder)) {
        return { error: 'Cylinder value must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)' };
    }

    const cyl = parseFloat(cylinder) || 0;
    const ax = parseFloat(axis) || 0;

    // Cylinder must not be 0 for CYL_KT
    if (cyl === 0) {
        return { error: 'Cylinder must be non-zero for CYL_KT calculations' };
    }

    const cylKTMatches = brandData["CYL_KT"] ?
        brandData["CYL_KT"].filter(item => matchesCylKTRange(item.range, cyl, ax)) : [];

    const mappedAxis = mapAxisForCylKT(ax);

    return {
        original: { cylinder: cyl, axis: ax },
        mappedAxis: mappedAxis,
        matches: cylKTMatches,
        bestMatch: cylKTMatches.length > 0 ? cylKTMatches[0] : null,
        searchStrategy: `CYL_KT calculation - Axis ${ax}° mapped to ${mappedAxis}°`
    };
};

/**
 * Find Progressive CYL matching options from brand data
 * @param {object} brandData - Brand data object
 * @param {number} cylinder - Cylinder value
 * @param {number} axis - Axis value
 * @returns {object} Calculation results with best matches for Progressive CYL
 */
export const findProgressiveCylOptions = (brandData, cylinder, axis) => {
    if (!brandData) {
        return { error: 'Brand data not available' };
    }

    // Validate 0.25 intervals for cylinder
    if (!validateQuarterInterval(cylinder)) {
        return { error: 'Cylinder value must be in 0.25 intervals (e.g., -0.25, -0.50, -0.75, etc.)' };
    }

    const cyl = parseFloat(cylinder) || 0;
    const ax = parseFloat(axis) || 0;

    // Cylinder must not be 0 for Progressive CYL
    if (cyl === 0) {
        return { error: 'Cylinder must be non-zero for Progressive CYL calculations' };
    }

    const progressiveCylMatches = brandData["PROGRESSIVE__CYL"] ?
        brandData["PROGRESSIVE__CYL"].filter(item => matchesCylKTRange(item.range, cyl, ax)) : [];

    const mappedAxis = mapAxisForCylKT(ax);

    return {
        original: { cylinder: cyl, axis: ax },
        mappedAxis: mappedAxis,
        matches: progressiveCylMatches,
        bestMatch: progressiveCylMatches.length > 0 ? progressiveCylMatches[0] : null,
        searchStrategy: `Progressive CYL calculation - Axis ${ax}° mapped to ${mappedAxis}°`
    };
};

/**
 * Transpose prescription for COMP_KT
 * Formula: New Sphere = Old Sphere + Old Cylinder
 *          New Cylinder = -(Old Cylinder)
 *          New Axis = Old Axis ± 90° (if over 180°, subtract 180°)
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value
 * @param {number} axis - Axis value
 * @returns {object} Transposed prescription
 */
export const transposeCompKTPrescription = (sphere, cylinder, axis) => {
    const sph = parseFloat(sphere) || 0;
    const cyl = parseFloat(cylinder) || 0;
    const ax = parseFloat(axis) || 0;

    const newSphere = sph + cyl;
    const newCylinder = -cyl;
    let newAxis = ax + 90;

    if (newAxis > 180) {
        newAxis = newAxis - 180;
    }

    return {
        sphere: newSphere,
        cylinder: newCylinder,
        axis: newAxis
    };
};

/**
 * Map axis to standard COMP_KT axis values (45°, 90°, 135°, 180°)
 * @param {number} axis - Input axis value
 * @returns {number} Mapped axis
 */
export const mapAxisForCompKT = (axis) => {
    const ax = parseFloat(axis) || 0;

    // 21-69 → 45°
    if (ax >= 21 && ax <= 69) {
        return 45;
    }
    // 70-110 → 90°
    if (ax >= 70 && ax <= 110) {
        return 90;
    }
    // 111-155 → 135°
    if (ax >= 111 && ax <= 155) {
        return 135;
    }
    // 156-180 or 0-20 → 180°
    return 180;
};

/**
 * Get sphere range category for COMP_KT
 * Similar to CYL_KT logic: +2 = 0.25 to 2.0, +3 = 2.25 to 3.0, etc.
 * @param {number} sphere - Sphere value
 * @returns {number} Range category (2, 3, 4, etc.)
 */
export const getCompKTSphereRange = (sphere) => {
    const sph = Math.abs(parseFloat(sphere) || 0);

    if (sph >= 0.25 && sph <= 2.0) return 2;
    if (sph >= 2.25 && sph <= 3.0) return 3;
    if (sph >= 3.25 && sph <= 4.0) return 4;
    if (sph >= 4.25 && sph <= 5.0) return 5;
    if (sph >= 5.25 && sph <= 6.0) return 6;

    return 0; // No match
};

/**
 * Get cylinder range category for COMP_KT
 * @param {number} cylinder - Cylinder value
 * @returns {number} Range category (1, 2, 3, etc.)
 */
export const getCompKTCylinderRange = (cylinder) => {
    const cyl = Math.abs(parseFloat(cylinder) || 0);

    if (cyl >= 0.25 && cyl <= 1.0) return 1;
    if (cyl >= 1.25 && cyl <= 2.0) return 2;
    if (cyl >= 2.25 && cyl <= 3.0) return 3;
    if (cyl >= 3.25 && cyl <= 4.0) return 4;

    return 0; // No match
};

/**
 * Check if prescription matches COMP_KT range
 * @param {string} rangeStr - Range string from data (e.g., "+2/+1 180°")
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value
 * @param {number} axis - Axis value
 * @returns {boolean} True if matches
 */
export const matchesCompKTRange = (rangeStr, sphere, cylinder, axis) => {
    if (!rangeStr) return false;

    const sph = parseFloat(sphere) || 0;
    const cyl = parseFloat(cylinder) || 0;
    const ax = parseFloat(axis) || 0;

    // Parse range: "+2/+1 180°" or "-2/-1 90°" or "+1/-2 180°"
    const match = rangeStr.match(/([-+]?\d+)\/([-+]?\d+)\s+(\d+)°/);
    if (!match) return false;

    const rangeSph = parseInt(match[1]);
    const rangeCyl = parseInt(match[2]);
    const rangeAxis = parseInt(match[3]);

    // Map the input axis
    const mappedAxis = mapAxisForCompKT(ax);
    if (mappedAxis !== rangeAxis) {
        return false;
    }

    // Get sphere and cylinder range categories for input values
    const sphCategory = getCompKTSphereRange(sph);
    const cylCategory = getCompKTCylinderRange(cyl);

    // Get sphere and cylinder range categories for range values
    const rangeSphCategory = getCompKTSphereRange(rangeSph);
    const rangeCylCategory = getCompKTCylinderRange(rangeCyl);

    // Check sign matches
    const sphSign = sph >= 0 ? 1 : -1;
    const cylSign = cyl >= 0 ? 1 : -1;
    const rangeSphSign = rangeSph >= 0 ? 1 : -1;
    const rangeCylSign = rangeCyl >= 0 ? 1 : -1;

    // Match sphere: category must match and sign must match
    if (sphCategory !== rangeSphCategory || sphSign !== rangeSphSign) {
        return false;
    }

    // Match cylinder: category must match and sign must match
    if (cylCategory !== rangeCylCategory || cylSign !== rangeCylSign) {
        return false;
    }

    return true;
};

/**
 * Get priority score for COMP_KT matches
 * Priority: 1. +,+ (both positive)  2. -,- (both negative)  3. +,- or -,+ (mixed)
 * @param {string} rangeStr - Range string
 * @returns {number} Priority score (lower is better)
 */
export const getCompKTPriority = (rangeStr) => {
    const match = rangeStr.match(/([-+]?\d+)\/([-+]?\d+)/);
    if (!match) return 999;

    const sphSign = match[1].startsWith('-') ? -1 : 1;
    const cylSign = match[2].startsWith('-') ? -1 : 1;

    // Priority 1: Both positive
    if (sphSign > 0 && cylSign > 0) return 1;
    // Priority 2: Both negative
    if (sphSign < 0 && cylSign < 0) return 2;
    // Priority 3: Mixed signs
    return 3;
};

/**
 * Find COMP_KT matching options from brand data
 * @param {object} brandData - Brand data object
 * @param {number} dvSphere - Distance Vision sphere
 * @param {number} dvCylinder - Distance Vision cylinder
 * @param {number} dvAxis - Distance Vision axis
 * @param {number} nvSphere - Near Vision sphere (optional)
 * @param {number} addPower - ADD power (optional)
 * @returns {object} Calculation results with best matches for COMP_KT
 */
export const findCompKTOptions = (brandData, dvSphere, dvCylinder, dvAxis, nvSphere = null, addPower = null) => {
    if (!brandData) {
        return { error: 'Brand data not available' };
    }

    // Validate 0.25 intervals
    if (!validateQuarterInterval(dvSphere)) {
        return { error: 'DV Sphere value must be in 0.25 intervals' };
    }
    if (!validateQuarterInterval(dvCylinder)) {
        return { error: 'DV Cylinder value must be in 0.25 intervals' };
    }

    const dvSph = parseFloat(dvSphere) || 0;
    const dvCyl = parseFloat(dvCylinder) || 0;
    const dvAx = parseFloat(dvAxis) || 0;

    // Calculate ADD or NV if one is provided
    let calculatedAdd = addPower;
    let calculatedNV = nvSphere;

    if (nvSphere && !addPower) {
        // Calculate ADD = NV - DV
        calculatedAdd = parseFloat(nvSphere) - dvSph;
    } else if (addPower && !nvSphere) {
        // Calculate NV = DV + ADD
        calculatedNV = dvSph + parseFloat(addPower);
    }

    // Validate ADD range (1.0 to 3.0)
    if (calculatedAdd !== null && (calculatedAdd < 1.0 || calculatedAdd > 3.0)) {
        return { error: 'ADD Power must be between 1.0 and 3.0' };
    }

    // Cylinders must not be 0 for COMP_KT
    if (dvCyl === 0) {
        return { error: 'Cylinder must be non-zero for COMP_KT calculations' };
    }

    // Find matches for original prescription
    const originalMatches = brandData["COMP_KT"] ?
        brandData["COMP_KT"].filter(item => matchesCompKTRange(item.range, dvSph, dvCyl, dvAx)) : [];

    // Transpose and find matches
    const transposed = transposeCompKTPrescription(dvSph, dvCyl, dvAx);
    const transposedMatches = brandData["COMP_KT"] ?
        brandData["COMP_KT"].filter(item =>
            matchesCompKTRange(item.range, transposed.sphere, transposed.cylinder, transposed.axis)
        ) : [];

    let allMatches = [];
    let searchStrategy = '';

    // Strategy: First check original, then transposed, combine if both have matches
    if (originalMatches.length > 0 && transposedMatches.length === 0) {
        // Only original matches found
        allMatches = originalMatches.map(m => ({ ...m, isTransposed: false }));
        searchStrategy = `COMP_KT - Found ${originalMatches.length} match(es) using original prescription`;
    } else if (originalMatches.length === 0 && transposedMatches.length > 0) {
        // Only transposed matches found
        allMatches = transposedMatches.map(m => ({ ...m, isTransposed: true }));
        searchStrategy = `COMP_KT - Found ${transposedMatches.length} match(es) using transposed prescription`;
    } else if (originalMatches.length > 0 && transposedMatches.length > 0) {
        // Both have matches - combine and sort by priority
        allMatches = [
            ...originalMatches.map(m => ({ ...m, isTransposed: false })),
            ...transposedMatches.map(m => ({ ...m, isTransposed: true }))
        ];
        searchStrategy = `COMP_KT - Found matches in both original (${originalMatches.length}) and transposed (${transposedMatches.length}), sorted by priority`;
    } else {
        // No matches found
        searchStrategy = `COMP_KT - No matches found for axis ${dvAx}° (mapped to ${mapAxisForCompKT(dvAx)}°)`;
    }

    // Sort by priority if we have matches
    if (allMatches.length > 0) {
        allMatches.sort((a, b) => {
            const priorityA = getCompKTPriority(a.range);
            const priorityB = getCompKTPriority(b.range);
            return priorityA - priorityB;
        });
    }

    const mappedAxis = mapAxisForCompKT(dvAx);

    return {
        original: { sphere: dvSph, cylinder: dvCyl, axis: dvAx },
        transposed: transposed,
        mappedAxis: mappedAxis,
        calculatedAdd: calculatedAdd,
        calculatedNV: calculatedNV,
        matches: allMatches,
        bestMatch: allMatches.length > 0 ? allMatches[0] : null,
        searchStrategy: `${searchStrategy}. Priority: +/+ > -/- > mixed signs`
    };
};

/**
 * Check if prescription matches Progressive COMP range
 * @param {string} rangeStr - Range string from data (e.g., "+2/-2, 180°", "-2/-1, 90°")
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value
 * @param {number} axis - Axis value
 * @returns {boolean} True if matches
 */
export const matchesProgressiveCompRange = (rangeStr, sphere, cylinder, axis) => {
    if (!rangeStr) return false;

    const sph = parseFloat(sphere) || 0;
    const cyl = parseFloat(cylinder) || 0;
    const ax = parseFloat(axis) || 0;

    // Parse range with comma: "+2/-2, 180°" or "-2/-1, 90°" or "+2/+1, 180°"
    const match = rangeStr.match(/([-+]?\d+)\/([-+]?\d+),\s*(\d+)°/);
    if (!match) return false;

    const rangeSph = parseInt(match[1]);
    const rangeCyl = parseInt(match[2]);
    const rangeAxis = parseInt(match[3]);

    // Map the input axis
    const mappedAxis = mapAxisForCompKT(ax);
    if (mappedAxis !== rangeAxis) {
        return false;
    }

    // Get sphere and cylinder range categories for input values
    const sphCategory = getCompKTSphereRange(sph);
    const cylCategory = getCompKTCylinderRange(cyl);

    // Get sphere and cylinder range categories for range values
    const rangeSphCategory = getCompKTSphereRange(rangeSph);
    const rangeCylCategory = getCompKTCylinderRange(rangeCyl);

    // Check sign matches
    const sphSign = sph >= 0 ? 1 : -1;
    const cylSign = cyl >= 0 ? 1 : -1;
    const rangeSphSign = rangeSph >= 0 ? 1 : -1;
    const rangeCylSign = rangeCyl >= 0 ? 1 : -1;

    // Match sphere: category must match and sign must match
    if (sphCategory !== rangeSphCategory || sphSign !== rangeSphSign) {
        return false;
    }

    // Match cylinder: category must match and sign must match
    if (cylCategory !== rangeCylCategory || cylSign !== rangeCylSign) {
        return false;
    }

    return true;
};

/**
 * Get priority score for Progressive COMP matches
 * Priority: 1. +,+ (both positive)  2. -,- (both negative)  3. +,- or -,+ (mixed)
 * @param {string} rangeStr - Range string
 * @returns {number} Priority score (lower is better)
 */
export const getProgressiveCompPriority = (rangeStr) => {
    const match = rangeStr.match(/([-+]?\d+)\/([-+]?\d+),/);
    if (!match) return 999;

    const sphSign = match[1].startsWith('-') ? -1 : 1;
    const cylSign = match[2].startsWith('-') ? -1 : 1;

    // Priority 1: Both positive
    if (sphSign > 0 && cylSign > 0) return 1;
    // Priority 2: Both negative
    if (sphSign < 0 && cylSign < 0) return 2;
    // Priority 3: Mixed signs
    return 3;
};

/**
 * Find Progressive COMP matching options from brand data
 * @param {object} brandData - Brand data object
 * @param {number} dvSphere - Distance Vision sphere
 * @param {number} dvCylinder - Distance Vision cylinder
 * @param {number} dvAxis - Distance Vision axis
 * @param {number} nvSphere - Near Vision sphere (optional)
 * @param {number} addPower - ADD power (optional)
 * @returns {object} Calculation results with best matches for Progressive COMP
 */
export const findProgressiveCompOptions = (brandData, dvSphere, dvCylinder, dvAxis, nvSphere = null, addPower = null) => {
    if (!brandData) {
        return { error: 'Brand data not available' };
    }

    // Validate 0.25 intervals
    if (!validateQuarterInterval(dvSphere)) {
        return { error: 'DV Sphere value must be in 0.25 intervals' };
    }
    if (!validateQuarterInterval(dvCylinder)) {
        return { error: 'DV Cylinder value must be in 0.25 intervals' };
    }

    const dvSph = parseFloat(dvSphere) || 0;
    const dvCyl = parseFloat(dvCylinder) || 0;
    const dvAx = parseFloat(dvAxis) || 0;

    // Calculate ADD or NV if one is provided
    let calculatedAdd = addPower;
    let calculatedNV = nvSphere;

    if (nvSphere && !addPower) {
        // Calculate ADD = NV - DV
        calculatedAdd = parseFloat(nvSphere) - dvSph;
    } else if (addPower && !nvSphere) {
        // Calculate NV = DV + ADD
        calculatedNV = dvSph + parseFloat(addPower);
    }

    // Validate ADD range (1.0 to 3.0)
    if (calculatedAdd !== null && (calculatedAdd < 1.0 || calculatedAdd > 3.0)) {
        return { error: 'ADD Power must be between 1.0 and 3.0' };
    }

    // Cylinders must not be 0 for Progressive COMP
    if (dvCyl === 0) {
        return { error: 'Cylinder must be non-zero for Progressive COMP calculations' };
    }

    // Find matches for original prescription
    const originalMatches = brandData["PROGRESSIVE_COMP"] ?
        brandData["PROGRESSIVE_COMP"].filter(item => matchesProgressiveCompRange(item.range, dvSph, dvCyl, dvAx)) : [];

    // Transpose and find matches
    const transposed = transposeCompKTPrescription(dvSph, dvCyl, dvAx);
    const transposedMatches = brandData["PROGRESSIVE_COMP"] ?
        brandData["PROGRESSIVE_COMP"].filter(item =>
            matchesProgressiveCompRange(item.range, transposed.sphere, transposed.cylinder, transposed.axis)
        ) : [];

    let allMatches = [];
    let searchStrategy = '';

    // Strategy: First check original, then transposed, combine if both have matches
    if (originalMatches.length > 0 && transposedMatches.length === 0) {
        // Only original matches found
        allMatches = originalMatches.map(m => ({ ...m, isTransposed: false }));
        searchStrategy = `Progressive COMP - Found ${originalMatches.length} match(es) using original prescription`;
    } else if (originalMatches.length === 0 && transposedMatches.length > 0) {
        // Only transposed matches found
        allMatches = transposedMatches.map(m => ({ ...m, isTransposed: true }));
        searchStrategy = `Progressive COMP - Found ${transposedMatches.length} match(es) using transposed prescription`;
    } else if (originalMatches.length > 0 && transposedMatches.length > 0) {
        // Both have matches - combine and sort by priority
        allMatches = [
            ...originalMatches.map(m => ({ ...m, isTransposed: false })),
            ...transposedMatches.map(m => ({ ...m, isTransposed: true }))
        ];
        searchStrategy = `Progressive COMP - Found matches in both original (${originalMatches.length}) and transposed (${transposedMatches.length}), sorted by priority`;
    } else {
        // No matches found
        searchStrategy = `Progressive COMP - No matches found for axis ${dvAx}° (mapped to ${mapAxisForCompKT(dvAx)}°)`;
    }

    // Sort by priority if we have matches
    if (allMatches.length > 0) {
        allMatches.sort((a, b) => {
            const priorityA = getProgressiveCompPriority(a.range);
            const priorityB = getProgressiveCompPriority(b.range);
            return priorityA - priorityB;
        });
    }

    const mappedAxis = mapAxisForCompKT(dvAx);

    return {
        original: { sphere: dvSph, cylinder: dvCyl, axis: dvAx },
        transposed: transposed,
        mappedAxis: mappedAxis,
        calculatedAdd: calculatedAdd,
        calculatedNV: calculatedNV,
        matches: allMatches,
        bestMatch: allMatches.length > 0 ? allMatches[0] : null,
        searchStrategy: `${searchStrategy}. Priority: +/+ > -/- > mixed signs`
    };
};

/**
 * Find Crizal lens options based on prescription
 * @param {object} brandData - Crizal brand data
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value
 * @param {number} axis - Axis value
 * @returns {object} Matching lens options with product details
 */
export const findCrizalLensOptions = (brandData, sphere, cylinder, axis) => {
    const sph = parseFloat(sphere) || 0;
    const cyl = parseFloat(cylinder) || 0;
    const ax = parseFloat(axis) || 90;

    // Check if brandData has the correct structure for Crizal
    if (!brandData.products) {
        return {
            original: { sphere: sph, cylinder: cyl, axis: ax },
            matches: [],
            bestMatch: null,
            error: 'Invalid Crizal data structure'
        };
    }

    // Transpose the prescription
    const transposed = transposePrescription(sph, cyl, ax);

    // Determine which product types to search based on ORIGINAL cylinder value
    // FSV (stock lenses): Priority when cylinder is between -2 and +2
    // RX (single vision): Only when cylinder is outside -2 to +2 range
    const isCylInFSVRange = cyl >= -2 && cyl <= 2;

    // Helper function to check a prescription against variants
    const checkPrescription = (checkSph, checkCyl, isTransposed) => {
        const foundMatches = [];

        // Iterate through all products
        Object.keys(brandData.products).forEach(productKey => {
            const product = brandData.products[productKey];
            const productName = product.name;
            const productType = product.type;

            // Filter based on ORIGINAL cylinder range and product type
            // This ensures FSV has priority when original cylinder is -2 to +2
            if (productType === "FSV_STOCK_LENS" && !isCylInFSVRange) {
                return; // Skip FSV Stock Lens products if ORIGINAL cylinder is outside -2 to +2
            }
            // Note: FSV_OTHER_RANGE is NOT filtered here because some products like Elements 1.60 
            // have variants with extended cylinder ranges (e.g., 0 to -4) that go beyond the standard FSV range
            // RX_SINGLE_VISION and RX_PHOTOCHROMIC are now available for all cylinder ranges
            // FSV_PHOTOCHROMIC follows FSV_STOCK_LENS filtering logic
            if (productType === "FSV_PHOTOCHROMIC" && !isCylInFSVRange) {
                return; // Skip FSV Photochromic products if ORIGINAL cylinder is outside -2 to +2
            }
            // DIGITAL_ENHANCED_SINGLE_VISION follows FSV_STOCK_LENS filtering logic
            if (productType === "DIGITAL_ENHANCED_SINGLE_VISION" && !isCylInFSVRange) {
                return; // Skip Digital Enhanced SV products if ORIGINAL cylinder is outside -2 to +2
            }
            // RX_DIGITAL_ENHANCED_SINGLE_VISION is now available for all cylinder ranges

            // Iterate through all variants of this product
            if (product.variants && Array.isArray(product.variants)) {
                product.variants.forEach(variant => {
                    let isMatch = false;

                    // Check if prescription falls within the power range
                    if (variant.power_range) {
                        const pr = variant.power_range;

                        // Handle standard min/max ranges
                        if (pr.sph_min !== undefined && pr.sph_max !== undefined &&
                            pr.cyl_min !== undefined && pr.cyl_max !== undefined) {
                            
                            // Determine the actual min and max for sphere
                            const actualSphMin = Math.min(pr.sph_min, pr.sph_max);
                            const actualSphMax = Math.max(pr.sph_min, pr.sph_max);
                            
                            // Check if sphere is within range
                            const sphInRange = checkSph >= actualSphMin && checkSph <= actualSphMax;
                            
                            // Determine the actual min and max for cylinder
                            const actualCylMin = Math.min(pr.cyl_min, pr.cyl_max);
                            const actualCylMax = Math.max(pr.cyl_min, pr.cyl_max);
                            
                            // Check if cylinder is within range
                            const cylInRange = checkCyl >= actualCylMin && checkCyl <= actualCylMax;

                            // Calculate RP (Resultant Power) = SPH + CYL
                            const calculatedRP = checkSph + checkCyl;
                            
                            // Check if RP is within the rp_max limit
                            let rpInRange = true;
                            if (variant.rp_max !== undefined && variant.rp_max !== "NA") {
                                const rpMax = parseFloat(variant.rp_max);
                                if (rpMax < 0) {
                                    rpInRange = calculatedRP >= rpMax;
                                } else {
                                    rpInRange = calculatedRP <= rpMax;
                                }
                            }

                            isMatch = sphInRange && cylInRange && rpInRange;
                        }
                        // Handle special type ranges like "Plano/-4"
                        else if (pr.sph_type) {
                            const match = pr.sph_type.match(/Plano\/([-+]?\d+\.?\d*)/i);
                            if (match) {
                                const targetSph = parseFloat(match[1]);
                                const actualSphMin = Math.min(0, targetSph);
                                const actualSphMax = Math.max(0, targetSph);
                                
                                const sphInRange = checkSph >= actualSphMin && checkSph <= actualSphMax;
                                
                                let cylInRange = true;
                                if (variant.max_cyl !== undefined && variant.max_cyl !== "NA") {
                                    const actualCylMin = Math.min(0, variant.max_cyl);
                                    const actualCylMax = Math.max(0, variant.max_cyl);
                                    cylInRange = checkCyl >= actualCylMin && checkCyl <= actualCylMax;
                                }
                                
                                const calculatedRP = checkSph + checkCyl;
                                
                                let rpInRange = true;
                                if (variant.rp_max !== undefined && variant.rp_max !== "NA") {
                                    const rpMax = parseFloat(variant.rp_max);
                                    if (rpMax < 0) {
                                        rpInRange = calculatedRP >= rpMax;
                                    } else {
                                        rpInRange = calculatedRP <= rpMax;
                                    }
                                }
                                
                                isMatch = sphInRange && cylInRange && rpInRange;
                            }
                        }
                    }

                    // If this variant matches, add it to results
                    if (isMatch && variant.available) {
                        // Handle "Easy Pro Rock" - split into two separate products
                        if (productName === "Easy Pro Rock") {
                            foundMatches.push({
                                productName: "Easy Pro",
                                productKey: productKey,
                                index: variant.index,
                                dia: variant.dia,
                                coating: variant.coating || product.coating || "Easy Pro",
                                price: variant.price,
                                power_range: variant.power_range,
                                rp_max: variant.rp_max,
                                max_cyl: variant.max_cyl,
                                sph_min: variant.power_range?.sph_min,
                                sph_max: variant.power_range?.sph_max,
                                cyl_min: variant.power_range?.cyl_min,
                                cyl_max: variant.power_range?.cyl_max,
                                sph_type: variant.power_range?.sph_type,
                                material: variant.material,
                                blue_uv_capture: variant.blue_uv_capture || false,
                                colors: variant.colors || [],
                                colors_INDIA: variant.colors_INDIA || variant.colors || [],
                                colors_INTERNATIONAL: variant.colors_INTERNATIONAL || variant.international_colors || [],
                                international_colors: variant.international_colors || [],
                                photochromic: variant.photochromic || false,
                                tat_note: variant.tat_note || null,
                                international_charge: variant.international_charge || null,
                                isTransposed: isTransposed
                            });
                            foundMatches.push({
                                productName: "Rock",
                                productKey: productKey,
                                index: variant.index,
                                dia: variant.dia,
                                coating: variant.coating || product.coating || "Rock",
                                price: variant.price,
                                power_range: variant.power_range,
                                rp_max: variant.rp_max,
                                max_cyl: variant.max_cyl,
                                sph_min: variant.power_range?.sph_min,
                                sph_max: variant.power_range?.sph_max,
                                cyl_min: variant.power_range?.cyl_min,
                                cyl_max: variant.power_range?.cyl_max,
                                sph_type: variant.power_range?.sph_type,
                                material: variant.material,
                                blue_uv_capture: variant.blue_uv_capture || false,
                                colors: variant.colors || [],
                                colors_INDIA: variant.colors_INDIA || variant.colors || [],
                                colors_INTERNATIONAL: variant.colors_INTERNATIONAL || variant.international_colors || [],
                                international_colors: variant.international_colors || [],
                                photochromic: variant.photochromic || false,
                                tat_note: variant.tat_note || null,
                                international_charge: variant.international_charge || null,
                                isTransposed: isTransposed
                            });
                        } else {
                            foundMatches.push({
                                productName: productName,
                                productKey: productKey,
                                index: variant.index,
                                dia: variant.dia,
                                coating: variant.coating || product.coating || null,
                                price: variant.price,
                                power_range: variant.power_range,
                                rp_max: variant.rp_max,
                                max_cyl: variant.max_cyl,
                                sph_min: variant.power_range?.sph_min,
                                sph_max: variant.power_range?.sph_max,
                                cyl_min: variant.power_range?.cyl_min,
                                cyl_max: variant.power_range?.cyl_max,
                                sph_type: variant.power_range?.sph_type,
                                material: variant.material,
                                blue_uv_capture: variant.blue_uv_capture || false,
                                colors: variant.colors || [],
                                colors_INDIA: variant.colors_INDIA || variant.colors || [],
                                colors_INTERNATIONAL: variant.colors_INTERNATIONAL || variant.international_colors || [],
                                international_colors: variant.international_colors || [],
                                photochromic: variant.photochromic || false,
                                tat_note: variant.tat_note || null,
                                international_charge: variant.international_charge || null,
                                isTransposed: isTransposed
                            });
                        }
                    }
                });
            }
        });

        return foundMatches;
    };

    // Try original prescription
    let matches = checkPrescription(sph, cyl, false);
    let searchStrategy = 'Original prescription';

    // Also try transposed if cylinder is not zero
    if (cyl !== 0) {
        const transposedMatches = checkPrescription(transposed.sphere, transposed.cylinder, true);
        
        // If original had no matches, use transposed
        if (matches.length === 0 && transposedMatches.length > 0) {
            matches = transposedMatches;
            searchStrategy = 'Transposed prescription';
        }
        // If both have matches, combine them
        else if (transposedMatches.length > 0) {
            matches = [...matches, ...transposedMatches];
            searchStrategy = 'Original and Transposed prescriptions';
        }
    }

    // Remove duplicates: Keep only the lowest price for each product+index combination
    const uniqueMatches = {};
    matches.forEach(match => {
        const key = `${match.productName}_${match.index}`;
        if (!uniqueMatches[key] || uniqueMatches[key].price > match.price) {
            uniqueMatches[key] = match;
        }
    });

    // Convert back to array and sort by price (lowest first)
    const finalMatches = Object.values(uniqueMatches);
    finalMatches.sort((a, b) => a.price - b.price);

    return {
        original: { sphere: sph, cylinder: cyl, axis: ax },
        transposed: transposed,
        matches: finalMatches,
        bestMatch: finalMatches.length > 0 ? finalMatches[0] : null,
        totalMatches: finalMatches.length,
        searchStrategy: searchStrategy
    };
};
/**
 * Find Crizal RX lens options specifically (force RX product search)
 * This is used to show RX options as add-ons even when FSV is the primary match
 * @param {object} brandData - Crizal brand data object
 * @param {number} sphere - Sphere value
 * @param {number} cylinder - Cylinder value
 * @param {number} axis - Axis value
 * @returns {object} Calculation results with matches
 */
export const findCrizalRxOptions = (brandData, sphere, cylinder, axis) => {
    const sph = parseFloat(sphere) || 0;
    const cyl = parseFloat(cylinder) || 0;
    const ax = parseFloat(axis) || 90;

    // Check if brandData has the correct structure for Crizal
    if (!brandData.products) {
        return {
            original: { sphere: sph, cylinder: cyl, axis: ax },
            matches: [],
            bestMatch: null,
            error: 'Invalid Crizal data structure'
        };
    }

    // Transpose the prescription
    const transposed = transposePrescription(sph, cyl, ax);

    // Helper function to check a prescription against RX variants only
    const checkPrescription = (checkSph, checkCyl, isTransposed) => {
        const foundMatches = [];

        // Iterate through all products - ONLY RX_SINGLE_VISION type
        Object.keys(brandData.products).forEach(productKey => {
            const product = brandData.products[productKey];
            const productName = product.name;
            const productType = product.type;

            // Only process RX_SINGLE_VISION products
            if (productType !== "RX_SINGLE_VISION") {
                return; // Skip non-RX products
            }

            // Iterate through all variants of this product
            if (product.variants && Array.isArray(product.variants)) {
                product.variants.forEach(variant => {
                    let isMatch = false;

                    // Check if prescription falls within the power range
                    if (variant.power_range) {
                        const pr = variant.power_range;

                        // Handle standard min/max ranges
                        if (pr.sph_min !== undefined && pr.sph_max !== undefined &&
                            pr.cyl_min !== undefined && pr.cyl_max !== undefined) {
                            
                            // Determine the actual min and max for sphere
                            const actualSphMin = Math.min(pr.sph_min, pr.sph_max);
                            const actualSphMax = Math.max(pr.sph_min, pr.sph_max);
                            
                            // Check if sphere is within range
                            const sphInRange = checkSph >= actualSphMin && checkSph <= actualSphMax;
                            
                            // Determine the actual min and max for cylinder
                            const actualCylMin = Math.min(pr.cyl_min, pr.cyl_max);
                            const actualCylMax = Math.max(pr.cyl_min, pr.cyl_max);
                            
                            // Check if cylinder is within range
                            const cylInRange = checkCyl >= actualCylMin && checkCyl <= actualCylMax;

                            isMatch = sphInRange && cylInRange;
                        }
                    }

                    // If this variant matches, add it to results
                    if (isMatch && variant.available) {
                        foundMatches.push({
                            productName: productName,
                            productKey: productKey,
                            index: variant.index,
                            dia: variant.dia,
                            price: variant.price,
                            power_range: variant.power_range,
                            material: variant.material,
                            isTransposed: isTransposed
                        });
                    }
                });
            }
        });

        return foundMatches;
    };

    // Try original prescription
    let matches = checkPrescription(sph, cyl, false);
    let searchStrategy = 'Original prescription (RX only)';

    // Also try transposed if cylinder is not zero
    if (cyl !== 0) {
        const transposedMatches = checkPrescription(transposed.sphere, transposed.cylinder, true);
        
        // If original had no matches, use transposed
        if (matches.length === 0 && transposedMatches.length > 0) {
            matches = transposedMatches;
            searchStrategy = 'Transposed prescription (RX only)';
        }
        // If both have matches, combine them
        else if (transposedMatches.length > 0) {
            matches = [...matches, ...transposedMatches];
            searchStrategy = 'Original and Transposed prescriptions (RX only)';
        }
    }

    // Remove duplicates: Keep only the lowest price for each product+index combination
    const uniqueMatches = {};
    matches.forEach(match => {
        const key = `${match.productName}_${match.index}`;
        if (!uniqueMatches[key] || uniqueMatches[key].price > match.price) {
            uniqueMatches[key] = match;
        }
    });

    // Convert back to array and sort by price (lowest first)
    const finalMatches = Object.values(uniqueMatches);
    finalMatches.sort((a, b) => a.price - b.price);

    return {
        original: { sphere: sph, cylinder: cyl, axis: ax },
        transposed: transposed,
        matches: finalMatches,
        bestMatch: finalMatches.length > 0 ? finalMatches[0] : null,
        totalMatches: finalMatches.length,
        searchStrategy: searchStrategy
    };
};
