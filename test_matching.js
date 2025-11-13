import { findLensOptions, transposePrescription } from './src/utils/prescriptionCalculations.js';
import { loadBrandData } from './src/utils/brandDataLoader.js';

// Test cases from user
const testCases = [
    { sphere: -0.25, cylinder: 0, expected: "-6 -2" },
    { sphere: 0, cylinder: -0.25, expected: "-6 -2" },
    { sphere: 0.25, cylinder: 0, expected: "+3 +2" },
    { sphere: 0, cylinder: 0.25, expected: "+3 +2" },
    { sphere: 0.25, cylinder: -0.25, expected: "+1.75 -2" },
    { sphere: -0.25, cylinder: 0.25, expected: "+1.75 -2" },
    { sphere: 1, cylinder: -1, expected: "+1.75 -2" },
    { sphere: -1, cylinder: 1, expected: "+1.75 -2" },
    { sphere: 1.5, cylinder: -1.5, expected: "+1.75 -2" },
    { sphere: -1.5, cylinder: 1.5, expected: "+1.75 -2" },
    { sphere: 0, cylinder: 0, expected: "+1.75 -2" }
];

async function runTests() {
    try {
        const brandData = await loadBrandData('Enterprise');

        console.log('Testing prescription matching logic:');
        console.log('=====================================\n');

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const { sphere, cylinder, expected } = testCase;

            console.log(`Test ${i + 1}: Sphere ${sphere}, Cylinder ${cylinder}`);
            console.log(`Expected: ${expected}`);

            // Test original values
            const originalResult = findLensOptions(brandData, sphere, cylinder, 0);
            console.log(`Original result: ${originalResult.bestMatch ? `${originalResult.categoryInfo?.category} - ${originalResult.bestMatch.range}` : 'No match'}`);

            // Test transposed values
            const transposed = transposePrescription(sphere, cylinder, 0);
            const transposedResult = findLensOptions(brandData, transposed.sphere, transposed.cylinder, 0);
            console.log(`Transposed (${transposed.sphere}, ${transposed.cylinder}) result: ${transposedResult.bestMatch ? `${transposedResult.categoryInfo?.category} - ${transposedResult.bestMatch.range}` : 'No match'}`);

            console.log(`Final result: ${originalResult.bestMatch ? `${originalResult.categoryInfo?.category} - ${originalResult.bestMatch.range}` : (transposedResult.bestMatch ? `${transposedResult.categoryInfo?.category} - ${transposedResult.bestMatch.range}` : 'No match found')}`);

            console.log('---\n');
        }
    } catch (error) {
        console.error('Error running tests:', error);
    }
}

runTests();