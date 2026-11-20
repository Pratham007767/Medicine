const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'mockData.ts');
let content = fs.readFileSync(mockPath, 'utf8');

const priceMap = {
  'med-1': 95.00,
  'med-2': 210.00,
  'med-3': 38.00,
  'med-4': 55.00,
  'med-5': 145.00,
  'med-6': 115.00,
  'med-7': 82.00,
  'med-8': 78.00,
  'med-9': 165.00,
  'med-10': 42.00,
  'med-11': 32.00,
  'med-12': 115.00,
  'med-13': 46.00,
  'med-14': 158.00,
  'med-15': 65.00,
};

// Update prices inside inventory items by matching medicine_id and adjusting price
content = content.replace(/(medicine_id:\s*"(med-\d+)"[\s\S]*?price:\s*)([\d.]+)/g, (match, prefix, medId, oldPrice) => {
  const basePrice = priceMap[medId] || 90.00;
  // Add a slight realistic variation based on oldPrice
  const variation = (parseFloat(oldPrice) % 5);
  const inrPrice = (basePrice + variation).toFixed(2);
  return `${prefix}${inrPrice}`;
});

// Update sample prescriptions clinics
content = content.replace(/doctor:\s*"Dr\. Jonathan Hayes[^"]*"/, 'doctor: "Dr. Hitesh Baruah, MD (Medicine)"');
content = content.replace(/clinic:\s*"Downtown Health Clinic"/, 'clinic: "Gauhati University Health Centre, Jalukbari"');

content = content.replace(/doctor:\s*"Dr\. Alistair Finch[^"]*"/, 'doctor: "Dr. Nabajit Das, MD, DM (Cardiology)"');
content = content.replace(/clinic:\s*"Metropolitan Heart & Vascular Institute"/, 'clinic: "GMCH Heart Centre, Guwahati"');

content = content.replace(/doctor:\s*"Dr\. Rebecca Vance[^"]*"/, 'doctor: "Dr. Priyam Saikia, MD (Pulmonology)"');
content = content.replace(/clinic:\s*"City Pulmonary Associates"/, 'clinic: "Jalukbari Chest Care Clinic, Guwahati"');

// Update enquiries
content = content.replace(/user_phone:\s*"\+1 \(555\) 234-8901"/, 'user_phone: "+91 98640 23489"');
content = content.replace(/user_phone:\s*"\+1 \(555\) 789-1234"/, 'user_phone: "+91 94350 78912"');
content = content.replace(/user_name:\s*"Michael Chen"/, 'user_name: "Rahul Sharma"');
content = content.replace(/user_name:\s*"Sarah Williams"/, 'user_name: "Ananya Dutta"');

fs.writeFileSync(mockPath, content, 'utf8');
console.log('Successfully updated mockData.ts with Indian Rupee prices and Assam clinics!');
