// Calculator Logic
const qtyInputs = document.querySelectorAll('.qty-input');
const expectedInput = document.getElementById('expectedTotal');
const btnDone = document.getElementById('btnDone');
const summaryOverlay = document.getElementById('summaryOverlay');
const btnClose = document.getElementById('btnClose');

// Denominations data
const denominations = [
    { value: 100, label: 'RM 100', qtyId: 'qty-100', totalId: 'total-100' },
    { value: 50, label: 'RM 50', qtyId: 'qty-50', totalId: 'total-50' },
    { value: 20, label: 'RM 20', qtyId: 'qty-20', totalId: 'total-20' },
    { value: 10, label: 'RM 10', qtyId: 'qty-10', totalId: 'total-10' },
    { value: 5, label: 'RM 5', qtyId: 'qty-5', totalId: 'total-5' },
    { value: 1, label: 'RM 1', qtyId: 'qty-1', totalId: 'total-1' },
    { value: 0.50, label: '50 sen', qtyId: 'qty-050', totalId: 'total-050' },
    { value: 0.20, label: '20 sen', qtyId: 'qty-020', totalId: 'total-020' },
    { value: 0.10, label: '10 sen', qtyId: 'qty-010', totalId: 'total-010' },
    { value: 0.05, label: '5 sen', qtyId: 'qty-005', totalId: 'total-005' }
];

// Prevent negative values on number inputs
function preventNegative(input) {
    input.addEventListener('input', function() {
        if (this.value.startsWith('-')) {
            this.value = Math.abs(parseFloat(this.value)) || 0;
        }
        if (this.value && parseFloat(this.value) < 0) {
            this.value = 0;
        }
    });
}

// Apply negative prevention to all quantity inputs and expected total
qtyInputs.forEach(preventNegative);
preventNegative(expectedInput);

// Calculate and update totals in real-time
function updateTotals() {
    denominations.forEach(denom => {
        const input = document.getElementById(denom.qtyId);
        const totalField = document.getElementById(denom.totalId);
        const qty = parseInt(input.value) || 0;
        // Use Math.round to avoid floating point issues
        const total = Math.round(qty * denom.value * 100) / 100;
        totalField.value = `RM ${total.toFixed(2)}`;
        if (qty > 0) {
            totalField.classList.add('highlight');
        } else {
            totalField.classList.remove('highlight');
        }
    });
}

qtyInputs.forEach(input => {
    input.addEventListener('input', updateTotals);
    input.addEventListener('keydown', function(e) {
        // Allow: backspace, delete, tab, escape, enter, arrows
        if ([46, 8, 9, 27, 13, 37, 38, 39, 40].indexOf(e.keyCode) !== -1) {
            return;
        }
        // Ensure it's a number (prevent typing minus sign)
        if (e.key === '-' || (e.keyCode < 48 || e.keyCode > 57)) {
            e.preventDefault();
        }
    });
});

// Calculate totals
function calculateAll() {
    let paperTotal = 0;
    let coinsTotal = 0;
    const paperDenoms = denominations.slice(0, 6);
    const coinsDenoms = denominations.slice(6);

    const paperDetails = paperDenoms.map(denom => {
        const input = document.getElementById(denom.qtyId);
        const qty = parseInt(input.value) || 0;
        const total = Math.round(qty * denom.value * 100) / 100;
        paperTotal += total;
        return { label: denom.label, qty, total };
    });

    const coinsDetails = coinsDenoms.map(denom => {
        const input = document.getElementById(denom.qtyId);
        const qty = parseInt(input.value) || 0;
        const total = Math.round(qty * denom.value * 100) / 100;
        coinsTotal += total;
        return { label: denom.label, qty, total };
    });

    // Round grand total to avoid floating point issues
    const grandTotal = Math.round((paperTotal + coinsTotal) * 100) / 100;
    const expected = parseFloat(expectedInput.value) || 0;
    const difference = Math.round((grandTotal - expected) * 100) / 100;

    return { paperTotal, coinsTotal, grandTotal, expected, difference, paperDetails, coinsDetails };
}

// Format RM
function formatRM(amount) {
    const sign = amount < 0 ? '-' : '';
    return `${sign}RM ${Math.abs(amount).toFixed(2)}`;
}

// Read manual deductions (note + amount)
function getDeductions() {
    const deductions = [];
    for (let i = 1; i <= 3; i++) {
        const note = document.getElementById(`note-${i}`).value.trim();
        const amount = Math.round((parseFloat(document.getElementById(`amount-${i}`).value) || 0) * 100) / 100;
        if (amount > 0) {
            deductions.push({ note: note || `Deduction ${i}`, amount });
        }
    }
    return deductions;
}

