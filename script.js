document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const selectedFiles = document.getElementById('selectedFiles');
    const convertButton = document.getElementById('convertButton');
    const resultContainer = document.getElementById('resultContainer');
    const downloadLink = document.getElementById('downloadLink');
    const converterTypeRadios = document.querySelectorAll('input[name="converterType"]');
    
    // Files storage
    let files = [];
    let converterType = 'product'; // Default to product converter
    
    // Setup converter type toggle
    converterTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            converterType = this.value;
        });
    });
    
    // Setup drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('dragover');
    }
    
    function unhighlight() {
        dropZone.classList.remove('dragover');
    }
    
    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const newFiles = dt.files;
        handleFiles(newFiles);
    }
    
    // Handle files from file input
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    function handleFiles(fileList) {
        if (fileList.length === 0) return;
        
        // Filter for markdown files only
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (file.name.endsWith('.md')) {
                // Check if file is already added
                if (!files.some(f => f.name === file.name)) {
                    files.push(file);
                }
            }
        }
        
        // Update UI
        updateFileList();
        
        // Enable convert button if we have files
        convertButton.disabled = files.length === 0;
    }
    
    function updateFileList() {
        // Clear current list
        selectedFiles.innerHTML = '';
        
        // Add each file to the list
        files.forEach((file, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${file.name} <span class="remove-file" data-index="${index}">×</span>
            `;
            selectedFiles.appendChild(li);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeFile(index);
            });
        });
    }
    
    function removeFile(index) {
        files.splice(index, 1);
        updateFileList();
        convertButton.disabled = files.length === 0;
    }
    
    // Convert button click event
    convertButton.addEventListener('click', async function() {
        if (files.length === 0) return;
        
        // Process each file based on converter type
        try {
            let processedData;
            let csvData;
            let filename;
            
            if (converterType === 'product') {
                processedData = await Promise.all(files.map(processProductFile));
                csvData = generateProductCSV(processedData);
                filename = 'products.csv';
            } else if (converterType === 'gallery') {
                // Gallery converter
                processedData = await Promise.all(files.map(processGalleryFile));
                csvData = generateGalleryCSV(processedData);
                filename = 'vehicle_fitments.csv';
            } else if (converterType === 'boltpattern') {
                // Bolt pattern converter
                processedData = await Promise.all(files.map(processBoltPatternFile));
                csvData = generateBoltPatternCSV(processedData);
                filename = 'bolt_patterns.csv';
            } else if (converterType === 'carguide') {
                // Car guide converter
                processedData = await Promise.all(files.map(processCarGuideFile));
                csvData = generateCarGuideCSV(processedData);
                filename = 'car_fitment_guides.csv';
            } else if (converterType === 'colorgallery') {
                // Color gallery converter
                processedData = await Promise.all(files.map(processColorGalleryFile));
                csvData = generateColorGalleryCSV(processedData);
                filename = 'vehicle_colors.csv';
            }
            
            // Create download link
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            downloadLink.setAttribute('href', url);
            downloadLink.setAttribute('download', filename);
            
            // Show result container
            resultContainer.style.display = 'block';
        } catch (error) {
            console.error('Error processing files:', error);
            alert('Error processing files. Please check console for details.');
        }
    });
    
    async function processProductFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const parsed = parseProductMarkdown(content);
                    resolve(parsed);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error(`Error reading file ${file.name}`));
            };
            
            reader.readAsText(file);
        });
    }
    
    async function processGalleryFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const parsed = parseGalleryMarkdown(content);
                    resolve(parsed);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error(`Error reading file ${file.name}`));
            };
            
            reader.readAsText(file);
        });
    }
    
    async function processBoltPatternFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const parsed = parseBoltPatternMarkdown(content);
                    resolve(parsed);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error(`Error reading file ${file.name}`));
            };
            
            reader.readAsText(file);
        });
    }
    
    async function processCarGuideFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const parsed = parseCarGuideMarkdown(content);
                    resolve(parsed);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error(`Error reading file ${file.name}`));
            };
            
            reader.readAsText(file);
        });
    }
    
    async function processColorGalleryFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const parsed = parseColorGalleryMarkdown(content, file.name);
                    resolve(parsed);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error(`Error reading file ${file.name}`));
            };
            
            reader.readAsText(file);
        });
    }
    
    function parseProductMarkdown(content) {
        const data = {
            productTitle: '',
            productCode: '',
            description: '',
            why: '',
            features: '',
            mediaUrls: []
        };
        
        // Extract all image URLs from the main content, excluding resized ones
        const imgRegex = /!\[.*?\]\((https:\/\/[^)]+)\)/g;
        let match;
        while ((match = imgRegex.exec(content)) !== null) {
            const url = match[1];
            // Skip URLs containing "resized" and YouTube URLs
            if (!url.includes('resized') && !url.includes('youtube.com') && !url.includes('youtu.be')) {
                addUniqueUrl(data.mediaUrls, url);
            }
        }
        
        // Extract gallery section
        const galleryMatch = content.match(/#+ Gallery[\s\S]*?(?=#|$)/);
        if (galleryMatch) {
            const galleryContent = galleryMatch[0];
            
            // Extract image URLs from gallery content
            const galleryImgRegex = /!\[.*?\]\((https:\/\/[^)]+)\)/g;
            while ((match = galleryImgRegex.exec(galleryContent)) !== null) {
                const url = match[1];
                // Skip URLs containing "resized" and YouTube URLs
                if (!url.includes('resized') && !url.includes('youtube.com') && !url.includes('youtu.be')) {
                    addUniqueUrl(data.mediaUrls, url);
                }
            }
            
            // Extract non-YouTube links from gallery
            const galleryLinkRegex = /\[(?!.*YouTube).*?\]\((https:\/\/[^)]+)\)/g;
            while ((match = galleryLinkRegex.exec(galleryContent)) !== null) {
                const url = match[1];
                // Skip URLs containing "resized" and YouTube URLs
                if (!url.includes('resized') && !url.includes('youtube.com') && !url.includes('youtu.be')) {
                    addUniqueUrl(data.mediaUrls, url);
                }
            }
        }
        
        // Helper function to add unique URL
        function addUniqueUrl(array, url) {
            if (!array.includes(url)) {
                array.push(url);
            }
        }
        
        // Extract product title - completely revised approach
        // Split the content by lines to analyze the structure
        const lines = content.split(/\r?\n/);
        let productTitleLine = -1;

        // Find a line that starts with a single # and is not "COBB Tuning - Products"
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('# ') && line !== '# COBB Tuning - Products') {
                // Found a potential product title
                // Check if it's followed by price or other product indicators within a few lines
                const nextLines = lines.slice(i+1, i+10).join('\n');
                if (nextLines.includes('$') || 
                    nextLines.includes('Product Code:') || 
                    nextLines.includes('Starting at')) {
                    productTitleLine = i;
                    break;
                }
            }
        }

        // If we found a product title line, extract it
        if (productTitleLine >= 0) {
            const titleLine = lines[productTitleLine].trim();
            data.productTitle = titleLine.substring(2).trim(); // Remove the # and space
        } else {
            // Fallback to alternative methods
            // Look for image alt text that might contain the product title
            const imgAltMatch = content.match(/!\[((?:High Flow Filter|Stage|Power Package|Cat-Back|Exhaust)[^\]]+)\]/);
            if (imgAltMatch) {
                data.productTitle = imgAltMatch[1].trim();
            }
        }
        
        // Extract product code and remove any trailing ** characters
        const codeMatch = content.match(/Product Code:\s*([^\s\r\n]*)/);
        if (codeMatch) {
            // Remove any ** characters from the product code
            data.productCode = codeMatch[1].trim().replace(/\*+$/, '');
        }
        
        // Extract description - search for the Description section
        const descriptionMatch = content.match(/#+ Description\r?\n\r?\n([\s\S]*?)(\r?\n\r?\n\*\s\*\s\*|$)/);
        if (descriptionMatch) {
            // Clean up description by removing asterisks
            data.description = cleanUpText(descriptionMatch[1].trim());
        }
        
        // Extract why section - search for the Why? section
        const whyMatch = content.match(/#+ Why\?\r?\n\r?\n([\s\S]*?)(\r?\n\r?\n\*\s\*\s\*|$)/);
        if (whyMatch) {
            // Clean up why section by removing asterisks
            data.why = cleanUpText(whyMatch[1].trim());
        }
        
        // Extract features section - search for the Features section
        const featuresMatch = content.match(/#+ Features\r?\n\r?\n([\s\S]*?)(\r?\n\r?\n\*\s\*\s\*|$)/);
        if (featuresMatch) {
            // Extract only bulleted points from features
            const featuresText = featuresMatch[1].trim();
            const bulletPoints = [];
            
            // Split by lines and find bullet points
            const lines = featuresText.split(/\r?\n/);
            for (const line of lines) {
                // Only include lines that start with "-" or "•" (bullet points)
                if (line.trim().match(/^(-|\*|\•)\s+/)) {
                    // Clean up each bullet point
                    const cleanBullet = cleanUpText(line.trim().replace(/^(-|\*|\•)\s+/, ''));
                    if (cleanBullet) {
                        bulletPoints.push(cleanBullet);
                    }
                }
            }
            
            // Join the bullet points back together
            data.features = bulletPoints.join('\n');
        }
        
        // Helper function to clean up text by removing asterisks
        function cleanUpText(text) {
            return text.replace(/\*\*/g, '').replace(/\*/g, '');
        }
        
        return data;
    }
    
    function parseGalleryMarkdown(content) {
        const results = [];
        
        // Check for existing patterns first
        processMainVehiclePatterns(content, results);
        
        // New pattern for gallery overview format
        processGalleryOverviewFormat(content, results);
        
        return results;
        
        // Function to process the main vehicle patterns we already support
        function processMainVehiclePatterns(content, results) {
            // First, check for the pattern with different front/rear wheel and tire setup
            // Format: "# 2025 Ferrari SF90 XX Stradale Base Ferrada F8-fr12 Front: 20x9 +20 Rear: 20x12 +20 | Nitto..."
            const staggeredSetupMatch = content.match(/# ([0-9]{4}) ([A-Za-z]+) ([A-Za-z0-9 -]+)(?:\s+Base|\s+Limited)?\s+([A-Za-z0-9 -]+) Front: ([0-9.]+x[0-9.]+) \+([0-9]+) Rear: ([0-9.]+x[0-9.]+) \+([0-9]+)/i);
            
            if (staggeredSetupMatch) {
                const [, year, make, model, wheelBrand, frontWheelSize, frontOffset, rearWheelSize, rearOffset] = staggeredSetupMatch;
                
                // Look for staggered tire info
                const staggeredTireMatch = content.match(/\| ([A-Za-z0-9 -]+) Front: ([0-9]{3}\/[0-9]{2}) Rear: ([0-9]{3}\/[0-9]{2})/i);
                
                if (staggeredTireMatch) {
                    const [, tireBrand, frontTireSize, rearTireSize] = staggeredTireMatch;
                    
                    results.push({
                        year,
                        make,
                        model,
                        hasStaggeredSetup: true,
                        frontWheelBrand: wheelBrand.trim(),
                        frontWheelSpecs: `${frontWheelSize} +${frontOffset}`,
                        rearWheelBrand: wheelBrand.trim(),
                        rearWheelSpecs: `${rearWheelSize} +${rearOffset}`,
                        frontTireBrand: tireBrand.trim(),
                        frontTireSize: standardizeTireSize(frontTireSize),
                        rearTireBrand: tireBrand.trim(),
                        rearTireSize: standardizeTireSize(rearTireSize)
                    });
                }
            } else {
                // Try the regular single wheel setup pattern
                const mainVehicleMatch = content.match(/# ([0-9]{4}) ([A-Za-z]+) ([A-Za-z0-9 ]+)(?:\s+Base|\s+Limited)?\s+([A-Za-z0-9]+) ([A-Za-z0-9]+) ([0-9.]+x[0-9.]+) \+([0-9]+)/);
                
                if (mainVehicleMatch) {
                    const [, year, make, model, wheelBrand1, wheelBrand2, wheelSize, wheelOffset] = mainVehicleMatch;
                    const wheelBrand = wheelBrand1 + ' ' + wheelBrand2;
                    
                    // Look for tire info
                    const mainTireMatch = content.match(/\| ([A-Za-z]+) ([A-Za-z 0-9/-]+) ([0-9]{3}\/[0-9]{2})/);
                    
                    if (mainTireMatch) {
                        const [, tireBrand1, tireBrand2, tireSize] = mainTireMatch;
                        const tireBrand = (tireBrand1 + ' ' + tireBrand2).trim();
                        
                        results.push({
                            year,
                            make,
                            model,
                            hasStaggeredSetup: false,
                            frontWheelBrand: wheelBrand.trim(),
                            frontWheelSpecs: `${wheelSize} +${wheelOffset}`,
                            rearWheelBrand: wheelBrand.trim(),
                            rearWheelSpecs: `${wheelSize} +${wheelOffset}`,
                            frontTireBrand: tireBrand.trim(),
                            frontTireSize: standardizeTireSize(tireSize),
                            rearTireBrand: tireBrand.trim(),
                            rearTireSize: standardizeTireSize(tireSize)
                        });
                    }
                }
            }
            
            // Parse the similar builds section
            const lines = content.split(/\r?\n/);
            
            // Find all instances of year/make/model followed by wheel info and tire info
            for (let i = 0; i < lines.length - 2; i++) {
                const currentLine = lines[i].trim();
                
                // Check if this line has a year and make pattern (e.g., "2021 Subaru WRX STI")
                const yearMakePattern = /^([0-9]{4}) ([A-Za-z]+)(?: ([A-Za-z0-9 -]+))?$/;
                const vehicleMatch = currentLine.match(yearMakePattern);
                
                if (vehicleMatch) {
                    const [, year, make, modelPart] = vehicleMatch;
                    const model = modelPart || ""; // Default if model is missing
                    
                    // Look ahead for wheel info, skipping empty lines
                    let wheelLineIndex = i + 1;
                    while (wheelLineIndex < lines.length && lines[wheelLineIndex].trim() === '') {
                        wheelLineIndex++;
                    }
                    
                    if (wheelLineIndex < lines.length) {
                        const wheelLine = lines[wheelLineIndex].trim();
                        const wheelPattern = /^([A-Za-z0-9 -]+) ([0-9.]+x[0-9.]+) ([0-9]+)$/;
                        const wheelMatch = wheelLine.match(wheelPattern);
                        
                        if (wheelMatch) {
                            const [, wheelBrand, wheelSize, wheelOffset] = wheelMatch;
                            
                            // Look ahead for tire info, skipping empty lines
                            let tireLineIndex = wheelLineIndex + 1;
                            while (tireLineIndex < lines.length && lines[tireLineIndex].trim() === '') {
                                tireLineIndex++;
                            }
                            
                            if (tireLineIndex < lines.length) {
                                const tireLine = lines[tireLineIndex].trim();
                                // Match patterns like "Brand Name 255x35" or "Brand Name 255/35"
                                const tirePattern = /^(.+?) (?:([0-9]+)x([0-9]+)|([0-9]{3})\/([0-9]{2}))$/;
                                const tireMatch = tireLine.match(tirePattern);
                                
                                if (tireMatch) {
                                    let tireBrand, tireSize;
                                    
                                    if (tireMatch[2] && tireMatch[3]) {
                                        // Format is "Brand 255x35"
                                        tireBrand = tireMatch[1].trim();
                                        tireSize = `${tireMatch[2]}/${tireMatch[3]}`;  // Convert to slash format
                                    } else {
                                        // Format is "Brand 255/35"
                                        tireBrand = tireMatch[1].trim();
                                        tireSize = `${tireMatch[4]}/${tireMatch[5]}`;
                                    }
                                    
                                    // Skip View Car and empty lines, then continue processing
                                    i = tireLineIndex;
                                    
                                    // Found a complete vehicle/wheel/tire entry
                                    results.push({
                                        year,
                                        make,
                                        model,
                                        hasStaggeredSetup: false,
                                        frontWheelBrand: wheelBrand.trim(),
                                        frontWheelSpecs: `${wheelSize} +${wheelOffset}`,
                                        rearWheelBrand: wheelBrand.trim(),
                                        rearWheelSpecs: `${wheelSize} +${wheelOffset}`,
                                        frontTireBrand: tireBrand,
                                        frontTireSize: standardizeTireSize(tireSize),
                                        rearTireBrand: tireBrand,
                                        rearTireSize: standardizeTireSize(tireSize)
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Function to process the new gallery overview format
        function processGalleryOverviewFormat(content, results) {
            const lines = content.split(/\r?\n/);
            
            // Look for patterns like "**2025 Ferrari SF90 XX Stradale Base — Staggered**"
            // followed by wheel and tire info
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Match year, make, model and check if staggered
                const vehicleHeaderMatch = line.match(/\*\*([0-9]{4}) ([A-Za-z]+)\s+([^*]+?)(?:\s+—\s+Staggered)?\*\*/);
                
                if (vehicleHeaderMatch) {
                    const [, year, make, modelRaw] = vehicleHeaderMatch;
                    const model = modelRaw.trim();
                    const isStaggered = line.includes('Staggered');
                    
                    // Skip lines until we find the wheel info
                    let wheelInfoFound = false;
                    let wheelBrand = '';
                    let frontWheelSize = '';
                    let frontOffset = '';
                    let rearWheelSize = '';
                    let rearOffset = '';
                    
                    // Look ahead for wheel info within the next 10 lines
                    for (let j = i + 1; j < Math.min(i + 10, lines.length) && !wheelInfoFound; j++) {
                        const wheelLine = lines[j].trim();
                        
                        // Look for wheel brand and specs - handle both staggered and non-staggered
                        if (wheelLine.includes('**') && (wheelLine.includes('mm') || wheelLine.includes('x'))) {
                            // First, try to match staggered wheel pattern
                            const staggeredWheelMatch = wheelLine.match(/\*\*([^*]+)\*\* \*\*([0-9.]+x[0-9.]+) ([0-9]+)mm — Rear: ([0-9.]+x[0-9.]+) ([0-9]+)mm\*\*/);
                            
                            if (staggeredWheelMatch) {
                                // Staggered wheel setup
                                [, wheelBrand, frontWheelSize, frontOffset, rearWheelSize, rearOffset] = staggeredWheelMatch;
                                wheelInfoFound = true;
                            } else {
                                // Try non-staggered wheel pattern
                                const wheelMatch = wheelLine.match(/\*\*([^*]+)\*\* \*\*([0-9.]+x[0-9.]+) ([0-9]+)mm\*\*/);
                                
                                if (wheelMatch) {
                                    [, wheelBrand, frontWheelSize, frontOffset] = wheelMatch;
                                    rearWheelSize = frontWheelSize;
                                    rearOffset = frontOffset;
                                    wheelInfoFound = true;
                                }
                            }
                            
                            // If wheel info found, look for tire info
                            if (wheelInfoFound) {
                                let tireInfoFound = false;
                                let tireBrand = '';
                                let frontTireSize = '';
                                let rearTireSize = '';
                                
                                // Look ahead for tire info within the next 5 lines
                                for (let k = j + 1; k < Math.min(j + 5, lines.length) && !tireInfoFound; k++) {
                                    const tireLine = lines[k].trim();
                                    
                                    if (tireLine.includes('**') && (tireLine.includes('R') || tireLine.includes('/'))) {
                                        // Try to match staggered tire pattern
                                        const staggeredTireMatch = tireLine.match(/\*\*([^*]+)\*\*\*\*(?:Front: )?([0-9]{3}\/[0-9]{2}R[0-9]+) — Rear: ([0-9]{3}\/[0-9]{2}R[0-9]+)\*\*/);
                                        
                                        if (staggeredTireMatch) {
                                            // Staggered tire setup
                                            [, tireBrand, frontTireSize, rearTireSize] = staggeredTireMatch;
                                            tireInfoFound = true;
                                        } else {
                                            // Try non-staggered tire pattern
                                            const tireMatch = tireLine.match(/\*\*([^*]+)\*\*\*\*([0-9]{3}\/[0-9]{2}R[0-9]+)\*\*/);
                                            
                                            if (tireMatch) {
                                                [, tireBrand, frontTireSize] = tireMatch;
                                                rearTireSize = frontTireSize;
                                                tireInfoFound = true;
                                            }
                                        }
                                        
                                        // If tire info found, add result
                                        if (tireInfoFound) {
                                            // Clean and standardize formats
                                            frontTireSize = standardizeTireSize(extractTireSize(frontTireSize));
                                            rearTireSize = standardizeTireSize(extractTireSize(rearTireSize || frontTireSize));
                                            
                                            results.push({
                                                year,
                                                make,
                                                model,
                                                hasStaggeredSetup: isStaggered || frontWheelSize !== rearWheelSize || frontOffset !== rearOffset || frontTireSize !== rearTireSize,
                                                frontWheelBrand: wheelBrand.trim(),
                                                frontWheelSpecs: `${frontWheelSize} +${frontOffset}`,
                                                rearWheelBrand: wheelBrand.trim(),
                                                rearWheelSpecs: `${rearWheelSize} +${rearOffset}`,
                                                frontTireBrand: tireBrand.trim(),
                                                frontTireSize: frontTireSize,
                                                rearTireBrand: tireBrand.trim(),
                                                rearTireSize: rearTireSize
                                            });
                                            
                                            // Skip to end of this vehicle entry
                                            i = k;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Helper function to standardize tire size format to use slash
        function standardizeTireSize(size) {
            // Convert format like "255x35" to "255/35"
            return size.replace(/([0-9]+)x([0-9]+)/, '$1/$2');
        }
        
        // Helper function to extract tire size from format like "255/35R20"
        function extractTireSize(fullSize) {
            const match = fullSize.match(/([0-9]{3}\/[0-9]{2})/);
            return match ? match[1] : fullSize;
        }
    }
    
    function parseBoltPatternMarkdown(content) {
        const results = [];
        
        // Split content into lines
        const lines = content.split(/\r?\n/);
        
        // Find the table rows
        let tableFound = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Look for the header row that contains "Year/Make/Model/Option" and "Bolt Patterns"
            if (line.includes('**Year/Make/Model/Option**') && line.includes('**Bolt Patterns**')) {
                tableFound = true;
                continue;
            }
            
            // Skip divider row with | --- | --- |
            if (tableFound && line.match(/^\|[\s-]*\|[\s-]*\|$/)) {
                continue;
            }
            
            // Process data rows after header is found
            if (tableFound && line.startsWith('|') && line.endsWith('|')) {
                // Extract cells
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                
                if (cells.length >= 2) {
                    // Extract vehicle info from first cell
                    // Format: [2000 Ford Focus LX Sedan](http://...)
                    const vehicleMatch = cells[0].match(/\[([0-9]{4}) ([A-Za-z]+) ([A-Za-z0-9 ]+) ([A-Za-z0-9 .]+)\]/);
                    
                    if (vehicleMatch) {
                        const [, year, make, model, option] = vehicleMatch;
                        
                        // Extract bolt pattern from second cell
                        const boltPattern = cells[1].replace(/\(.*?\)/g, '').trim();
                        
                        results.push({
                            year,
                            make,
                            model,
                            option,
                            boltPattern
                        });
                    }
                }
            }
        }
        
        return results;
    }
    
    function parseCarGuideMarkdown(content) {
        const results = [];
        
        // Split content into lines
        const lines = content.split(/\r?\n/);
        
        // Extract the guide title and car information
        let carMake = '';
        let carModel = '';
        let carGeneration = '';
        let modelYears = [];
        
        // Look for title that contains car make and model
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('# ')) {
                // Extract make and model from title like "# Audi B8 S5 Wheel & Tire Fitment Guide"
                const titleMatch = line.match(/# ([A-Za-z]+) ([A-Za-z0-9]+) ([A-Za-z0-9]+)/);
                if (titleMatch) {
                    [, carMake, carGeneration, carModel] = titleMatch;
                    break;
                }
            }
        }
        
        // Look for model years covered in the guide
        const modelsPattern = /\*\*Models Covered in This Guide\*\*\s+\*\*([0-9-]+) ([A-Za-z]+) ([A-Za-z0-9]+)/g;
        let modelsMatch;
        
        while ((modelsMatch = modelsPattern.exec(content)) !== null) {
            const yearRange = modelsMatch[1];
            const yearRangeMatch = yearRange.match(/([0-9]{4})-([0-9]{4})/);
            if (yearRangeMatch) {
                const startYear = parseInt(yearRangeMatch[1]);
                const endYear = parseInt(yearRangeMatch[2]);
                for (let year = startYear; year <= endYear; year++) {
                    modelYears.push(year);
                }
            }
        }
        
        // Process OEM+ section
        const oemPlusSection = extractSection(content, "OEM\\+ Wheel Fitment", "Performance Street and Track");
        if (oemPlusSection) {
            const oemPlusRecommendations = extractRecommendations(oemPlusSection, "OEM+");
            oemPlusRecommendations.forEach(rec => {
                modelYears.forEach(year => {
                    results.push({
                        year,
                        make: carMake,
                        model: carModel,
                        generation: carGeneration,
                        recommendationType: rec.type,
                        recommendationIndex: rec.index,
                        wheelSpec: rec.wheelSpec,
                        tireSpec: rec.tireSpec,
                        notes: rec.notes,
                        orientation: rec.orientation
                    });
                });
            });
        }
        
        // Process Performance section
        const performanceSection = extractSection(content, "Performance Street and Track Wheel Fitment", "Additional Resources");
        if (performanceSection) {
            const performanceRecommendations = extractRecommendations(performanceSection, "Performance");
            performanceRecommendations.forEach(rec => {
                modelYears.forEach(year => {
                    results.push({
                        year,
                        make: carMake,
                        model: carModel,
                        generation: carGeneration,
                        recommendationType: rec.type,
                        recommendationIndex: rec.index,
                        wheelSpec: rec.wheelSpec,
                        tireSpec: rec.tireSpec,
                        notes: rec.notes,
                        orientation: rec.orientation
                    });
                });
            });
        }
        
        return results;
        
        function extractSection(content, sectionStart, sectionEnd) {
            const sectionRegex = new RegExp(`## ${sectionStart}[\\s\\S]*?(?:## ${sectionEnd}|$)`, 'i');
            const match = content.match(sectionRegex);
            return match ? match[0] : '';
        }
        
        function extractRecommendations(sectionContent, recommendationType) {
            const recommendations = [];
            
            // Split into individual recommendations
            const recLines = sectionContent.split(/\*\*Front & Rear:/);
            
            // Skip the first element which is usually the section heading
            for (let i = 1; i < recLines.length; i++) {
                const recContent = recLines[i];
                
                // Extract wheel spec
                const wheelSpecMatch = recContent.match(/([0-9.]+x[0-9.]+["']) (?:ET)?([0-9]+)/i);
                
                if (wheelSpecMatch) {
                    const wheelSize = wheelSpecMatch[1];
                    const wheelOffset = wheelSpecMatch[2];
                    const wheelSpec = `${wheelSize} ET${wheelOffset}`;
                    
                    // Extract tire spec
                    const tireSpecMatch = recContent.match(/([0-9]{3}\/[0-9]{2}-[0-9]{2})/);
                    const tireSpec = tireSpecMatch ? tireSpecMatch[1] : '';
                    
                    // Extract orientation (Square by default since it says Front & Rear)
                    const orientation = "Square";
                    
                    // Extract additional notes
                    const notesMatch = recContent.match(/(-\s+.*?)(?:\*\*|$)/s);
                    const notes = notesMatch ? notesMatch[1].replace(/\n/g, ' ').replace(/-\s+/, '').trim() : '';
                    
                    // Add to recommendations with an index to keep track of multiple recommendations of the same type
                    recommendations.push({
                        type: recommendationType,
                        index: recommendations.filter(r => r.type === recommendationType).length + 1,
                        wheelSpec,
                        tireSpec,
                        notes,
                        orientation
                    });
                }
            }
            
            return recommendations;
        }
    }
    
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
    
    function generateProductCSV(data) {
        // Determine the maximum number of media URLs
        let maxMediaCount = 0;
        data.forEach(item => {
            maxMediaCount = Math.max(maxMediaCount, item.mediaUrls.length);
        });
        
        // Create header row
        let headers = ['Product Title', 'Product Code', 'Description', 'Why', 'Features'];
        
        // Add media URL headers
        for (let i = 0; i < maxMediaCount; i++) {
            headers.push(`Media URL ${i+1}`);
        }
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        
        // Add data rows
        data.forEach(item => {
            let row = [
                escapeCsvField(item.productTitle),
                escapeCsvField(item.productCode),
                escapeCsvField(item.description),
                escapeCsvField(item.why),
                escapeCsvField(item.features)
            ];
            
            // Add media URLs
            for (let i = 0; i < maxMediaCount; i++) {
                row.push(i < item.mediaUrls.length ? escapeCsvField(item.mediaUrls[i]) : '');
            }
            
            csvContent += row.join(',') + '\n';
        });
        
        return csvContent;
    }
    
    function generateGalleryCSV(data) {
        // Flatten the array of arrays into a single array of objects
        const flatData = data.flat();
        
        // Create header row with separate columns
        const headers = [
            'Year', 'Make', 'Model', 'Orientation', 
            'Front Wheel Brand', 'Front Wheel Specs', 
            'Rear Wheel Brand', 'Rear Wheel Specs', 
            'Front Tire Brand', 'Front Tire Size', 
            'Rear Tire Brand', 'Rear Tire Size'
        ];
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        
        // Add data rows
        flatData.forEach(item => {
            // Determine orientation based on wheel and tire info
            let orientation = "Square";
            if (
                item.frontWheelSpecs !== item.rearWheelSpecs || 
                item.frontTireSize !== item.rearTireSize
            ) {
                orientation = "Staggered";
            }
            
            const row = [
                escapeCsvField(item.year),
                escapeCsvField(item.make),
                escapeCsvField(item.model),
                escapeCsvField(orientation),
                escapeCsvField(item.frontWheelBrand || ''),
                escapeCsvField(item.frontWheelSpecs || ''),
                escapeCsvField(item.rearWheelBrand || ''),
                escapeCsvField(item.rearWheelSpecs || ''),
                escapeCsvField(item.frontTireBrand || ''),
                escapeCsvField(item.frontTireSize || ''),
                escapeCsvField(item.rearTireBrand || ''),
                escapeCsvField(item.rearTireSize || '')
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        return csvContent;
    }
    
    function generateBoltPatternCSV(data) {
        // Flatten the array of arrays into a single array of objects
        const flatData = data.flat();
        
        // Create header row
        const headers = ['Year', 'Make', 'Model', 'Option', 'Bolt Pattern'];
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        
        // Add data rows
        flatData.forEach(item => {
            const row = [
                escapeCsvField(item.year),
                escapeCsvField(item.make),
                escapeCsvField(item.model),
                escapeCsvField(item.option),
                escapeCsvField(item.boltPattern)
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        return csvContent;
    }
    
    function generateCarGuideCSV(data) {
        // Flatten the array of arrays into a single array of objects
        const flatData = data.flat();
        
        // Create header row
        const headers = [
            'Year', 'Make', 'Model', 'Generation', 
            'Recommendation Type', 'Index', 
            'Wheel Specification', 'Tire Specification', 
            'Orientation', 'Notes'
        ];
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        
        // Add data rows
        flatData.forEach(item => {
            const row = [
                escapeCsvField(item.year),
                escapeCsvField(item.make),
                escapeCsvField(item.model),
                escapeCsvField(item.generation),
                escapeCsvField(item.recommendationType),
                escapeCsvField(item.recommendationIndex),
                escapeCsvField(item.wheelSpec),
                escapeCsvField(item.tireSpec),
                escapeCsvField(item.orientation),
                escapeCsvField(item.notes)
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        return csvContent;
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
}); 