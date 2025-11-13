// brandDataLoader.js
import enterpriseData from '../data/enterpriseData.js';
import crizalData from '../data/crizalData.js';

// Available brands configuration
export const availableBrands = [
    {
        id: 'enterprise',
        name: 'Enterprise',
        dataFile: 'enterpriseData.js'
    },
    {
        id: 'crizal',
        name: 'FSV Crizal Innovation',
        dataFile: 'crizalData.js'
    },
    {
        id: 'brand2',
        name: 'Brand 2 (Example)',
        dataFile: 'exampleBrand2Data.js'
    }
    // More brands can be added here as you create new data files
];

// Dynamic data loader function
export const loadBrandData = async (brandId) => {
    try {
        switch (brandId) {
            case 'enterprise':
                return enterpriseData;

            case 'crizal':
                return crizalData;

            case 'brand2':
                const brand2Data = await import('../data/exampleBrand2Data.js');
                return brand2Data.default;

            // Add more cases as you create new brand data files
            default:
                console.warn(`Brand ${brandId} not found, falling back to Enterprise`);
                return enterpriseData;
        }
    } catch (error) {
        console.error(`Error loading brand data for ${brandId}:`, error);
        return enterpriseData; // Fallback to enterprise data
    }
};

// Get brand by ID
export const getBrandById = (brandId) => {
    return availableBrands.find(brand => brand.id === brandId) || availableBrands[0];
};