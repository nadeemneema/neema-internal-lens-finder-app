import { transposePrescription } from './prescriptionCalculations.js';

/**
 * Find Crizal Bifocal lens options (for Bifocal KT calculation mode)
 * @param {object} brandData - Crizal brand data object
 * @param {number} dvSphere - Distance Vision Sphere value
 * @param {number} dvCylinder - Distance Vision Cylinder value
 * @param {number} dvAxis - Distance Vision Axis value
 * @param {number} addPower - ADD power value
 * @returns {object} Calculation results with matches
 */
export const findCrizalBifocalOptions = (brandData, dvSphere, dvCylinder, dvAxis, addPower) => {
    const sph = parseFloat(dvSphere) || 0;
    const cyl = parseFloat(dvCylinder) || 0;
    const ax = parseFloat(dvAxis) || 90;
    const add = parseFloat(addPower) || 0;

    console.log('=== Crizal Bifocal Calculation ===');
    console.log('Input:', { sph, cyl, ax, add });

    // Check if brandData has the correct structure for Crizal
    if (!brandData.products) {
        console.error('Invalid brandData structure');
        return {
            original: { sphere: sph, cylinder: cyl, axis: ax, add: add },
            matches: [],
            bestMatch: null,
            error: 'Invalid Crizal data structure'
        };
    }

    // Count bifocal products
    const bifocalProducts = Object.keys(brandData.products).filter(key => {
        const type = brandData.products[key].type;
        return type === 'BIFOCAL' || type === 'BIFOCAL_PHOTOCHROMIC';
    });
    console.log(`Found ${bifocalProducts.length} bifocal products in data:`, bifocalProducts);

    // Transpose the prescription
    const transposed = transposePrescription(sph, cyl, ax);

    // Helper function to check a prescription against variants
    const checkPrescription = (checkSph, checkCyl, isTransposed) => {
        const foundMatches = [];

        // Iterate through all products
        Object.keys(brandData.products).forEach(productKey => {
            const product = brandData.products[productKey];
            const productName = product.name;
            const productType = product.type;

            // Only check BIFOCAL and BIFOCAL_PHOTOCHROMIC products
            if (productType !== 'BIFOCAL' && productType !== 'BIFOCAL_PHOTOCHROMIC') {
                return;
            }

            // Iterate through all variants of this product
            if (product.variants && Array.isArray(product.variants)) {
                product.variants.forEach(variant => {
                    let isMatch = false;

                    // Check if prescription falls within the power range
                    if (variant.power_range) {
                        const pr = variant.power_range;

                        // Check if all required fields exist
                        if (pr.sph_min !== undefined && pr.sph_max !== undefined &&
                            pr.cyl_min !== undefined && pr.cyl_max !== undefined &&
                            pr.add_min !== undefined && pr.add_max !== undefined) {
                            
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

                            // Check if ADD power is within range
                            const addInRange = add >= pr.add_min && add <= pr.add_max;

                            isMatch = sphInRange && cylInRange && addInRange;

                            // Debug logging for D Bi-focal
                            if (productName.includes('D Bi-focal')) {
                                console.log(`${productName} ${variant.index} ${variant.coating}:`, {
                                    sphInRange, cylInRange, addInRange, isMatch,
                                    checkSph, checkCyl, add,
                                    sphRange: `${actualSphMin} to ${actualSphMax}`,
                                    cylRange: `${actualCylMin} to ${actualCylMax}`,
                                    addRange: `${pr.add_min} to ${pr.add_max}`
                                });
                            }
                        }
                    }

                    if (isMatch) {
                        foundMatches.push({
                            productKey: productKey,
                            productName: productName,
                            productType: productType,
                            index: variant.index,
                            dia: variant.dia,
                            coating: variant.coating || 'Standard',
                            price: variant.price,
                            available: variant.available,
                            power_range: variant.power_range,
                            color: variant.color,
                            photochromic: variant.photochromic || false,
                            prescriptionUsed: {
                                sphere: checkSph,
                                cylinder: checkCyl,
                                axis: ax,
                                add: add,
                                transposed: isTransposed
                            }
                        });
                    }
                });
            }
        });

        return foundMatches;
    };

    // Try original prescription
    let matches = checkPrescription(sph, cyl, false);
    console.log(`Original prescription matches: ${matches.length}`);
    let searchStrategy = matches.length > 0 ? "Original prescription matched" : "";

    // If no matches with original, try transposed
    if (matches.length === 0 && transposed) {
        matches = checkPrescription(transposed.sphere, transposed.cylinder, true);
        console.log(`Transposed prescription matches: ${matches.length}`);
        searchStrategy = matches.length > 0 ? "Transposed prescription matched" : "No matches found";
    }

    console.log(`Total matches found: ${matches.length}`);

    // Remove duplicates - keep each unique product/index/coating/dia combination
    const uniqueMatches = {};
    matches.forEach(match => {
        const key = `${match.productKey}_${match.index}_${match.coating}_${match.dia}`;
        if (!uniqueMatches[key] || uniqueMatches[key].price > match.price) {
            uniqueMatches[key] = match;
        }
    });

    console.log(`After deduplication: ${Object.keys(uniqueMatches).length} unique matches`);

    // Convert back to array and sort by coating type and price
    const finalMatches = Object.values(uniqueMatches);
    finalMatches.sort((a, b) => {
        // Sort by coating priority first (SHC < TITUS < Crizal Easy Pro < Crizal Rock < Crizal Prevencia)
        const coatingOrder = {
            'SHC': 1,
            'TITUS': 2,
            'Crizal Easy Pro': 3,
            'Crizal Rock': 4,
            'Crizal Prevencia': 5
        };
        const orderA = coatingOrder[a.coating] || 99;
        const orderB = coatingOrder[b.coating] || 99;
        
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        
        // Then by price
        return a.price - b.price;
    });

    return {
        original: { sphere: sph, cylinder: cyl, axis: ax, add: add },
        transposed: transposed,
        matches: finalMatches,
        bestMatch: finalMatches.length > 0 ? finalMatches[0] : null,
        totalMatches: finalMatches.length,
        searchStrategy: searchStrategy
    };
};
