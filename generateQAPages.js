// run node generateQAPages.js

const fs = require("fs");
const path = require("path");

// Load the JSON data
const data = JSON.parse(
  fs.readFileSync("./src/QARepo/QAs.json", "utf8")
);

// Load the HTML template
const template = fs.readFileSync("./src/QARepo/QAPageTemplate.html", "utf8");

// Create output folder
const outputDir = path.join(__dirname, "src", "pages", "faq");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Slugify function
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// Generate each HTML file
data.forEach((item, index) => {
  const slug = slugify(item.question);
  const html = template
    .replace(/{{QUESTION}}/g, item.question)
    .replace(/{{ANSWER}}/g, item.answer)
    .replace(/{{TITLE}}/g, item.title)
    .replace(/{{DESCRIPTION}}/g, item.description)
    .replace(/{{PATH}}/g, item.path);

  const filePath = path.join(outputDir, `${slug}.html`);
  fs.writeFileSync(filePath, html, "utf8");
});

console.log(`✅ Created ${data.length} HTML files in /output`);
