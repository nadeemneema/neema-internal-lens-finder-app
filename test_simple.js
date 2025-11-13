import { findLensOptions, matchesRange } from './src/utils/prescriptionCalculations.js';
import { loadBrandData } from './src/utils/brandDataLoader.js';

async function testSpecificCase() {
    try {
        const brandData = await loadBrandData('Enterprise');

        console.log('Testing sphere: -0.25, cylinder: 0');
        console.log('Should match range "-6.0 to -2.0" in Minus Comp');

        // First test the matchesRange function directly
        const testRange = "-6.0 to -2.0";
        const sphere = -0.25;
        const cylinder = 0;

        console.log(`\nDirect range test: matchesRange("${testRange}", ${sphere}, ${cylinder})`);
        const rangeMatch = matchesRange(testRange, sphere, cylinder);
        console.log(`Range match result: ${rangeMatch}`);

        // Now test the full function
        console.log('\nFull function test:');
        const result = findLensOptions(brandData, sphere, cylinder, 0);
        console.log('Result:', JSON.stringify(result, null, 2));

        if (result.bestMatch) {
            console.log(`✅ SUCCESS: Found match in ${result.categoryInfo?.category} - ${result.bestMatch.range}`);
        } else {
            console.log('❌ FAILED: No match found');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testSpecificCase();