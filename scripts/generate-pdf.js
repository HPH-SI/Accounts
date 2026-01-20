const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

async function generatePDF() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  const htmlPath = path.join(__dirname, '..', 'document.html')
  const html = fs.readFileSync(htmlPath, 'utf8')
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const outputPath = path.join(__dirname, '..', 'document.pdf')
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm',
    },
  })

  await browser.close()
  console.log(`PDF generated: ${outputPath}`)
}

generatePDF().catch((error) => {
  console.error('PDF generation failed:', error)
  process.exit(1)
})
