import fs from 'fs/promises';

async function getPdfParse(): Promise<(buffer: Buffer) => Promise<{ text: string }>> {
    const mod: any = await import('pdf-parse');
    const fn = mod?.default ?? mod;
    return fn as (buffer: Buffer) => Promise<{ text: string }>;
}

/**
 * PDF文本提取服务
 */
export class PDFParser {
    /**
     * 从单个PDF文件提取文本
     */
    async extractText(pdfPath: string): Promise<string> {
        try {
            const dataBuffer = await fs.readFile(pdfPath);
            const pdf = await getPdfParse();
            const data = await pdf(dataBuffer);
            return data.text;
        } catch (error) {
            console.error(`Failed to extract PDF text from ${pdfPath}:`, error);
            throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * 批量提取所有剧本PDF的文本
     */
    async parseAllScripts(
        dmHandbookPath: string,
        characterScriptPaths: string[]
    ): Promise<{
        dmText: string;
        characterTexts: Array<{ index: number; text: string; path: string }>;
    }> {
        console.log('[PDFParser] Extracting DM handbook...');
        const dmText = await this.extractText(dmHandbookPath);
        console.log(`[PDFParser] DM handbook extracted: ${dmText.length} characters`);

        console.log(`[PDFParser] Extracting ${characterScriptPaths.length} character scripts...`);
        const characterTexts = await Promise.all(
            characterScriptPaths.map(async (path, index) => {
                const text = await this.extractText(path);
                console.log(`[PDFParser] Character ${index} extracted: ${text.length} characters`);
                return { index, text, path };
            })
        );

        return { dmText, characterTexts };
    }

    /**
     * 清理和预处理文本（移除多余空格、特殊字符等）
     */
    cleanText(text: string): string {
        return text
            .replace(/\s+/g, ' ')           // 多个空格替换为单个
            .replace(/[\r\n]+/g, '\n')      // 统一换行符
            .trim();
    }
}

export const pdfParser = new PDFParser();

// Export for convenience
export async function parseAllScripts(
    dmHandbookPath: string,
    characterScriptPaths: string[]
) {
    return pdfParser.parseAllScripts(dmHandbookPath, characterScriptPaths);
}
