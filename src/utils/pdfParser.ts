import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export const extractTextFromPDF = async (file: File): Promise<string[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pagesText: string[] = [];

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Group items by Y coordinate (with tolerance) to reconstruct rows
        const items = textContent.items as any[];
        const rows: { y: number; items: any[] }[] = [];
        const yTolerance = 5;

        for (const item of items) {
            const y = item.transform[5];
            // Find an existing row with similar Y
            const row = rows.find(r => Math.abs(r.y - y) < yTolerance);
            if (row) {
                row.items.push(item);
            } else {
                rows.push({ y, items: [item] });
            }
        }

        // Sort rows by Y (descending for PDF, usually top to bottom is decreasing Y? 
        // Wait, PDF coordinate system: (0,0) is usually bottom-left.
        // So top of page has higher Y. We want to read top to bottom, so sort Descending Y.
        rows.sort((a, b) => b.y - a.y);

        // Process each row
        const pageLines = rows.map(row => {
            // Sort items in row by X (ascending)
            row.items.sort((a, b) => a.transform[4] - b.transform[4]);
            // Join with spaces
            return row.items.map(item => item.str).join(' ');
        });

        pagesText.push(pageLines.join('\n'));
    }

    return pagesText;
};
