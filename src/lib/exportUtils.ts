/**
 * Util functions for exporting data in different formats
 * All exports are formatted for pt-BR (Brazilian Portuguese) compatibility
 */
import { type Leave } from "./types";

// UTF-8 BOM for Excel pt-BR compatibility
const BOM = '\uFEFF';

/**
 * Exporta afastamentos para formato TXT (legível)
 * @param {Array} leaves - Array de afastamentos
 * @returns {string} Conteúdo em formato TXT
 */
export function exportToTXT(leaves: Leave[]): string {
    let content = '========================================\n';
    content += '      RELATÓRIO DE AFASTAMENTOS        \n';
    content += '========================================\n\n';
    content += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
    content += `Total de registros: ${leaves.length}\n\n`;
    content += '========================================\n\n';

    leaves.forEach((leave, index) => {
        content += `[${index + 1}] ${leave.employeeName}\n`;
        content += `-`.repeat(40) + '\n';
        content += `Cargo: ${leave.employeeRole}\n`;
        content += `Tipo: ${leave.type}\n`;
        content += `Período: ${new Date(leave.startDate).toLocaleDateString('pt-BR')} até ${new Date(leave.endDate).toLocaleDateString('pt-BR')}\n`;
        content += `Dias: ${leave.daysOff} dias corridos (${leave.workDaysOff || 'N/A'} úteis)\n`;
        content += `Status: ${leave.status}\n`;
        if (leave.notes) {
            content += `Observações: ${leave.notes}\n`;
        }
        content += '\n';
    });

    content += '========================================\n';
    content += 'Fim do Relatório\n';
    content += '========================================\n';

    return content;
}

/**
 * Exporta afastamentos para formato CSV (Excel pt-BR compatível)
 * - UTF-8 com BOM
 * - Delimitador: ; (ponto e vírgula)
 * - Quebra de linha: CRLF
 * @param {Array} leaves - Array de afastamentos
 * @returns {string} Conteúdo em formato CSV
 */
export function exportToCSV(leaves: Leave[]): string {
    // Headers
    const headers = [
        'Colaborador',
        'Cargo',
        'Tipo',
        'Data Início',
        'Data Fim',
        'Dias Corridos',
        'Dias Úteis',
        'Status',
        'Observações'
    ];

    // Início do CSV com BOM para Excel pt-BR
    let csvContent = BOM + headers.join(';') + '\r\n';

    // Linhas de dados
    leaves.forEach(leave => {
        const row = [
            escapeCSV(leave.employeeName),
            escapeCSV(leave.employeeRole),
            escapeCSV(leave.type),
            formatDateBR(leave.startDate),
            formatDateBR(leave.endDate),
            String(leave.daysOff),
            leave.workDaysOff ? String(leave.workDaysOff) : 'N/A',
            escapeCSV(leave.status),
            escapeCSV(leave.notes || '')
        ];

        csvContent += row.join(';') + '\r\n';
    });

    return csvContent;
}

/**
 * Escapa strings para CSV pt-BR (adiciona aspas se necessário)
 * Trata campos com ; (delimitador), aspas ou quebra de linha
 * @param {string} value - Valor a escapar
 * @returns {string} Valor escapado
 */
function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    // Se contém ponto-e-vírgula, aspas ou quebra de linha, envolver com aspas
    if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        // Duplicar aspas internas
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Formata data para formato brasileiro dd/MM/yyyy
 * @param {string} dateString - Data em formato ISO
 * @returns {string} Data formatada
 */
function formatDateBR(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

/**
 * Faz download de um arquivo
 * @param {string} content - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {string} mimeType - Tipo MIME do arquivo
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain'): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

/**
 * Exporta afastamentos para formato XLSX (Excel) usando ExcelJS
 * @param {Array} leaves - Array de afastamentos
 */
export async function exportToXLSX(leaves: Leave[]): Promise<void> {
    const ExcelJS = await import('exceljs');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Project_Ausencias';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Afastamentos');

    // Definir cabeçalhos com estilo
    worksheet.columns = [
        { header: 'Colaborador', key: 'colaborador', width: 25 },
        { header: 'Cargo', key: 'cargo', width: 20 },
        { header: 'Tipo', key: 'tipo', width: 15 },
        { header: 'Data Início', key: 'dataInicio', width: 12 },
        { header: 'Data Fim', key: 'dataFim', width: 12 },
        { header: 'Dias Corridos', key: 'diasCorridos', width: 12 },
        { header: 'Dias Úteis', key: 'diasUteis', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Observações', key: 'observacoes', width: 30 },
    ];

    // Estilizar cabeçalho
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Adicionar dados
    leaves.forEach(leave => {
        worksheet.addRow({
            colaborador: leave.employeeName,
            cargo: leave.employeeRole,
            tipo: leave.type,
            dataInicio: formatDateBR(leave.startDate),
            dataFim: formatDateBR(leave.endDate),
            diasCorridos: leave.daysOff,
            diasUteis: leave.workDaysOff || 'N/A',
            status: leave.status,
            observacoes: leave.notes || ''
        });
    });

    // Gerar arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const filename = `afastamentos_${new Date().toISOString().split('T')[0]}.xlsx`;
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Handler para exportar TXT
 */
export function handleExportTXT(leaves: Leave[]): void {
    const content = exportToTXT(leaves);
    const filename = `afastamentos_${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(content, filename, 'text/plain');
}

/**
 * Handler para exportar CSV
 */
export function handleExportCSV(leaves: Leave[]): void {
    const content = exportToCSV(leaves);
    const filename = `afastamentos_${new Date().toISOString().split('T')[0]}.csv`;
    // text/csv com UTF-8 para compatibilidade
    downloadFile(content, filename, 'text/csv');
}
