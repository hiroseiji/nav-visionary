import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';

export async function exportReportAsPDF(
  reportName: string,
  totalPages: number,
  setCurrentPage: (page: number) => void,
  onProgress?: (current: number, total: number) => void
) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    // Navigate to the page
    setCurrentPage(i);
    
    // Wait for page to render and all images to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Wait for images and fonts to load
    await document.fonts.ready;
    const images = document.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        img =>
          new Promise(resolve => {
            if (img.complete) resolve(true);
            else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    );

    // Find the page content
    const pageElement = document.querySelector('[data-report-page]') as HTMLElement;
    if (!pageElement) continue;

    onProgress?.(i, totalPages);

    // Capture the page as canvas with exact dimensions
    const canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: pageElement.scrollWidth,
      height: pageElement.scrollHeight,
      windowWidth: pageElement.scrollWidth,
      windowHeight: pageElement.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Add page to PDF
    if (i > 1) {
      pdf.addPage();
    }

    // Calculate dimensions to fit page perfectly
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // If image is taller than page, scale it down to fit
    if (imgHeight > pageHeight) {
      const scaledWidth = (canvas.width * pageHeight) / canvas.height;
      const xOffset = (pageWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, pageHeight);
    } else {
      // Center vertically if shorter than page
      const yOffset = (pageHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
    }
  }

  // Download the PDF
  pdf.save(`${reportName}-report.pdf`);
}

export async function exportReportAsPPT(
  reportName: string,
  totalPages: number,
  setCurrentPage: (page: number) => void,
  onProgress?: (current: number, total: number) => void
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Report System';
  pptx.company = reportName;
  pptx.title = `${reportName} Report`;

  for (let i = 1; i <= totalPages; i++) {
    // Navigate to the page
    setCurrentPage(i);
    
    // Wait for page to render and all images to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Wait for images and fonts to load
    await document.fonts.ready;
    const images = document.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        img =>
          new Promise(resolve => {
            if (img.complete) resolve(true);
            else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    );

    // Find the page content
    const pageElement = document.querySelector('[data-report-page]') as HTMLElement;
    if (!pageElement) continue;

    onProgress?.(i, totalPages);

    // Capture the page as canvas with exact dimensions
    const canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: pageElement.scrollWidth,
      height: pageElement.scrollHeight,
      windowWidth: pageElement.scrollWidth,
      windowHeight: pageElement.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Add slide with image (16:9 aspect ratio)
    const slide = pptx.addSlide();
    slide.addImage({
      data: imgData,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      sizing: { type: 'cover', w: '100%', h: '100%' }
    });
  }

  // Download the PPTX
  await pptx.writeFile({ fileName: `${reportName}-report.pptx` });
}