// Prevent negative values on deduction amount inputs
document.querySelectorAll('.amount-input').forEach(input => {
    preventNegative(input);
    input.addEventListener('input', updateTotals);
});

// Show summary
function showSummary() {
    const data = calculateAll();

    // Paper breakdown
    const paperHtml = data.paperDetails
        .filter(d => d.qty > 0)
        .map(d => `<div class="summary-row"><span class="label">${d.label} x ${d.qty}</span><span class="value">${formatRM(d.total)}</span></div>`)
        .join('');
    document.getElementById('paperSummary').innerHTML = paperHtml || '<div class="summary-row"><span class="label" style="opacity:0.5">No paper money counted</span></div>';

    // Coins breakdown
    const coinsItems = data.coinsDetails.filter(d => d.qty > 0);
    let coinsHtml = '';
    if (coinsItems.length > 0) {
        coinsHtml = coinsItems
            .map(d => `<div class="summary-row"><span class="label">${d.label} x ${d.qty}</span><span class="value">${formatRM(d.total)}</span></div>`)
            .join('');
        coinsHtml += `<div class="summary-row" style="border-top:1px solid rgba(217,119,6,0.2);padding-top:8px;margin-top:4px;font-weight:bold"><span class="label">TOTAL CENTS</span><span class="value">${formatRM(data.coinsTotal)}</span></div>`;
    } else {
        coinsHtml = '<div class="summary-row"><span class="label" style="opacity:0.5">No coins counted</span></div>';
    }
    document.getElementById('coinsSummary').innerHTML = coinsHtml;

    // Manual deductions
    const deductions = getDeductions();
    const totalDeductions = Math.round(deductions.reduce((sum, d) => sum + d.amount, 0) * 100) / 100;
    const deductionsHtml = deductions.length > 0
        ? deductions.map(d => `<div class="summary-row"><span class="label">${d.note} : ${formatRM(d.amount)}</span><span class="value">- ${formatRM(d.amount)}</span></div>`).join('')
        : '<div class="summary-row"><span class="label" style="opacity:0.5">No manual deductions</span></div>';
    document.getElementById('deductionsSummary').innerHTML = deductionsHtml;
    document.getElementById('summaryDeductions').textContent = `- ${formatRM(totalDeductions)}`;
    document.getElementById('summaryDeductionsTotal').textContent = `- ${formatRM(totalDeductions)}`;

    // New expected = system expected minus total deductions
    const newExpected = Math.round((data.expected - totalDeductions) * 100) / 100;
    document.getElementById('summaryNewExpected').textContent = formatRM(newExpected);

    // Totals
    document.getElementById('totalCounted').textContent = formatRM(data.grandTotal);
    document.getElementById('summaryExpected').textContent = formatRM(data.expected);
    document.getElementById('summaryCounted').textContent = formatRM(data.grandTotal);

    // Over/Short uses new expected
    const diff = Math.round((data.grandTotal - newExpected) * 100) / 100;
    const resultDiv = document.getElementById('overUnderResult');
    if (Math.abs(diff) < 0.005) {
        resultDiv.className = 'summary-over-under exact';
        resultDiv.innerHTML = 'EXACT &mdash; Balanced! <span style="font-size:16px;display:block;margin-top:5px;">RM 0.00</span>';
    } else if (diff > 0) {
        resultDiv.className = 'summary-over-under over';
        resultDiv.innerHTML = `OVER <span style="font-size:16px;display:block;margin-top:5px;">(+${formatRM(diff).replace('-', '')})</span>`;
    } else {
        resultDiv.className = 'summary-over-under short';
        resultDiv.innerHTML = `SHORT <span style="font-size:16px;display:block;margin-top:5px;">(${formatRM(diff)})</span>`;
    }

    summaryOverlay.classList.add('active');
}

btnDone.addEventListener('click', showSummary);

btnClose.addEventListener('click', function() {
    summaryOverlay.classList.remove('active');
});

// Close on overlay click (outside modal)
summaryOverlay.addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('active');
    }
});

// Keyboard shortcut: Enter to calculate or move to next field
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !summaryOverlay.classList.contains('active')) {
        const active = document.activeElement;
        if (active && active.classList.contains('qty-input')) {
            e.preventDefault();
            // Find next input
            const inputs = Array.from(document.querySelectorAll('.qty-input'));
            const idx = inputs.indexOf(active);
            if (idx < inputs.length - 1) {
                inputs[idx + 1].focus();
            } else {
                showSummary();
            }
        }
    }
    // Escape to close summary
    if (e.key === 'Escape' && summaryOverlay.classList.contains('active')) {
        summaryOverlay.classList.remove('active');
    }
});

// Initialize
updateTotals();

