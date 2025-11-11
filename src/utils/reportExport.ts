import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';

export async function exportReportAsPDF(
  reportName: string,
  totalPages: number,
  setCurrentPage: (page: number) => void,
  onProgress?: (current: number, total: number) => void
) {
  // Save current theme state
  const wasDarkMode = document.documentElement.classList.contains('dark');
  
  // Force light mode for export
  if (wasDarkMode) {
    document.documentElement.classList.remove('dark');
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    setCurrentPage(i);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const pageElement = document.querySelector(
      "[data-export-page]"
    ) as HTMLElement | null;

    if (!pageElement) continue;

    onProgress?.(i, totalPages);

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

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const imgPixelWidth = canvas.width;
    const imgPixelHeight = canvas.height;

    const ratio = Math.min(
      pageWidth / imgPixelWidth,
      pageHeight / imgPixelHeight
    );

    const imgWidth = imgPixelWidth * ratio;
    const imgHeight = imgPixelHeight * ratio;

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

  // Restore original theme
  if (wasDarkMode) {
    document.documentElement.classList.add('dark');
  }
}


export async function exportReportAsPPT(
  reportName: string,
  totalPages: number,
  setCurrentPage: (page: number) => void,
  onProgress?: (current: number, total: number) => void
) {
  // Save current theme state
  const wasDarkMode = document.documentElement.classList.contains('dark');
  
  // Force light mode for export
  if (wasDarkMode) {
    document.documentElement.classList.remove('dark');
  }

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

    slide.addImage({
     data: imgData,
     x: 0,
     y: 0,
     w: "100%",
     h: "100%",
   });
  }

  await pptx.writeFile({ fileName: `${reportName}-report.pptx` });

  // Restore original theme
  if (wasDarkMode) {
    document.documentElement.classList.add('dark');
  }
}
