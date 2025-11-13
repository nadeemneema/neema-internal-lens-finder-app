// exampleBrand2Data.js
const brand2Data = {
    brand: "Brand 2 (Example)",
    single_vision: {
        "Minus Comp": [
            {
                range: "-6.0 to -2.0",
                HC: 500,
                ARC: 700,
                HC_PG: 950,
                ARC_PG: 1250,
                ARC_POLY: 1050,
                BLUCUT: 950,
                BLUCUT_PC_POLY: 1550,
                ARC_1_67: 1850,
                BLUCUT_1_67: 2550,
            },
            // More ranges would go here...
        ],
        "Plus Comp": [
            {
                range: "+3.0 to +2.0",
                HC: 700,
                ARC: 900,
                HC_PG: 1250,
                ARC_PG: 1850,
                ARC_POLY: 1250,
                BLUCUT: 1250,
                BLUCUT_PC_POLY: 1850,
            },
            // More ranges would go here...
        ],
        "SV Cross Comp": [
            {
                range: "+1.75 to -2.0",
                HC: 900,
                ARC: 1050,
                HC_PG: 1550,
                ARC_PG: 1850,
                ARC_POLY: 1250,
                BLUCUT: 1650,
                BLUCUT_PC_POLY: 1850,
            },
            // More ranges would go here...
        ],
    },
    "Bifocal KT": [
        {
            range: "+3/+ ADD",
            HC: 650,
            ARC: 1050,
            HC_PG: 1250,
            ARC_PG: 1550,
            ARC_POLY: 1850,
            BLUCUT: 1550,
            BLUCUT_PC_POLY: 2050,
            PG_BC_KT_GREEN: 3050,
            PG_KT_BC_BLUE: 3850,
        },
        // More ranges would go here...
    ],
    // Additional categories can be added here...
};

export default brand2Data;