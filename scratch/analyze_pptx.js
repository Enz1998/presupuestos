const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function analyze(filename) {
    console.log(`--- Analyzing ${filename} ---`);
    const filePath = path.join('c:\\Antigravity\\PRESUPUESTOS', filename);
    const buffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buffer);

    const slide1 = await zip.file('ppt/slides/slide1.xml').async('string');
    const slide6 = await zip.file('ppt/slides/slide6.xml').async('string');

    console.log('SLIDE 1 (Snippet):', slide1.substring(0, 1000)); // Just a snippet or grep for text
    
    // Find text content in Slide 1
    const tTags1 = slide1.match(/<a:t>.*?<\/a:t>/g);
    console.log('SLIDE 1 Text units:', tTags1 ? tTags1.length : 0);
    console.log('SLIDE 1 Text samples:', tTags1 ? tTags1.slice(0, 20).join(' | ') : 'none');

    // Find text content in Slide 6
    const tTags6 = slide6.match(/<a:t>.*?<\/a:t>/g);
    console.log('SLIDE 6 Text units:', tTags6 ? tTags6.length : 0);
    console.log('SLIDE 6 Text samples:', tTags6 ? tTags6.slice(0, 50).join(' | ') : 'none');
    
    // Specifically look for the things we currently replace
    const keywords = ['Luminitec', 'SRL', '15/04/26', '212', '464', '342'];
    keywords.forEach(k => {
        if (slide1.includes(k)) console.log(`Slide 1 has "${k}"`);
        if (slide6.includes(k)) console.log(`Slide 6 has "${k}"`);
    });
}

async function run() {
    await analyze('Propuesta Comercial - con descuento.pptx');
    await analyze('Propuesta Comercial - sin descuento.pptx');
}

run().catch(console.error);
