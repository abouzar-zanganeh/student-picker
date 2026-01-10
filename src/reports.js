/* ==========================================================================
   reports.js introduction
   --------------------------------------------------------------------------
   This JS file handles the generation and layout logic for printable reports 
   and class lists.
   ========================================================================== */


import * as state from "./state";
import { closeActiveModal, openModal, reportCancelBtn, reportColumnsContainer, reportPrintBtn } from "./ui";
import { showNotification } from './notifyingMessaging';
import { sortStudents } from "./utils";


export function generatePrintableReport(classroom, selectedColumns, sortMode = 'default', needsWarningFootnote = false) {
    // 1. Prepare Data
    let students = [...state.getActiveItems(classroom.students)];
    const dateStr = new Date().toLocaleDateString('fa-IR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });

    // 2. Apply Sorting using sorting helper in utils.js
    if (sortMode === 'alpha') {
        students = sortStudents(students);
    }

    // 3. Build Table Headers
    let theadHtml = '<tr>';
    selectedColumns.forEach(col => {
        theadHtml += `<th>${col.label}</th>`;
    });
    theadHtml += '</tr>';

    // 4. Build Table Rows
    let tbodyHtml = '';
    students.forEach((student, index) => {
        tbodyHtml += '<tr>';
        selectedColumns.forEach(col => {
            let cellValue = '-';

            if (col.id === 'row_num') cellValue = index + 1;
            else if (col.id === 'name') {
                if (student.identity.firstName && student.identity.lastName) {
                    cellValue = `${student.identity.lastName}، ${student.identity.firstName}`;
                } else {
                    cellValue = student.identity.name;
                }
            }
            else if (col.id === 'total_selections') cellValue = student.statusCounters.totalSelections;
            else if (col.id === 'absences') {
                cellValue = classroom.sessions.reduce((acc, sess) => {
                    if (sess.isDeleted || sess.isCancelled) return acc;
                    const rec = sess.studentRecords[student.identity.studentId];
                    return acc + (rec && rec.attendance === 'absent' ? 1 : 0);
                }, 0);
            }
            else if (col.id === 'exit_count') cellValue = student.statusCounters.outOfClassCount || 0;
            else if (col.id === 'missed_chances') cellValue = student.statusCounters.missedChances;
            else if (col.id === 'issues') cellValue = Object.values(student.categoryIssues || {}).reduce((a, b) => a + b, 0);
            else if (col.id === 'avg_score') cellValue = student.getOverallAverageScore() || '-';
            else if (col.id === 'final_score') cellValue = classroom.calculateFinalStudentScore(student) || '-';
            else if (col.type === 'category') {
                cellValue = student.categoryCounts[col.id] || 0;
            }
            else if (col.type === 'category_scores') {
                const skillKey = col.id.toLowerCase();
                const scores = student.logs.scores[skillKey]?.filter(s => !s.isDeleted) || [];
                cellValue = scores.length > 0 ? scores.map(s => s.value).join('، ') : '-';
            }

            // Logic: Names are Right-aligned + Nowrap
            // Scores & Numbers are Center-aligned + Nowrap (for lists)
            let styleCss = 'text-align: center;'; // Default for counts, averages, rows

            if (col.id === 'name') {
                styleCss = 'text-align: right; white-space: nowrap;';
            } else if (col.type === 'category_scores') {
                styleCss = 'text-align: center; white-space: nowrap;';
            }

            const cellStyle = `style="${styleCss}"`;

            tbodyHtml += `<td ${cellStyle}>${cellValue}</td>`;
        });

        tbodyHtml += '</tr>';
    });

    // 5. Prepare Warning Footnote
    let footnoteHtml = '';
    if (needsWarningFootnote) {
        footnoteHtml = `
            <div class="warning-footnote">
                ⚠️ <strong>توجه:</strong> ترتیب الفبایی این لیست ممکن است دقیق نباشد. (نام خانوادگی برخی دانش‌آموزان در سیستم تفکیک نشده است)
            </div>
        `;
    }

    // --- Capture App Stylesheets ---
    // This grabs all <link rel="stylesheet"> tags from your main app to inject into the print window
    const appStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.outerHTML)
        .join('');

    // 6. Create Print Window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification('⚠️ مرورگر شما پنجره جدید را مسدود کرد. لطفاً اجازه دهید.', 'error');
        return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <title>گزارش کلاس ${classroom.info.name}</title>
            ${appStyles} <style>
                @media print {
                    @page { size: A4; margin: 10mm; }
                    /* Updated Font Family */
                    body { font-family: 'Vazirmatn', 'Vazir', Tahoma, sans-serif; color: #000; }
                }
                /* Updated Font Family */
                body { font-family: 'Vazirmatn', 'Vazir', Tahoma, sans-serif; padding: 20px; direction: rtl; }
                h1 { text-align: center; margin-bottom: 5px; font-size: 24px; }
                .meta { text-align: center; margin-bottom: 30px; font-size: 14px; color: #444; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #333; padding: 6px 8px; text-align: center; }
                th { background-color: #eee; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .signature { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 50px; }
                
                .warning-footnote {
                    margin-top: 20px;
                    font-size: 11px;
                    color: #555;
                    font-style: italic;
                    border-top: 1px solid #ccc;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <h1>گزارش وضعیت کلاس ${classroom.info.name}</h1>
            <div class="meta">
                تاریخ گزارش: ${dateStr} | تعداد دانش‌آموزان: ${students.length}
            </div>
            <table>
                <thead>${theadHtml}</thead>
                <tbody>${tbodyHtml}</tbody>
            </table>
            ${footnoteHtml}
            <div class="signature">
                <div>امضای معلم</div>
                <div>مهر و امضای مدرسه</div>
            </div>
            <script>
                window.onload = function() { window.print(); }
            <\/script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
} export function showReportConfigModal(classroom) {
    const container = reportColumnsContainer;
    container.innerHTML = ''; // Clear previous columns


    // 1. Calculate Unstructured Students (Missing lastName)
    const activeStudents = state.getActiveItems(classroom.students);
    const unstructuredCount = activeStudents.filter(s => !s.identity.lastName).length;

    // 2. Define Available Columns
    const standardColumns = [
        { id: 'row_num', label: 'ردیف', checked: true },
        { id: 'name', label: 'نام دانش‌آموز', checked: true },
        { id: 'total_selections', label: 'کل انتخاب‌ها', checked: true },
        { id: 'absences', label: 'تعداد غیبت', checked: true },
        { id: 'exit_count', label: 'تعداد خروج', checked: false },
        { id: 'missed_chances', label: 'فرصت سوخته', checked: false },
        { id: 'issues', label: 'مشکل‌پاسخگویی', checked: false },
        { id: 'avg_score', label: 'میانگین نمرات', checked: true },
        { id: 'final_score', label: 'نمره نهایی (کانون)', checked: true },
    ];

    // Add Dynamic Categories
    classroom.categories.forEach(cat => {
        if (!cat.isDeleted) {
            // 1. The Count Column (Standard)
            standardColumns.push({
                id: cat.name,
                label: `تعداد ${cat.name}`,
                type: 'category',
                checked: false
            });

            // 2. The Scores Column (Only if graded)
            if (cat.isGradedCategory) {
                standardColumns.push({
                    id: cat.name,
                    label: `نمرات ${cat.name}`,
                    type: 'category_scores',
                    checked: false
                });
            }
        }
    });

    // 3. Render Column Checkboxes
    standardColumns.forEach(col => {
        const wrapper = document.createElement('label');
        wrapper.className = 'report-column-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = col.checked;
        checkbox.dataset.colId = col.id;
        checkbox.dataset.colLabel = col.label;
        if (col.type) checkbox.dataset.colType = col.type;

        const text = document.createElement('span');
        text.textContent = col.label;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(text);
        container.appendChild(wrapper);
    });

    // 4. Inject Sorting Options (Dynamic UI Injection) - IMPROVED UI
    const modalContent = container.parentElement;
    const existingSort = modalContent.querySelector('#report-sort-options');
    if (existingSort) existingSort.remove(); // Cleanup previous instance

    const sortContainer = document.createElement('div');
    sortContainer.id = 'report-sort-options';
    // Better container styling matching the app's clean look
    sortContainer.style.marginTop = '20px';
    sortContainer.style.padding = '15px';
    sortContainer.style.backgroundColor = '#f8f9fa';
    sortContainer.style.borderRadius = '5px';
    sortContainer.style.border = '1px solid #e9ecef';

    sortContainer.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: #333;">ترتیب نمایش لیست:</div>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="report-sort" value="alpha" checked style="accent-color: var(--color-primary);">
                <span>بر اساس نام خانوادگی</span>
            </label>

            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="report-sort" value="default" style="accent-color: var(--color-primary);">
                <span>بر اساس زمان ورود به کلاس</span>
            </label>
        </div>

        <div id="sort-warning" style="
            display: none; 
            margin-top: 12px; 
            background-color: #fff3cd; 
            color: #856404; 
            padding: 10px; 
            border-radius: 4px; 
            font-size: 13px; 
            border: 1px solid #ffeeba;
            line-height: 1.5;
        ">
            ⚠️ <strong>توجه:</strong> نام خانوادگی ${unstructuredCount} دانش‌آموز هنوز تفکیک نشده است. مرتب‌سازی این موارد ممکن است کاملاً دقیق نباشد.
        </div>
    `;

    // Insert before the buttons
    const actionsDiv = modalContent.querySelector('.modal-actions');
    modalContent.insertBefore(sortContainer, actionsDiv);

    // Toggle Warning Logic
    const radios = sortContainer.querySelectorAll('input[name="report-sort"]');
    const warningBox = sortContainer.querySelector('#sort-warning');

    const updateWarning = () => {
        const isAlpha = sortContainer.querySelector('input[value="alpha"]').checked;
        warningBox.style.display = (isAlpha && unstructuredCount > 0) ? 'block' : 'none';
    };

    radios.forEach(r => r.addEventListener('change', updateWarning));

    updateWarning();

    // 5. Button Handlers
    reportPrintBtn.onclick = () => {
        const selected = [];
        const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            selected.push({
                id: cb.dataset.colId,
                label: cb.dataset.colLabel,
                type: cb.dataset.colType
            });
        });

        if (selected.length === 0) {
            showNotification('⚠️ لطفاً حداقل یک ستون را انتخاب کنید.');
            return;
        }

        // Capture Sort Preferences
        const sortMode = sortContainer.querySelector('input[name="report-sort"]:checked').value;
        const needsWarningFootnote = (sortMode === 'alpha' && unstructuredCount > 0);

        closeActiveModal();
        // Pass the new arguments to the generator
        generatePrintableReport(classroom, selected, sortMode, needsWarningFootnote);
    };

    reportCancelBtn.onclick = () => {
        closeActiveModal();
    };

    // 6. Open Modal
    openModal('report-config-modal');
}

