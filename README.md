# Neema Opticals - Lens Calculator & Prescription Manager

A modern React application built with Vite and Bootstrap 4.6 for managing optical prescriptions and lens calculations with dynamic brand data loading.

## 🚀 Features

- **Dynamic Brand Selection**: Switch between different optical brands with automatic data loading
- **Single Prescription Calculator**: Calculate lens requirements for single vision prescriptions
- **ADD Power Calculation**: Calculate ADD power for bifocal/progressive lenses
- **Near Vision Calculation**: Calculate near vision requirements from distance vision and ADD power
- **Responsive Design**: Fully responsive for desktop, tablet, and mobile devices using Bootstrap 4.6
- **Interactive Examples**: Pre-loaded examples for different prescription types
- **Extensible Brand System**: Easy addition of new brands by creating data files

## 🛠️ Technology Stack

- **React 18.2**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **Bootstrap 4.6**: Responsive CSS framework
- **Font Awesome**: Icons for enhanced UI
- **ESLint**: Code linting and quality assurance

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-width layout with side-by-side forms
- **Tablet**: Adaptive grid layout with proper spacing
- **Mobile**: Stacked layout with touch-friendly buttons

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository or download the project files
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or next available port).

### Build for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## � Brand Data System

### Current Brands
- **Enterprise**: Complete lens pricing data with all categories
- **Brand 2 (Example)**: Sample brand data for demonstration

### Adding New Brands

1. **Create Data File**: Add a new data file in `src/data/` folder
   ```javascript
   // src/data/newBrandData.js
   const newBrandData = {
     brand: "New Brand Name",
     single_vision: {
       "Minus Comp": [ /* lens data */ ],
       "Plus Comp": [ /* lens data */ ],
       "SV Cross Comp": [ /* lens data */ ]
     },
     "Bifocal KT": [ /* bifocal data */ ],
     // Additional categories...
   };
   export default newBrandData;
   ```

2. **Update Brand Loader**: Add the new brand to `src/utils/brandDataLoader.js`
   ```javascript
   // Add to availableBrands array
   {
     id: 'newbrand',
     name: 'New Brand Name',
     dataFile: 'newBrandData.js'
   }

   // Add case to loadBrandData function
   case 'newbrand':
     const newBrandData = await import('../data/newBrandData.js');
     return newBrandData.default;
   ```

## �🎯 Usage

### Brand Selection
1. Use the brand dropdown at the top to select your preferred optical brand
2. The application will automatically load the corresponding pricing data
3. A confirmation message will show when the brand data is successfully loaded

### Single Prescription Mode
1. Select "Single Prescription" mode
2. Enter Sphere, Cylinder, and Axis values
3. Click "Calculate & Find Lenses"

### ADD Power Calculation Mode
1. Select "ADD Power Calculation" mode
2. Enter Distance Vision (DV) prescription
3. Enter Near Vision (NV) prescription
4. Click "Calculate ADD Power"

### Near Vision Calculation Mode
1. Select "Near Vision Calculation" mode
2. Enter Distance Vision (DV) prescription
3. Enter ADD power value
4. Click "Calculate Near Vision"

## 🧮 Calculation Logic

The application follows optical industry standards for lens calculations:

- **Priority Order**: ADD Power → Zero Cylinder → Same Signs → Cross Signs
- **Single Vision Types**: Minus Comp, Plus Comp, SV Cross Comp
- **Bifocal Types**: Bifocal KT for ADD power prescriptions

## 📁 Project Structure

```
neema-opticals-cp/
├── src/
│   ├── components/
│   │   └── OpticalStoreAppUI.jsx    # Main application component
│   ├── data/
│   │   ├── enterpriseData.js        # Enterprise brand data
│   │   └── exampleBrand2Data.js     # Example brand data
│   ├── utils/
│   │   └── brandDataLoader.js       # Brand data management system
│   ├── App.jsx                      # Root component
│   ├── main.jsx                     # Application entry point
│   └── index.css                    # Global styles
├── public/                          # Static assets
├── .github/
│   └── copilot-instructions.md      # GitHub Copilot instructions
├── package.json                     # Dependencies and scripts
├── vite.config.js                   # Vite configuration
└── index.html                       # HTML template
```

## 🔧 VS Code Integration

The project includes VS Code tasks for common operations:
- **Run Dev Server**: Starts the development server in background
- Access via Command Palette: `Ctrl+Shift+P` → "Tasks: Run Task"

## 📝 License

This project is intended for educational and professional use in the optical industry.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Note**: This application provides a UI framework for optical calculations. The actual calculation logic can be implemented based on specific business requirements.