// Constants for Health Portal System
// Report Date Constants for Monthly Children Data

// Available years for reports
export const REPORT_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

// Available months for reports (mm/yyyy format)
export const REPORT_MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

// Generate report date strings in mm/yyyy format
export const generateReportDates = () => {
  const dates = [];
  REPORT_YEARS.forEach(year => {
    REPORT_MONTHS.forEach(month => {
      dates.push(`${month.value}/${year}`);
    });
  });
  return dates;
};

// Get current report date (current month/year)
export const getCurrentReportDate = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${month}/${year}`;
};

// Parse report date string to get year and month
export const parseReportDate = (reportDate) => {
  if (!reportDate) return { year: null, month: null };
  const [month, year] = reportDate.split('/');
  return { year: parseInt(year), month: month };
};

// Validate report date format
export const isValidReportDate = (reportDate) => {
  if (!reportDate || typeof reportDate !== 'string') return false;
  const [month, year] = reportDate.split('/');
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  
  return monthNum >= 1 && monthNum <= 12 && 
         yearNum >= 2019 && yearNum <= 2025 &&
         month.length === 2 && year.length === 4;
};

// Get month name from month number
export const getMonthName = (monthNumber) => {
  const month = REPORT_MONTHS.find(m => m.value === monthNumber);
  return month ? month.label : 'Unknown';
};

// Format report date for display
export const formatReportDateForDisplay = (reportDate) => {
  const { year, month } = parseReportDate(reportDate);
  if (!year || !month) return 'Invalid Date';
  return `${getMonthName(month)} ${year}`;
};

// Other system constants
export const BARANGAYS = [
  "Abiacao", "Bagong Tubig", "Balagtasin", "Balite", "Banoyo",
  "Boboy", "Bonliw", "Calumpang East", "Calumpang West",
  "Dulangan", "Durungao", "Locloc", "Luya", "Mahabang Parang",
  "Manggahan", "Muzon", "San Antonio", "San Isidro", "San Jose",
  "San Martin", "Santa Monica", "Taliba", "Talon", "Tejero",
  "Tungal", "Poblacion"
];

export const SECTORS = ["Sector A", "Sector B", "Sector C"];

export const VACCINES = [
  "BCG (At Birth)", "HEPA B (At Birth)", 
  "PENTA 1 ( 1 1/2 mos.)", "PENTA 2 ( 2 1/2 mos.)", "PENTA 3 ( 3 1/2 mos.)",
  "OPV 1  ( 1 1/2 mos.)", "OPV 2  ( 2 1/2 mos.)", "OPV 3  ( 3 1/2 mos.)",
  "IPV1  ( 3 1/2 mos.)", "IPV2  ( 9 mos.)",
  "PCV1  ( 1 1/2 mos.)", "PCV2  ( 2 1/2 mos.)", "PCV3  ( 3 1/2 mos.)",
  "MCV1 (9 mos.)", "MCV2 (12 mos. & 29 days)"
];

// Local Storage Keys
export const LS = {
  role: "hp_role",
  email: "hp_email", 
  barangay: "hp_barangay",
  sector: "hp_sector",
  dataPrefix: "hp_children_"
};
