const fs = require('fs');
const pdf = require('pdf-parse');

async function convertPdfToText(pdfPath, outputPath) {
    try {
        // Read the PDF file
        const dataBuffer = fs.readFileSync(pdfPath);
        
        // Parse the PDF
        const data = await pdf(dataBuffer);
        
        // Write the text content to a file
        fs.writeFileSync(outputPath, data.text);
        
        console.log(`Successfully converted ${pdfPath} to text`);
        console.log(`Text file saved at: ${outputPath}`);
        
    } catch (error) {
        console.error('Error converting PDF to text:', error.message);
    }
}

// Get the PDF file path from command line arguments
const pdfPath = process.argv[2];
const outputPath = process.argv[3] || pdfPath.replace('.pdf', '.txt');

if (!pdfPath) {
    console.error('Please provide a PDF file path');
    process.exit(1);
}

convertPdfToText(pdfPath, outputPath); 