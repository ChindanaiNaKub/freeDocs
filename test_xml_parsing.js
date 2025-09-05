const { parseCodeContent } = require('./src/utils/contentParser');

// Test XML/Maven dependency parsing
const xmlContent = `<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.34</version>
    <scope>provided</scope>
</dependency>`;

console.log('Testing XML content parsing...');
console.log('Original XML:');
console.log(xmlContent);

const parsed = parseCodeContent(xmlContent, 'code');
console.log('\nParsed result:');
console.log(JSON.stringify(parsed, null, 2));

// Test the HTML generation 
console.log('\nTesting with diff markers:');
const xmlWithDiff = `+ <dependency>
+     <groupId>org.projectlombok</groupId>
+     <artifactId>lombok</artifactId>
+     <version>1.18.34</version>
+     <scope>provided</scope>
+ </dependency>`;

const parsedDiff = parseCodeContent(xmlWithDiff, 'code');
console.log('Parsed diff result:');
console.log(JSON.stringify(parsedDiff, null, 2));
