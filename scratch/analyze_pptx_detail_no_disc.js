const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function analyze(filename) {
    const filePath = path.join('c:\\Antigravity\\PRESUPUESTOS', filename);
    const buffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buffer);

    const slide6 = await zip.file('ppt/slides/slide6.xml').async('string');

    console.log(`\n--- Detailed Slide 6 for ${filename} ---`);
    const paragraphs = slide6.match(/<a:p>.*?<\/a:p>/g) || [];
    paragraphs.forEach((p, i) => {
        if (p.includes('Bonificado por ahora')) {
            console.log(`Paragraph ${i}: [${p.replace(/<.*?>/g, '')}]`);
            console.log(`XML: ${p}\n`);
        }
    });
}

analyze('Propuesta Comercial - sin descuento.pptx').catch(console.error);
