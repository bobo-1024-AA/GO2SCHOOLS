const https = require('https');
const fs = require('fs');

const url = 'https://www.edb.gov.hk/attachment/en/student-parents/sch-info/sch-search/sch-location-info/SCH_LOC_EDB.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('public/schools.json', data);
    console.log('Downloaded schools.json');
  });
}).on('error', (err) => {
  console.error(err);
});
