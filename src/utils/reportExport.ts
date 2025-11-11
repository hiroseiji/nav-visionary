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
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // ~210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // ~297mm

  for (let i = 1; i <= totalPages; i++) {
    // 1. Show the correct "virtual" page
    setCurrentPage(i);

    // 2. Allow React/charts/fonts to render
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3. Select the export wrapper for this page
    const pageElement = document.querySelector(
      "[data-export-page]"
    ) as HTMLElement | null;

    if (!pageElement) continue;

    onProgress?.(i, totalPages);

    // Get actual rendered dimensions
    const elementWidth = pageElement.offsetWidth;
    const elementHeight = pageElement.offsetHeight;

    // 4. Render to canvas at high DPI
    const canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: elementWidth,
      height: elementHeight,
      windowWidth: elementWidth,
      windowHeight: elementHeight,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // 5. Compute scaled dimensions to fit EXACTLY within A4
    const imgPixelWidth = canvas.width;
    const imgPixelHeight = canvas.height;

    // Convert canvas px -> mm using ratio relative to pageWidth
    // Then clamp by pageHeight while preserving aspect ratio.
    const ratio = Math.min(
      pageWidth / imgPixelWidth,
      pageHeight / imgPixelHeight
    );

    const imgWidth = imgPixelWidth * ratio;
    const imgHeight = imgPixelHeight * ratio;

    // Center the image on the page
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    if (i > 1) {
      pdf.addPage();
    }

    pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
  }

  pdf.setProperties({
    title: `${reportName} Report`,
    creator: "Social Light",
  });

  pdf.save(`${reportName}-report.pdf`);
}


export async function exportReportAsPPT(
  reportName: string,
  totalPages: number,
  setCurrentPage: (page: number) => void,
  onProgress?: (current: number, total: number) => void
) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Report System";
  pptx.company = reportName;
  pptx.title = `${reportName} Report`;

  for (let i = 1; i <= totalPages; i++) {
    setCurrentPage(i);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const pageElement = document.querySelector(
      "[data-export-page]"
    ) as HTMLElement | null;
    if (!pageElement) continue;

    onProgress?.(i, totalPages);

    // Get actual rendered dimensions
    const elementWidth = pageElement.offsetWidth;
    const elementHeight = pageElement.offsetHeight;

    const canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: elementWidth,
      height: elementHeight,
      windowWidth: elementWidth,
      windowHeight: elementHeight,
    });

    const imgData = canvas.toDataURL("image/png");

    const slide = pptx.addSlide();

    // Auto fit into 16x9 slide
   slide.addImage({
     data: imgData,
     x: 0,
     y: 0,
     w: "100%",
     h: "100%",
   });
  }

  await pptx.writeFile({ fileName: `${reportName}-report.pptx` });
}
