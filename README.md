# Markdown to CSV Converter

A simple web application that converts markdown files containing product information to CSV format.

## Features

- Drag and drop interface for uploading markdown files
- Multiple file upload support
- Extracts product information from markdown files:
  - Product title
  - Product code
  - Description
  - Why? section
  - Features
  - Product media URLs
- Generates a downloadable CSV file

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Clone this repository or download the files
3. Open a terminal in the project directory

## Running the Application

There are two ways to run the application:

### 1. Using the Node.js Server

Run the following command in the project directory:

```bash
npm start
```

This will start a local server at http://localhost:3000. Open this URL in your web browser to use the application.

### 2. Opening the HTML File Directly

You can simply open the `index.html` file in a web browser. However, using the server method is recommended for better functionality.

## How to Use

1. Upload your markdown files by dragging and dropping them onto the drop zone or click "Select Files" to browse
2. Selected files will appear in the list below
3. Click "Convert to CSV" to process the files
4. Click "Download CSV" to save the generated CSV file

## Expected Markdown Format

The application is designed to extract information from markdown files with a structure similar to:

```markdown
# Product Title

**Product Code: ABC123**

###### Description

Product description text here...

###### Why?

Why section text here...

###### Features

- Feature 1
- Feature 2
- Feature 3

![Image Description](https://example.com/image1.jpg)
![Image Description](https://example.com/image2.jpg)
```

## Technical Information

- Pure HTML, CSS, and JavaScript for the frontend
- Node.js for the optional server
- No external dependencies
- All processing happens in the browser

## Sample Data

A sample markdown file is included in the `Data` directory. Use it to test the application. 