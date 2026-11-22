import fs from 'fs';
import PDFParser from 'pdf2json';
import * as mammothModule from 'mammoth';

const mammoth = (mammothModule as any).default || mammothModule;

export async function extractText(filePath: string, mimeType: string): Promise<string> {
    console.log(`📄 Attempting to parse: ${filePath} (${mimeType})`);

    if (mimeType === 'application/pdf') {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            const pdfParser = new PDFParser(null, 1);

            pdfParser.on('pdfParser_dataError', (errData: any) => {
                console.error('❌ PDF Parse Error:', errData.parserError);
                reject(new Error('Failed to parse PDF: ' + errData.parserError));
            });

            pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                try {
                    let fullText = '';
                    if (pdfData && pdfData.Pages) {
                        for (let i = 0; i < pdfData.Pages.length; i++) {
                            const page = pdfData.Pages[i];
                            if (page.Texts) {
                                for (let j = 0; j < page.Texts.length; j++) {
                                    const textItem = page.Texts[j];
                                    if (textItem.R && textItem.R.length > 0) {
                                        fullText += decodeURIComponent(textItem.R[0].T) + ' ';
                                    }
                                }
                                fullText += '\n';
                            }
                        }
                    }
                    console.log('✅ PDF parsed successfully. Extracted text length:', fullText.length);
                    resolve(fullText.trim());
                } catch (err) {
                    console.error('❌ Error extracting text from PDF data:', err);
                    reject(new Error('Failed to extract text from parsed PDF.'));
                }
            });
            pdfParser.loadPDF(filePath);
        });
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value || '';
    } else if (mimeType === 'text/plain') {
        return fs.readFileSync(filePath, 'utf-8');
    }
    throw new Error(`Unsupported file type: ${mimeType}. Please use PDF, DOCX, or TXT.`);
}

export function parseQuestions(text: string): any[] {
    if (!text || typeof text !== 'string') {
        console.warn('⚠️ parseQuestions received empty or invalid text.');
        return [];
    }

    // 1. Clean up excessive spaces (PDF artifact fix)
    const cleanText = text.replace(/\s+/g, ' ').trim();

    // 2. Split the text by question numbers (e.g., "1. ", "2) ", "10. ")
    // The lookahead (?=...) ensures we split right before the number, keeping the number in the block
    const blocks = cleanText.split(/(?=\s*\d+[\.)]\s+)/).filter(b => b.trim().length > 0);

    const questions = [];

    for (const block of blocks) {
        // Check if this block actually starts with a question number (ignores headers like "1 | Page")
        const match = block.match(/^\s*(\d+)[\.)]\s+(.*)/);
        if (!match) continue; // Skip non-question blocks

        const qNum = match[1];
        let qText = match[2].trim();

        let qType = 'SINGLE_CHOICE';
        if (/true|false/i.test(qText)) qType = 'TRUE_FALSE';
        if (qText.includes('___') || qText.toLowerCase().includes('fill in')) qType = 'FILL_IN_THE_BLANK';
        if (qText.toLowerCase().includes('essay') || qText.toLowerCase().includes('discuss') || qText.toLowerCase().includes('explain')) qType = 'ESSAY';

        // 3. Extract options from the rest of the block
        const choices = [];
        // Split the remaining text by option patterns (A., B), a., etc.)
        const optionParts = qText.split(/(?=\s+[a-dA-D][\.)]\s+)/);

        if (optionParts.length > 1) {
            // The first part is the question text
            qText = optionParts[0].trim();

            // The rest are options
            for (let i = 1; i < optionParts.length; i++) {
                const optMatch = optionParts[i].match(/^\s+([a-dA-D])[\.)]\s+(.*)/);
                if (optMatch) {
                    choices.push({
                        id: `c-${qNum}-${optMatch[1].toLowerCase()}`,
                        text: optMatch[2].trim(),
                        isCorrect: false
                    });
                }
            }
        }

        questions.push({
            questionText: qText,
            questionType: qType,
            choices: choices,
            marks: 1,
            acceptedAnswers: qType === 'FILL_IN_THE_BLANK' ? [] : undefined,
            markingInstructions: qType === 'ESSAY' ? 'Grade based on clarity and accuracy.' : undefined
        });
    }

    console.log('🧩 Total questions parsed:', questions.length);

    // Ensure default choices to prevent UI crashes
    return questions.map(q => {
        if (q.questionType === 'SINGLE_CHOICE' && q.choices.length === 0) {
            q.choices = [
                { id: 'c-1', text: 'Option 1', isCorrect: false },
                { id: 'c-2', text: 'Option 2', isCorrect: false }
            ];
        }
        if (q.questionType === 'TRUE_FALSE' && q.choices.length === 0) {
            q.choices = [
                { id: 'tf-true', text: 'True', isCorrect: false },
                { id: 'tf-false', text: 'False', isCorrect: false }
            ];
        }
        return q;
    });
}
