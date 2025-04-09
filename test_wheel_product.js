// Test script for Wheel Product Converter
const fs = require('fs');
const path = require('path');

// Read the markdown file
const markdownContent = fs.readFileSync(path.join(__dirname, 'Data', 'enkei_com.md'), 'utf-8');

// Parse the markdown
const result = parseWheelProductMarkdown(markdownContent, 'enkei_com.md');

// Print the results
console.log('Model:', result.model);
console.log('Number of finishes found:', result.finishes.length);
result.finishes.forEach(finish => {
    console.log(`\nFinish: ${finish.name}`);
    console.log(`Image count: ${finish.imageUrls.length}`);
    console.log('First few image URLs:');
    finish.imageUrls.slice(0, 3).forEach(url => console.log(`- ${url}`));
});

// Generate CSV
const csvData = generateWheelProductCSV([result]);
console.log('\nCSV Output (first 500 chars):');
console.log(csvData.substring(0, 500));

// Write CSV to file for inspection
fs.writeFileSync(path.join(__dirname, 'Output', 'test_wheel_product.csv'), csvData);
console.log('\nCSV file written to Output/test_wheel_product.csv');

// Function implementations
function parseWheelProductMarkdown(content, filename) {
    // Initialize result structure
    const result = {
        model: '',
        finishes: []
    };
    
    // Extract model name from the first line or filename if no clear header
    const firstLine = content.split('\n')[0].trim();
    // Check for pipe character including escaped pipes
    if (firstLine.includes('|') || firstLine.includes('\\|')) {
        // Format like "PF06 | Enkei Wheels" or "PF06 \| Enkei Wheels"
        let parts = firstLine.replace('\\|', '|').split('|');
        result.model = parts[0].trim();
    } else if (filename) {
        // Use filename if header doesn't contain model info
        const nameWithoutExt = filename.replace('.md', '');
        result.model = nameWithoutExt;
    }
    
    // If we still don't have a model, try to extract from image alt text
    if (!result.model) {
        const modelMatch = content.match(/!\[([A-Za-z0-9]+) (Black|White|Gold|Silver|Bronze|Grey|Gray|Red|Blue|Green)/);
        if (modelMatch) {
            result.model = modelMatch[1];
        }
    }
    
    console.log("Extracted model name:", result.model);
    
    // Regular expressions to extract information
    const imageRegex = /!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
    
    // Extract all image information
    let match;
    const finishesMap = new Map(); // Map to organize images by finish
    const seenUrls = new Set(); // Track URLs we've already processed
    
    // First pass: Find all explicitly labeled images to identify valid finishes
    const validFinishes = new Set();
    const reImageRegex = new RegExp(imageRegex);
    let preMatch;
    
    while ((preMatch = reImageRegex.exec(content)) !== null) {
        const altText = preMatch[1].trim();
        const imageUrl = preMatch[2].trim();
        
        // Skip non-image files, logos, shop links, and empty alt texts
        if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i) || 
            imageUrl.includes('logo') || 
            imageUrl.includes('/shop/') || 
            altText === '') {
            continue;
        }
        
        // Check if this is related to our model
        if (altText.includes(result.model)) {
            // Try to extract finish from alt text like "PF06 Black" or "Enkei PF06 Hyper Silver"
            let finish = '';
            const modelIndex = altText.indexOf(result.model);
            
            // Check if there's text after the model name
            if (modelIndex + result.model.length < altText.length) {
                finish = altText.substring(modelIndex + result.model.length).trim();
            }
            
            // Clean up finish name
            finish = finish.replace(/^(enkei|wheels|wheel|-|\s)+/i, '').trim();
            if (finish) {
                validFinishes.add(finish);
            }
        }
    }
    
    console.log("Valid finishes identified:", Array.from(validFinishes));
    
    // Second pass: Process all images with knowledge of valid finishes
    while ((match = imageRegex.exec(content)) !== null) {
        const altText = match[1].trim();
        const imageUrl = match[2].trim();
        
        // Skip if we've already processed this URL
        if (seenUrls.has(imageUrl)) {
            continue;
        }
        
        // Skip non-image files, logos, shop links, and empty alt texts
        if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i) || 
            imageUrl.includes('logo') || 
            imageUrl.includes('/shop/') || 
            altText === '') {
            continue;
        }
        
        // Skip clearly unrelated product images 
        // (other models that aren't mentioned in the title and don't have our model in alt text)
        if (!altText.includes(result.model) && 
            altText.includes('Enkei') && 
            !altText.includes('Image') && 
            !altText.match(/^(Black|White|Gold|Silver|Bronze|Grey|Gray|Red|Blue|Green|Hyper)/i)) {
            continue;
        }
        
        // Extract finish from alt text
        let finish = '';
        
        // Try to extract finish based on patterns like "PF06 Black" or "Enkei PF06 Hyper Silver"
        if (altText.includes(result.model)) {
            const modelIndex = altText.indexOf(result.model);
            // Check if there's text after the model name
            if (modelIndex + result.model.length < altText.length) {
                finish = altText.substring(modelIndex + result.model.length).trim();
            } else if (modelIndex > 0) {
                // If finish might be before model (less common)
                finish = altText.substring(0, modelIndex).trim();
            }
        } else if (altText.match(/^(Black|White|Gold|Silver|Bronze|Grey|Gray|Red|Blue|Green|Hyper)/i)) {
            // Direct color name as alt text
            finish = altText;
        } else if (altText.includes('Image')) {
            // For images with generic names like "PF06 - Image 9", try to infer finish from URL
            const urlLower = imageUrl.toLowerCase();
            
            // Check URL for color hints
            if (urlLower.includes('black')) finish = 'Black';
            else if (urlLower.includes('white')) finish = 'White';
            else if (urlLower.includes('gold')) finish = 'Gold';
            else if (urlLower.includes('silver') || urlLower.includes('hyper')) finish = 'Hyper Silver';
            else if (urlLower.includes('bronze')) finish = 'Bronze';
            else if (urlLower.includes('grey') || urlLower.includes('gray')) finish = 'Grey';
            else if (urlLower.includes('red')) finish = 'Red';
            else if (urlLower.includes('blue')) finish = 'Blue';
            else if (urlLower.includes('green')) finish = 'Green';
            else {
                // Check numeric patterns in the URL - many websites use sequential numbering
                // for different angles of the same finish
                const numMatch = urlLower.match(/(\d+)\.jpg$/) || urlLower.match(/-(\d+)-/);
                if (numMatch) {
                    const num = parseInt(numMatch[1]);
                    // Attempt to associate number ranges with finishes based on observed patterns
                    // This logic would be customized based on the specific website's patterns
                    if (num >= 1 && num <= 5) finish = 'Hyper Silver';
                    else if (num >= 6 && num <= 12) finish = 'Black';
                    else if (num >= 13 && num <= 19) finish = 'Gold';
                    else if (num >= 20 && num <= 25) finish = 'White';
                    // If we can't determine, it stays unknown
                }
            }
        }
        
        // Clean up finish name - remove redundant prefixes
        finish = finish.replace(/^(enkei|wheels|wheel|-|\s)+/i, '').trim();
        
        // If we still don't have a finish but have a valid image, use "Unknown"
        if (!finish) {
            finish = 'Unknown';
        }
        
        // Mark this URL as seen
        seenUrls.add(imageUrl);
        
        // Add to the finish map
        if (!finishesMap.has(finish)) {
            finishesMap.set(finish, []);
        }
        finishesMap.get(finish).push(imageUrl);
    }
    
    // Convert map to array for result
    finishesMap.forEach((imageUrls, finishName) => {
        // Skip the "Unknown" finish category if we have other finishes
        if (finishName !== 'Unknown' || finishesMap.size === 1) {
            result.finishes.push({
                name: finishName,
                imageUrls: imageUrls
            });
        }
    });
    
    return result;
}

function generateWheelProductCSV(data) {
    // Flatten the data for CSV
    const rows = [];
    
    data.forEach(wheelProduct => {
        // For each model and finish combination, create a row
        wheelProduct.finishes.forEach(finish => {
            finish.imageUrls.forEach(imageUrl => {
                rows.push({
                    model: wheelProduct.model,
                    finish: finish.name,
                    imageUrl: imageUrl
                });
            });
        });
    });
    
    // Generate CSV header
    let csv = 'model,finish,imageUrl\n';
    
    // Add data rows
    rows.forEach(row => {
        csv += `${escapeCsvField(row.model)},${escapeCsvField(row.finish)},${escapeCsvField(row.imageUrl)}\n`;
    });
    
    return csv;
}

function escapeCsvField(field) {
    if (field === null || field === undefined) {
        return '';
    }
    
    // Convert to string and escape double quotes
    const escaped = String(field).replace(/"/g, '""');
    
    // Wrap in quotes if the field contains commas, newlines, or quotes
    if (/[,\r\n"]/.test(escaped)) {
        return `"${escaped}"`;
    }
    
    return escaped;
} 