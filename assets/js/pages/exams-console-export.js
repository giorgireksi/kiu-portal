(function initExamConsoleExportModule() {
    if (window.__KIU_EXAMS_EXPORT_MODULE_LOADED) return;
    window.__KIU_EXAMS_EXPORT_MODULE_LOADED = true;

    const hooks = window.__kiuExamsExportHooks || {};
    const {
        getTemplateDraft,
        getTemplateById,
        formatCourseYearLabel,
        notify
    } = hooks;

    if (
        typeof getTemplateDraft !== 'function'
        || typeof getTemplateById !== 'function'
        || typeof formatCourseYearLabel !== 'function'
        || typeof notify !== 'function'
    ) {
        throw new Error('Exams export hooks are unavailable.');
    }


    function getExportData(templateOrDraft) {
        const d = templateOrDraft || {};
        const bank = d.questionBank || d.questions || [];
        const variants = d.variants || [];
        const totalScore = bank.reduce((s, q) => s + (parseInt(q.score, 10) || 1), 0);
        const subjectLabel = `${d.subjectName || d.subjectId || ''}${d.courseNumber ? ` | ${formatCourseYearLabel(d.courseNumber)}` : ''}${d.courseCode ? ` | No. ${d.courseCode}` : ''}`;
        return {
            title: d.title || d.subjectName || 'Untitled Quiz',
            subject: subjectLabel,
            courseNumber: d.courseNumber || '',
            courseCode: d.courseCode || '',
            type: d.examType === 'paper' ? 'Paper' : 'Digital',
            duration: d.durationMinutes || 90,
            passingScore: d.passingScore || 50,
            instructions: d.instructions || '',
            bank,
            variants,
            totalScore
        };
    }

    function buildQuestionLines(bank) {
        const lines = [];
        bank.forEach((q, qi) => {
            const num = qi + 1;
            lines.push({ type: 'question', text: `Q${num}. ${q.text || '(No text)'}`, score: q.score || 1 });
            if (Array.isArray(q.options)) {
                q.options.forEach((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    const isCorrect = Number(q.correctOption) === oi;
                    lines.push({ type: 'option', text: `   ${letter}) ${opt || '(empty)'}`, correct: isCorrect });
                });
            }
            lines.push({ type: 'gap' });
        });
        return lines;
    }

    /* â”€â”€ PDF Export â”€â”€ */
    function exportToPDF(data) {
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            notify('PDF library not loaded. Please check your internet connection.');
            return;
        }
        const { jsPDF } = window.jspdf || window;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 18;
        const usable = pageW - margin * 2;
        let y = 20;
        const lineH = 6;

        function checkPage(need) {
            if (y + need > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
            }
        }

        // Header
        doc.setFillColor(30, 58, 95);
        doc.rect(0, 0, pageW, 38, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(data.title, margin, 16);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.subject}  |  ${data.type}  |  ${data.duration} min  |  Pass: ${data.passingScore} pts`, margin, 26);
        doc.text(`Total: ${data.bank.length} questions  Â·  ${data.totalScore} points`, margin, 33);
        y = 48;
        doc.setTextColor(0, 0, 0);

        // Instructions
        if (data.instructions) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Instructions:', margin, y);
            y += lineH;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const instrLines = doc.splitTextToSize(data.instructions, usable);
            checkPage(instrLines.length * 4 + 6);
            doc.text(instrLines, margin, y);
            y += instrLines.length * 4 + 6;
        }

        // Separator
        doc.setDrawColor(200);
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        // Questions
        const lines = buildQuestionLines(data.bank);
        lines.forEach(line => {
            if (line.type === 'gap') { y += 3; return; }
            checkPage(lineH + 2);
            if (line.type === 'question') {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                const qLines = doc.splitTextToSize(line.text, usable - 20);
                qLines.forEach(ql => {
                    checkPage(lineH);
                    doc.text(ql, margin, y);
                    y += lineH;
                });
                // Score badge
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100);
                doc.text(`[${line.score} pt${line.score > 1 ? 's' : ''}]`, pageW - margin - 12, y - lineH);
                doc.setTextColor(0);
            } else if (line.type === 'option') {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                if (line.correct) {
                    doc.setTextColor(16, 138, 80);
                    doc.setFont('helvetica', 'bold');
                }
                const oLines = doc.splitTextToSize(line.text, usable - 10);
                oLines.forEach(ol => {
                    checkPage(lineH - 1);
                    doc.text(ol, margin + 6, y);
                    y += lineH - 1;
                });
                if (line.correct) {
                    doc.text(' âœ“', margin + 6 + doc.getTextWidth(oLines[0]) + 1, y - (lineH - 1));
                }
                doc.setTextColor(0);
                doc.setFont('helvetica', 'normal');
            }
        });

        // Variants summary
        if (data.variants.length) {
            checkPage(20);
            y += 6;
            doc.setDrawColor(200);
            doc.line(margin, y, pageW - margin, y);
            y += 8;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Variants (${data.variants.length})`, margin, y);
            y += lineH + 2;
            data.variants.forEach(v => {
                checkPage(lineH);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`${v.label}: ${(v.questionIds || []).length} questions`, margin + 4, y);
                y += lineH;
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}  |  ${data.title}  |  Generated: ${new Date().toLocaleDateString()}`, margin, doc.internal.pageSize.getHeight() - 8);
        }

        const filename = (data.title || 'quiz').replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
        doc.save(filename);
        notify(`PDF exported: ${filename}`);
    }

    /* â”€â”€ DOCX Export â”€â”€ */
    function exportToDOCX(data) {
        if (typeof window.docx === 'undefined') {
            notify('DOCX library not loaded. Please check your internet connection.');
            return;
        }
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TableRow, TableCell, Table, WidthType } = window.docx;

        const children = [];

        // Title
        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: data.title, bold: true, size: 36, color: '1E3A5F' })]
        }));

        // Meta line
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
                new TextRun({ text: `${data.subject}  |  ${data.type}  |  ${data.duration} min  |  Pass: ${data.passingScore} pts`, size: 20, color: '666666' })
            ]
        }));

        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
                new TextRun({ text: `${data.bank.length} questions  Â·  ${data.totalScore} points`, size: 20, color: '888888' })
            ]
        }));

        // Instructions
        if (data.instructions) {
            children.push(new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: 'Instructions', bold: true, size: 24 })]
            }));
            children.push(new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({ text: data.instructions, size: 20, italics: true, color: '444444' })]
            }));
        }

        // Separator
        children.push(new Paragraph({
            spacing: { before: 100, after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
            children: []
        }));

        // Questions
        data.bank.forEach((q, qi) => {
            const num = qi + 1;
            children.push(new Paragraph({
                spacing: { before: 200, after: 80 },
                children: [
                    new TextRun({ text: `Q${num}. `, bold: true, size: 22 }),
                    new TextRun({ text: q.text || '(No text)', size: 22 }),
                    new TextRun({ text: `  [${q.score || 1} pt${(q.score || 1) > 1 ? 's' : ''}]`, size: 18, color: '999999' })
                ]
            }));

            if (Array.isArray(q.options)) {
                q.options.forEach((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    const isCorrect = Number(q.correctOption) === oi;
                    children.push(new Paragraph({
                        spacing: { after: 40 },
                        indent: { left: 400 },
                        children: [
                            new TextRun({
                                text: `${letter}) ${opt || '(empty)'}`,
                                size: 20,
                                bold: isCorrect,
                                color: isCorrect ? '108A50' : '333333'
                            }),
                            ...(isCorrect ? [new TextRun({ text: '  âœ“ correct', size: 16, bold: true, color: '108A50' })] : [])
                        ]
                    }));
                });
            }
        });

        // Variants
        if (data.variants.length) {
            children.push(new Paragraph({
                spacing: { before: 300, after: 100 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
                children: []
            }));
            children.push(new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 120 },
                children: [new TextRun({ text: `Variants (${data.variants.length})`, bold: true, size: 24 })]
            }));
            data.variants.forEach(v => {
                children.push(new Paragraph({
                    spacing: { after: 60 },
                    indent: { left: 200 },
                    children: [
                        new TextRun({ text: `${v.label}: `, bold: true, size: 20 }),
                        new TextRun({ text: `${(v.questionIds || []).length} questions`, size: 20, color: '666666' })
                    ]
                }));
            });
        }

        // Footer
        children.push(new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 16, color: 'AAAAAA' })]
        }));

        const docFile = new Document({
            sections: [{
                properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } },
                children
            }]
        });

        const filename = (data.title || 'quiz').replace(/[^a-zA-Z0-9_-]/g, '_') + '.docx';
        Packer.toBlob(docFile).then(blob => {
            if (typeof saveAs === 'function') {
                saveAs(blob, filename);
            } else {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
                URL.revokeObjectURL(a.href);
            }
            notify(`DOCX exported: ${filename}`);
        }).catch(err => {
            console.error('DOCX export failed:', err);
            notify('DOCX export failed. See console for details.');
        });
    }

    /* â”€â”€ Export from active draft (builder) â”€â”€ */
    window.__kiuExportQuizAsImpl = async function exportQuizAs(format) {
        const draft = getTemplateDraft();
        if (!draft) { notify('No quiz draft open.'); return; }
        const data = getExportData(draft);
        if (!data.bank.length) { notify('Add at least one question before exporting.'); return; }
        try {
            await Promise.resolve(window.ensureExamExportLibraries?.(format));
        } catch (error) {
            notify(`Could not load ${String(format || '').toUpperCase()} export tools.`);
            return;
        }
        if (format === 'docx') exportToDOCX(data);
        else exportToPDF(data);
    };

    /* â”€â”€ Export from template list by ID â”€â”€ */
    window.__kiuExportQuizByIdImpl = async function exportQuizById(templateId, format) {
        const template = getTemplateById(templateId);
        if (!template) { notify('Template not found.'); return; }
        const data = getExportData(template);
        if (!data.bank.length) { notify('This quiz has no questions to export.'); return; }
        try {
            await Promise.resolve(window.ensureExamExportLibraries?.(format));
        } catch (error) {
            notify(`Could not load ${String(format || '').toUpperCase()} export tools.`);
            return;
        }
        if (format === 'docx') exportToDOCX(data);
        else exportToPDF(data);
    };

})();
