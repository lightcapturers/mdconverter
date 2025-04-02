document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const selectedFiles = document.getElementById('selectedFiles');
    const convertButton = document.getElementById('convertButton');
    const resultContainer = document.getElementById('resultContainer');
    const downloadLink = document.getElementById('downloadLink');
    
    // Files storage
    let files = [];
    
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
        
        // Process each file
        try {
            const processedData = await Promise.all(files.map(processFile));
            
            // Generate CSV
            const csv = generateCSV(processedData);
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            downloadLink.setAttribute('href', url);
            downloadLink.setAttribute('download', 'products.csv');
            
            // Show result container
            resultContainer.style.display = 'block';
        } catch (error) {
            console.error('Error processing files:', error);
            alert('Error processing files. Please check console for details.');
        }
    });
    
    async function processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const parsed = parseMarkdown(content);
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
    
    function parseMarkdown(content) {
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
    
    function generateCSV(data) {
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