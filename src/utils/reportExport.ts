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
    
    // Wait for page to render in hidden container
    await new Promise(resolve => setTimeout(resolve, 800));

    // Find the hidden export container (light mode)
    const pageElement = document.querySelector('[data-export-page]') as HTMLElement;
    if (!pageElement) continue;

    onProgress?.(i, totalPages);

    // Capture the page as canvas with light background
    const canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Add page to PDF
    if (i > 1) {
      pdf.addPage();
    }

    // Calculate dimensions to fit page
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
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
    
    // Wait for page to render in hidden container
    await new Promise(resolve => setTimeout(resolve, 800));

    // Find the hidden export container (light mode)
    const pageElement = document.querySelector('[data-export-page]') as HTMLElement;
    if (!pageElement) continue;

    onProgress?.(i, totalPages);

    // Capture the page as canvas with light background
    const canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Add slide with image
    const slide = pptx.addSlide();
    slide.addImage({
      data: imgData,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      sizing: { type: 'contain', w: '100%', h: '100%' }
    });
  }

  // Download the PPTX
  await pptx.writeFile({ fileName: `${reportName}-report.pptx` });
}
