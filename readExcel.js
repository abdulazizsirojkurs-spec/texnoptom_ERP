const xlsx = require('xlsx');

try {
  const filePath = "/Users/macbookpro/Desktop/Xisob kitob APP/Finance Oxiri fixed.xlsx";
  const workbook = xlsx.readFile(filePath);
  
  const sheetName = "Tovarlar bazasi";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.log("Sheet not found!");
    process.exit(1);
  }
  
  const data = xlsx.utils.sheet_to_json(sheet);
  console.log("First 5 rows:");
  console.log(data.slice(0, 5));
} catch (e) {
  console.error("Error reading file:", e);
}
