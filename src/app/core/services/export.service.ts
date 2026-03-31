import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import saveAs from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  exportarExcel(datos: any[], nombreArchivo: string) {
    if (!datos || datos.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    const nombresColumnas = Object.keys(datos[0]);
    worksheet.columns = nombresColumnas.map((col) => ({
      header: col,
      key: col,
    }));

    worksheet.addRows(datos);

    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;

    for (let i = 1; i <= nombresColumnas.length; i++) {
      const cell = headerRow.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' },
      };
    }

    const indiceTipo = nombresColumnas.indexOf('Tipo') + 1;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        let colorFondoFila = rowNumber % 2 === 0 ? 'FFF2F2F2' : 'FFFFFFFF';

        if (indiceTipo > 0) {
          const tipoMovimiento = row.getCell(indiceTipo).value?.toString() || '';
          if (tipoMovimiento === 'INGRESO') colorFondoFila = 'FFE2EFDA';
          if (tipoMovimiento === 'EGRESO') colorFondoFila = 'FFFCE4D6';
        }

        for (let i = 1; i <= nombresColumnas.length; i++) {
          const cell = row.getCell(i);
          const nombreColumna = nombresColumnas[i - 1];

          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          if (nombreColumna === 'Fecha Nac.' || nombreColumna === 'Fecha') {
            const fechaStr = cell.value?.toString() || '';
            if (fechaStr.includes('T') && fechaStr.includes('-')) {
              const [year, month, day] = fechaStr.split('T')[0].split('-');
              cell.value = `${day}/${month}/${year}`;
            }
          }

          if (nombreColumna === 'DNI' && cell.value) {
            cell.value = Number(cell.value);
            cell.numFmt = '#,##0';
          }

          if (nombreColumna === 'Monto' && cell.value !== null) {
            cell.value = Number(cell.value);
            cell.numFmt = '"$" #,##0.00';
          }

          let colorCelda = colorFondoFila;
          if (nombreColumna === 'Rama' && cell.value) {
            const rama = cell.value.toString();
            if (rama === 'Manada') colorCelda = 'FFFFF2CC';
            if (rama === 'Unidad') colorCelda = 'FFE2EFDA';
            if (rama === 'Caminantes') colorCelda = 'FFDDEBF7';
            if (rama === 'Rovers') colorCelda = 'FFFCE4D6';
          }

          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorCelda } };
        }
      }
    });

    for (let i = 1; i <= nombresColumnas.length; i++) {
      let maxLength = 0;
      const column = worksheet.getColumn(i);
      column.eachCell({ includeEmpty: true }, (cell) => {
        let texto = cell.value ? cell.value.toString() : '';
        if (cell.numFmt === '"$" #,##0.00') texto = '$ 000.000,00';

        if (texto.length > maxLength) maxLength = texto.length;
      });
      column.width = maxLength < 10 ? 10 : maxLength + 3;
    }

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `${nombreArchivo}.xlsx`);
    });
  }

  exportarPDF(columnas: string[], datos: any[][], nombreArchivo: string, tituloReporte: string) {
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.setFontSize(18);
    doc.text(tituloReporte, 14, 20);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 28);

    const datosFormateados = datos.map((fila) => {
      return fila.map((celda) => {
        if (typeof celda === 'string' && celda.includes('T') && celda.includes('-')) {
          const partes = celda.split('T')[0].split('-');
          if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return celda;
      });
    });

    const indiceRama = columnas.indexOf('Rama');
    const indiceTipo = columnas.indexOf('Tipo');

    autoTable(doc, {
      startY: 35,
      head: [columnas],
      body: datosFormateados,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, valign: 'middle', halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      didParseCell: (data) => {
        if (data.section === 'body') {
          let colorFondo: [number, number, number] =
            data.row.index % 2 === 0 ? [242, 242, 242] : [255, 255, 255];

          if (indiceTipo !== -1) {
            const tipo = (data.row.raw as any[])[indiceTipo];
            if (tipo === 'INGRESO') colorFondo = [226, 239, 218];
            if (tipo === 'EGRESO') colorFondo = [252, 228, 214];
          }

          if (indiceRama !== -1 && data.column.index === indiceRama) {
            const rama = (data.row.raw as any[])[indiceRama];
            if (rama === 'Manada') colorFondo = [255, 242, 204];
            if (rama === 'Unidad') colorFondo = [226, 239, 218];
            if (rama === 'Caminantes') colorFondo = [221, 235, 247];
            if (rama === 'Rovers') colorFondo = [252, 228, 214];
          }

          data.cell.styles.fillColor = colorFondo;
        }
      },
    });

    doc.save(`${nombreArchivo}.pdf`);
  }
}
