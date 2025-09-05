// Quick API test
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/parse?url=https://docs.google.com/document/d/1vnAyTaugHw0PjdQNEYR1vTULvBVuSZt-/mobilebasic&autoDetectCode=true&showDeletions=true&extractImages=true',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      // Find the Objective block
      const objectiveBlock = response.blocks.find(block => 
        block.text && block.text.includes('Objective:')
      );
      
      if (objectiveBlock) {
        console.log('✓ Found Objective block in API response:');
        console.log('  Text:', objectiveBlock.text.substring(0, 60) + '...');
        console.log('  HTML:', objectiveBlock.html.substring(0, 60) + '...');
        console.log('  Has Formatting:', objectiveBlock.hasFormatting);
        console.log('  Contains <u>:', objectiveBlock.html.includes('<u>'));
      } else {
        console.log('✗ No Objective block found');
      }
      
    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.log('Response:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();
