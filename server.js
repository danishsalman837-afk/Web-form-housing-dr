const express = require("express");
const bodyParser = require("body-parser");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Path to Excel file
const DATA_FILE = path.join(__dirname, "data.xlsx");

// Root route
app.get("/", (req, res) => {
    console.log("Root route accessed");
    res.sendFile(path.join(__dirname, "form.html"), (err) => {
        if (err) {
            console.error("Error sending file:", err);
            res.status(500).send("Error loading form");
        }
    });
});

// --------------------
// Handle form submission
app.post("/submit", (req, res) => {
    const data = req.body;
    data.timestamp = new Date().toLocaleString(); // Add submission timestamp

    let excelData = [];

    // Read existing Excel data if file exists
    if (fs.existsSync(DATA_FILE)) {
        const workbook = XLSX.readFile(DATA_FILE);
        const sheet = workbook.Sheets["Sheet1"];
        excelData = XLSX.utils.sheet_to_json(sheet);
    }

    // Add new submission
    excelData.push(data);

    // Write back to Excel
    const newSheet = XLSX.utils.json_to_sheet(excelData);
    const newBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newBook, newSheet, "Sheet1");
    XLSX.writeFile(newBook, DATA_FILE);

    // Send JSON response instead of redirecting
    res.json({ success: true, message: "Form submitted successfully" });
});

// --------------------
// Admin API: Get all submissions in JSON
app.get("/api/submissions", (req, res) => {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    const workbook = XLSX.readFile(DATA_FILE);
    const sheet = workbook.Sheets["Sheet1"];
    const data = XLSX.utils.sheet_to_json(sheet);
    res.json(data);
});

// --------------------
// Download Excel file
app.get("/admin/download", (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        res.download(DATA_FILE, "HousingSubmissions.xlsx");
    } else {
        res.status(404).send("No submissions found yet.");
    }
});

// --------------------
// Start server
const server = app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Form available at: http://localhost:${PORT}`);
    console.log(`✓ API available at: http://localhost:${PORT}/api/submissions`);
});

// Handle server errors
server.on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
});