const fs = require('fs');
const path = require('path');

// Paths to the JSON files
const seedsPath = path.join(__dirname, 'db', 'seeds.json');
const dbPath = path.join(__dirname, 'db', 'db.json');

// Function to copy data from seeds.json to db.json
function copyData() {
  fs.readFile(seedsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading seeds file:', err);
      return;
    }

    fs.writeFile(dbPath, data, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to db file:', err);
        return;
      }
      console.log('Data successfully copied from seeds.json to db.json.');
    });
  });
}

copyData();
