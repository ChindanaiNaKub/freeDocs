const { parseCodeContent } = require('./src/utils/contentParser');

// Test XML/Maven dependency parsing with multiple dependencies
const multipleXmlContent = `<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.34</version>
    <scope>provided</scope>
</dependency>

<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.3.21</version>
</dependency>`;

console.log('Testing multiple XML dependencies...');
console.log('Original XML:');
console.log(multipleXmlContent);

const parsed = parseCodeContent(multipleXmlContent, 'code');
console.log('\nParsed result:');
console.log(JSON.stringify(parsed, null, 2));

// Test with mixed diff markers
const mixedDiffContent = `<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.34</version>
    <scope>provided</scope>
</dependency>

+ <dependency>
+     <groupId>org.springframework</groupId>
+     <artifactId>spring-core</artifactId>
+     <version>5.3.21</version>
+ </dependency>

- <dependency>
-     <groupId>junit</groupId>
-     <artifactId>junit</artifactId>
-     <version>4.12</version>
- </dependency>`;

console.log('\n\nTesting mixed diff markers...');
console.log('Mixed content:');
console.log(mixedDiffContent);

const parsedMixed = parseCodeContent(mixedDiffContent, 'code');
console.log('\nParsed mixed result:');
console.log(JSON.stringify(parsedMixed, null, 2));

// Test standalone groupId/artifactId
const standaloneContent = `<groupId>org.projectlombok</groupId>
<artifactId>lombok</artifactId>`;

console.log('\n\nTesting standalone groupId/artifactId...');
const parsedStandalone = parseCodeContent(standaloneContent, 'code');
console.log('Parsed standalone result:');
console.log(JSON.stringify(parsedStandalone, null, 2));
