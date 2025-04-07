const fs = require('fs');
const path = require('path');

// Load the sample file
const sampleFile = fs.readFileSync(path.join(__dirname, 'Data', 'www_tirerack_co1.md'), 'utf8');

// Parse the markdown content
function parseColorGalleryMarkdown(content, filename) {
    // Extract the vehicle information from the filename (if available)
    const filenameParts = filename.replace('.md', '').split('_');
    const vehicleInfo = {
        filename: filename,
        year: filenameParts[0] || '',
        make: filenameParts[1] || '',
        model: filenameParts[2] || '',
        colors: []
    };

    // Extract colors from markdown links (exclude image links)
    const colorLinkRegex = /- \[\s*([^[\]]+?)\s*\]\(/g;
    let colorMatch;
    const uniqueColors = new Set();
    const colorUrlMap = new Map();
    
    while ((colorMatch = colorLinkRegex.exec(content)) !== null) {
        // Extract the color name from the link text
        const colorName = colorMatch[1].trim();
        
        // Get link URL (helps with extracting color codes)
        const linkStartIndex = content.indexOf('](', colorMatch.index) + 2;
        const linkEndIndex = content.indexOf(')', linkStartIndex);
        const linkUrl = content.substring(linkStartIndex, linkEndIndex);
        
        // Extract color code from URL if it exists
        const colorCodeMatch = linkUrl.match(/changeColor=([^&]+)/);
        if (colorCodeMatch) {
            colorUrlMap.set(colorName, colorCodeMatch[1]);
        }
        
        uniqueColors.add(colorName);
    }
    
    // Find the base image URL at the bottom of the markdown
    const imageRegex = /!\[.*\]\((https:\/\/[^)]+)\)/;
    const imageMatch = content.match(imageRegex);
    let baseImageUrl = '';
    
    if (imageMatch && imageMatch[1]) {
        baseImageUrl = imageMatch[1];
        
        // Extract vehicle info from image URL and/or alt text if available
        const altTextRegex = /!\[(Vehicle in Wheel Visualizer - ([^[\]]+))\]/;
        const altTextMatch = content.match(altTextRegex);
        
        if (altTextMatch && altTextMatch[2]) {
            const vehicleDescription = altTextMatch[2].trim();
            // Try to parse year, make, model from the description
            const yearMakeModelRegex = /(\d{4})\s+(\w+)\s+(.*?)(?:\s+(\w+\s+\w+))?$/;
            const ymMatch = vehicleDescription.match(yearMakeModelRegex);
            
            if (ymMatch) {
                vehicleInfo.year = ymMatch[1] || vehicleInfo.year;
                vehicleInfo.make = ymMatch[2] || vehicleInfo.make;
                vehicleInfo.model = ymMatch[3] || vehicleInfo.model;
            }
        }
    }
    
    // Generate color data with image URLs
    if (baseImageUrl) {
        // Extract parts of the URL: domain, path to image, image filename, query string
        const urlParts = baseImageUrl.match(/(https:\/\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\/)([^\/]+\/[^?]+)(\?.*)?/);
        
        if (urlParts) {
            const [, domainAndPath, filenameWithColor, queryString] = urlParts;
            
            // Extract model information and color from the filename
            const filenameMatch = filenameWithColor.match(/([^\/]+\/)(\d+veh\.)(\w+\.\d+(?:\.\d+)?\.)(\w+(?:_\w+)*)(\.png)/);
            
            if (filenameMatch) {
                const [, directory, prefix, modelWithZero, currentColor, suffix] = filenameMatch;
                
                // Remove the "0" from the model section for all colors except current
                const modelWithoutZero = modelWithZero.replace(/^0/, '');
                
                // For each unique color, generate a URL with that color
                uniqueColors.forEach(color => {
                    // Try to get the color code from URL
                    let colorForUrl = colorUrlMap.get(color);
                    
                    // If not found in URL, convert color name to format in URL (e.g., "Tango Red" to "Tango_Red")
                    if (!colorForUrl) {
                        colorForUrl = color.replace(/ /g, '_');
                    }
                    
                    // Create a new URL
                    let newImageUrl;
                    let imageFilename;
                    
                    // Keep the base URL for the current color, modify model section for others
                    if (colorForUrl === currentColor) {
                        // This is the base URL color, keep it as is
                        newImageUrl = baseImageUrl;
                        imageFilename = `${prefix}${modelWithZero}${colorForUrl}${suffix}`;
                    } else {
                        // For other colors, construct a new URL with model section without "0"
                        newImageUrl = `${domainAndPath}${directory}${prefix}${modelWithoutZero}${colorForUrl}${suffix}${queryString || ''}`;
                        imageFilename = `${prefix}${modelWithoutZero}${colorForUrl}${suffix}`;
                    }
                    
                    vehicleInfo.colors.push({
                        colorName: color,
                        imageUrl: newImageUrl,
                        imageFilename: imageFilename
                    });
                });
            }
        }
    }
    
    return vehicleInfo;
}

function generateColorGalleryCSV(data) {
    // Flatten all color entries from all files
    const allEntries = [];
    
    data.forEach(vehicleInfo => {
        // Create a unique set to track colors we've already added
        const addedColors = new Set();
        
        vehicleInfo.colors.forEach(color => {
            // Skip duplicate colors
            if (!addedColors.has(color.colorName)) {
                addedColors.add(color.colorName);
                
                allEntries.push({
                    year: vehicleInfo.year,
                    make: vehicleInfo.make,
                    model: vehicleInfo.model,
                    colorName: color.colorName,
                    imageUrl: color.imageUrl,
                    imageFilename: color.imageFilename,
                    filename: vehicleInfo.filename
                });
            }
        });
    });
    
    // Generate CSV header
    const header = ['Year', 'Make', 'Model', 'Color Name', 'Image URL', 'Image Filename', 'Source File'];
    
    // Generate CSV rows
    const rows = allEntries.map(entry => [
        entry.year,
        entry.make,
        entry.model,
        entry.colorName,
        entry.imageUrl,
        entry.imageFilename,
        entry.filename
    ]);
    
    // Combine header and rows
    const csvContent = [header]
        .concat(rows)
        .map(row => row.map(escapeCsvField).join(','))
        .join('\n');
    
    return csvContent;
}

function escapeCsvField(field) {
    if (field === null || field === undefined) {
        return '';
    }
    field = String(field);
    // If the field contains commas, quotes, or newlines, enclose it in quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        // Replace any double quotes with two double quotes
        field = field.replace(/"/g, '""');
        return `"${field}"`;
    }
    return field;
}

// Test the parser
const parsedData = parseColorGalleryMarkdown(sampleFile, 'www_tirerack_co1.md');
console.log('Parsed data:');
console.log(JSON.stringify(parsedData, null, 2));

// Generate CSV
const csvData = generateColorGalleryCSV([parsedData]);
console.log('\nGenerated CSV:');
console.log(csvData);

// Write the CSV to a file
fs.writeFileSync(path.join(__dirname, 'Output', 'bmw_colors.csv'), csvData);
console.log('\nCSV file written to Output/bmw_colors.csv'); 