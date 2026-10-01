/**
 * Canadian student loan repayment calculator.
 * Carried over from studentfinancial.ca and restyled for Life Ready.
 */
const LOAN_TYPES = {
    'federal': { name: 'Canada Student Loan (Federal)', rateType: 'fixed', rateBase: 0, accruesGrace: false, isFederal: true },
    'on': { name: 'Ontario (OSAP Provincial)', rateType: 'prime_plus', margin: 1.0, accruesGrace: true },
    'bc': { name: 'British Columbia (StudentAid BC)', rateType: 'fixed', rateBase: 0, accruesGrace: false },
    'ab': { name: 'Alberta (Student Aid Alberta)', rateType: 'prime_plus', margin: 0, accruesGrace: false },
    'sk': { name: 'Saskatchewan (Provincial)', rateType: 'prime_plus', margin: 0, accruesGrace: true },
    'mb': { name: 'Manitoba (Provincial)', rateType: 'fixed', rateBase: 0, accruesGrace: false },
    'qc': { name: 'Quebec (AFE)', rateType: 'prime_plus', margin: 0.5, accruesGrace: true },
    'nb': { name: 'New Brunswick (Provincial)', rateType: 'fixed', rateBase: 0, accruesGrace: false },
    'ns': { name: 'Nova Scotia (Provincial)', rateType: 'fixed', rateBase: 0, accruesGrace: false },
    'pe': { name: 'Prince Edward Island (Provincial)', rateType: 'fixed', rateBase: 0, accruesGrace: false },
    'nl': { name: 'Newfoundland and Labrador (Provincial)', rateType: 'fixed', rateBase: 0, accruesGrace: false },
    'nt': { name: 'Northwest Territories / Nunavut', rateType: 'prime_plus', margin: 0, accruesGrace: false },
    'private': { name: 'Private / Bank Student Loan', rateType: 'custom', accruesGrace: false }
};

const RAP_THRESHOLDS = {
    1: 2083,
    2: 2792,
    3: 3333,
    4: 3875,
    5: 4417
};

let primeRate = 4.45;
let loans = [{ id: 1, type: 'federal', balance: 20000, customRate: 5.0 }];
let loanCounter = 1;
let isRapEnabled = false;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchPrimeRate();
    renderLoans();
    attachGlobalListeners();
    recalculate(true); // set the slider to the minimum payment on first load
});

async function fetchPrimeRate() {
    try {
        const res = await fetch('https://www.bankofcanada.ca/valet/observations/V39079/json?recent=1');
        const data = await res.json();
        const bocRate = parseFloat(data.observations[0].V39079.v);
        primeRate = bocRate + 2.20;
        document.getElementById('boc-prime-badge').textContent = `Prime Rate: ${primeRate.toFixed(2)}% (BoC + 2.20%)`;
    } catch (e) {
        primeRate = 4.45;
        document.getElementById('boc-prime-badge').textContent = `Prime Rate: ${primeRate.toFixed(2)}% (Approximate)`;
    }
}

function getAnnualRate(loan) {
    const config = LOAN_TYPES[loan.type];
    if (config.rateType === 'fixed') return config.rateBase;
    if (config.rateType === 'prime_plus') return primeRate + config.margin;
    if (config.rateType === 'custom') return loan.customRate || 0;
    return 0;
}

function renderLoans() {
    const container = document.getElementById('slc-loans-container');
    container.innerHTML = '';
    
    loans.forEach((loan, idx) => {
        const div = document.createElement('div');
        div.className = 'debt-row loan-entry';
        div.style.position = 'relative';
        
        let typeOptions = Object.keys(LOAN_TYPES).map(k => `<option value="${k}" ${loan.type === k ? 'selected' : ''}>${LOAN_TYPES[k].name}</option>`).join('');
        
        let customRateHtml = loan.type === 'private' ? `
            <div class="field-group" style="margin: 12px 0 0;">
                <label for="slc-rate-${loan.id}">Interest rate (%)</label>
                <input type="number" id="slc-rate-${loan.id}" class="loan-custom-rate" data-id="${loan.id}" value="${loan.customRate}" step="0.1" inputmode="decimal">
            </div>
        ` : '';

        const rateVal = getAnnualRate(loan);
        const config = LOAN_TYPES[loan.type];
        let rateNote = config.rateType === 'custom' ? 'Custom rate' : (config.rateType === 'fixed' ? 'Fixed rate' : `Variable (Prime + ${config.margin.toFixed(2)}%)`);

        div.innerHTML = `
            ${loans.length > 1 ? `<button type="button" class="debt-remove-btn remove-loan-btn" data-id="${loan.id}" aria-label="Remove this loan" style="position: absolute; top: 10px; right: 10px;">&times;</button>` : ''}
            <div class="field-group" style="margin-bottom: 12px; padding-right: 36px;">
                <label for="slc-type-${loan.id}">Loan type or province</label>
                <select id="slc-type-${loan.id}" class="loan-type-select" data-id="${loan.id}">${typeOptions}</select>
                <div style="font-size: 0.8rem; color: var(--muted); margin-top: 4px;">Rate: ${rateVal.toFixed(2)}% (${rateNote})</div>
            </div>
            <div class="field-group" style="margin-bottom: 0;">
                <label for="slc-bal-${loan.id}">Balance ($)</label>
                <input type="number" id="slc-bal-${loan.id}" class="loan-balance-input" data-id="${loan.id}" value="${loan.balance}" min="0" inputmode="decimal">
            </div>
            ${customRateHtml}
        `;
        container.appendChild(div);
    });

    document.querySelectorAll('.loan-type-select').forEach(el => el.addEventListener('change', updateLoanData));
    document.querySelectorAll('.loan-balance-input').forEach(el => el.addEventListener('input', updateLoanData));
    document.querySelectorAll('.loan-custom-rate').forEach(el => el.addEventListener('input', updateLoanData));
    document.querySelectorAll('.remove-loan-btn').forEach(el => el.addEventListener('click', removeLoan));
}

function updateLoanData(e) {
    const id = parseInt(e.target.dataset.id);
    const loan = loans.find(l => l.id === id);
    if (!loan) return;
    
    let changedType = false;
    if (e.target.classList.contains('loan-type-select')) {
        loan.type = e.target.value;
        changedType = true;
    } else if (e.target.classList.contains('loan-balance-input')) {
        loan.balance = parseFloat(e.target.value) || 0;
    } else if (e.target.classList.contains('loan-custom-rate')) {
        loan.customRate = parseFloat(e.target.value) || 0;
    }

    if (changedType) {
        renderLoans();
    }
    recalculate(true); // true = force min payment reset
}

function addLoan() {
    loanCounter++;
    loans.push({ id: loanCounter, type: 'on', balance: 10000, customRate: 5.0 });
    renderLoans();
    recalculate(true);
}

function removeLoan(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    loans = loans.filter(l => l.id !== id);
    renderLoans();
    recalculate(true);
}

function attachGlobalListeners() {
    document.getElementById('slc-add-loan-btn').addEventListener('click', addLoan);
    
    // RAP Toggle
    const rapToggle = document.getElementById('slc-rap-toggle');
    const modal = document.getElementById('slc-rap-modal');
    
    rapToggle.addEventListener('change', (e) => {
        if (rapToggle.checked) {
            modal.style.display = 'flex';
            document.getElementById('slc-rap-confirm').focus();
        } else {
            isRapEnabled = false;
            document.getElementById('slc-rap-inputs').style.display = 'none';
            recalculate(true);
        }
    });

    document.getElementById('slc-rap-cancel').addEventListener('click', () => {
        modal.style.display = 'none';
        rapToggle.checked = false;
    });

    document.getElementById('slc-rap-confirm').addEventListener('click', () => {
        modal.style.display = 'none';
        isRapEnabled = true;
        document.getElementById('slc-rap-inputs').style.display = 'block';
        recalculate(true);
    });

    document.getElementById('slc-rap-income').addEventListener('input', () => recalculate(true));
    document.getElementById('slc-rap-family').addEventListener('change', () => recalculate(true));

    document.getElementById('slc-payment-slider').addEventListener('input', (e) => {
        document.getElementById('slc-slider-value-display').textContent = '$' + parseInt(e.target.value).toLocaleString();
        recalculate(false);
    });
}

function calcStandardMinimum(balance, annualRate, months) {
    if (balance <= 0) return 0;
    const r = annualRate / 100 / 12;
    if (r === 0) return balance / months;
    return (balance * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function recalculate(resetSlider = false) {
    // 1. Calculate Minimums and Balances after Grace
    let initialTotalBal = 0;
    let minPaymentSum = 0;
    let federalStandardPmt = 0;
    let federalId = null;

    const workingLoans = loans.map(l => {
        const rate = getAnnualRate(l);
        const config = LOAN_TYPES[l.type];
        let graceBal = l.balance;
        initialTotalBal += graceBal;
        let graceInterest = 0;

        if (config.accruesGrace) {
            for(let i=0; i<6; i++) {
                let mInt = graceBal * (rate / 100 / 12);
                graceInterest += mInt;
                graceBal += mInt; // capitalizes
            }
        }
        
        const standardPmt = calcStandardMinimum(graceBal, rate, 114); // 9.5 years
        
        let wl = { ...l, rate, config, graceBal, standardPmt, remaining: graceBal, isFederal: !!config.isFederal };
        if (wl.isFederal) {
            federalStandardPmt += standardPmt;
            federalId = wl.id;
        }

        minPaymentSum += standardPmt;
        return wl;
    });

    // RAP Adjustments
    let federalAffordablePmt = federalStandardPmt;
    if (isRapEnabled) {
        const income = parseFloat(document.getElementById('slc-rap-income').value) || 0;
        const familySize = parseInt(document.getElementById('slc-rap-family').value) || 1;
        const fKey = Math.min(familySize, 5);
        const thresh = RAP_THRESHOLDS[fKey];
        
        const monthlyIncome = income / 12;
        if (monthlyIncome <= thresh) {
            federalAffordablePmt = 0;
        } else {
            federalAffordablePmt = Math.min(monthlyIncome * 0.10, federalStandardPmt);
        }
        document.getElementById('slc-rap-payment-display').textContent = '$' + federalAffordablePmt.toFixed(2);
        
        // Adjust total minimum
        minPaymentSum = minPaymentSum - federalStandardPmt + federalAffordablePmt;
    }

    const slider = document.getElementById('slc-payment-slider');
    
    if (resetSlider) {
        let maxSlider = Math.round((minPaymentSum * 3) / 100) * 100;
        if (maxSlider < 2000) maxSlider = 2000;
        slider.max = maxSlider;
        slider.min = 0;
        slider.value = Math.ceil(minPaymentSum);
        document.getElementById('slc-slider-value-display').textContent = '$' + parseInt(slider.value).toLocaleString();
        document.getElementById('slc-min-label').textContent = '$' + Math.ceil(minPaymentSum).toLocaleString();
    }

    let actualPayment = parseFloat(slider.value);
    // If they drag below minimum, we process it as partial payment (loan default risk!)
    
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let tableRows = [];
    let currentMonth = 1;
    let allCleared = false;
    let maxIter = 600; // 50 years max bounds check

    // Add 6 months grace to table
    const graceRows = [];
    let currTotalBal = initialTotalBal;
    for(let i=1; i<=6; i++) {
        let mInt = 0;
        workingLoans.forEach(wl => {
            if (wl.config.accruesGrace) {
                mInt += wl.balance * (wl.rate / 100 / 12);
                wl.balance += wl.balance * (wl.rate / 100 / 12); // compound during grace
            }
        });
        currTotalBal += mInt;
        
        graceRows.push(`
            <tr class="row-grace">
                <td>Month ${i} (grace)</td>
                <td>$0.00</td>
                <td>$${mInt.toFixed(2)}</td>
                <td>$0.00</td>
                <td><strong>$${currTotalBal.toFixed(2)}</strong></td>
            </tr>
        `);
    }

    // Now start the actual amortization from month 7
    currentMonth = 7;
    // reset remaining tracker to post-grace
    workingLoans.forEach(wl => wl.remaining = wl.graceBal);

    while(!allCleared && currentMonth <= maxIter) {
        let monthInterest = 0;
        let monthPrincipal = 0;
        let runningBal = 0;
        let totalRemaining = workingLoans.reduce((sum, wl) => sum + wl.remaining, 0);
        
        if (totalRemaining <= 0) {
            allCleared = true;
            break;
        }

        let paymentAvailable = actualPayment;
        if (totalRemaining < paymentAvailable) {
            paymentAvailable = totalRemaining; // last payment
        }

        // We allocate payment proportionally based on balance
        let allocPayments = {};
        workingLoans.forEach(wl => {
            if (wl.remaining <= 0) {
                allocPayments[wl.id] = 0;
                return;
            }
            allocPayments[wl.id] = paymentAvailable * (wl.remaining / totalRemaining);
        });

        // Apply allocations
        workingLoans.forEach(wl => {
            if (wl.remaining <= 0) return;
            
            let pmt = allocPayments[wl.id];
            
            // Federal RAP logic
            let govInterestPaid = 0;
            let govPrincipalPaid = 0;
            const repaymentMonth = currentMonth - 6;

            let interest = wl.remaining * (wl.rate / 100 / 12);
            
            if (wl.isFederal && isRapEnabled) {
                // RAP logic limits required payment to affordable payment.
                pmt = federalAffordablePmt;
                if (pmt > wl.remaining + interest) pmt = wl.remaining + interest;

                if (repaymentMonth <= 60) {
                    // Stage 1: Gov pays remaining interest
                    if (pmt < interest) govInterestPaid = interest - pmt;
                } else {
                    // Stage 2: Gov pays remainder of principal AND interest to finish loan 
                    // Simplifying: user pays affordable pmt, gov covers interest and principal drop
                    govInterestPaid = interest; 
                    // Calculate what standard principal should drop by to clear in 120 months (15 total yrs)
                    const assumedStandardDrop = wl.graceBal / 114; 
                    if (pmt < interest + assumedStandardDrop) {
                        govPrincipalPaid = assumedStandardDrop;
                        pmt = 0; // User payment just goes into the void or covers portion
                    }
                }
            }

            if (pmt >= interest) {
                let p = pmt - interest;
                if (p > wl.remaining) p = wl.remaining;
                wl.remaining -= p;
                monthPrincipal += p;
                monthInterest += interest;
                totalInterestPaid += interest;
                totalPrincipalPaid += p;
            } else {
                // Payment didn't cover interest (negative amortization if no RAP)
                let unpaidInterest = interest - pmt;
                if (!govInterestPaid) {
                    wl.remaining += unpaidInterest; // capitalizes
                }
                monthInterest += interest; // Total charged
                totalInterestPaid += interest; // Accumulate cost
                // If govPaid, it doesn't add to balance
            }

            if (govPrincipalPaid > 0) {
                wl.remaining -= govPrincipalPaid;
            }
            
            runningBal += Math.max(0, wl.remaining);
        });

        if (tableRows.length < 250) {
            let rowClass = '';
            let note = '';
            if (isRapEnabled && (currentMonth - 6 <= 60)) {
                rowClass = 'row-rap1';
                note = ' <span style="color:var(--primary-dark); font-size:0.7rem;">(RAP stage 1)</span>';
            } else if (isRapEnabled && (currentMonth - 6 > 60)) {
                rowClass = 'row-rap2';
                note = ' <span style="color:var(--secondary-soft); font-size:0.7rem;">(RAP stage 2)</span>';
            }

            tableRows.push(`
                <tr class="${rowClass}">
                    <td>Month ${currentMonth}${note}</td>
                    <td>$${paymentAvailable.toFixed(2)}</td>
                    <td>$${monthInterest.toFixed(2)}</td>
                    <td>$${monthPrincipal.toFixed(2)}</td>
                    <td><strong>$${runningBal.toFixed(2)}</strong></td>
                </tr>
            `);
        }

        currentMonth++;
        if (currentMonth > maxIter) break; // infinite loop protection
    }

    // Outputs
    document.getElementById('slc-out-balance').textContent = '$' + initialTotalBal.toLocaleString(undefined, {maximumFractionDigits:0});
    document.getElementById('slc-out-interest').textContent = '$' + totalInterestPaid.toLocaleString(undefined, {maximumFractionDigits:0});
    
    let totalPaidInEnd = totalPrincipalPaid + totalInterestPaid;
    if (totalPaidInEnd === 0) totalPaidInEnd = 1; // avoid /0
    
    const prinPct = (totalPrincipalPaid / totalPaidInEnd * 100).toFixed(1);
    const intPct = (totalInterestPaid / totalPaidInEnd * 100).toFixed(1);

    document.getElementById('slc-bar-prin').style.width = prinPct + '%';
    document.getElementById('slc-bar-int').style.width = intPct + '%';
    document.getElementById('slc-bar-prin-lbl').textContent = prinPct + '%';
    document.getElementById('slc-bar-int-lbl').textContent = intPct + '%';

    let totalMonths = currentMonth - 1;
    if (totalMonths >= maxIter) {
        document.getElementById('slc-out-time').textContent = 'Never';
        document.getElementById('slc-out-saved').textContent = 'N/A';
        document.getElementById('slc-callout').hidden = false;
        document.getElementById('slc-callout').className = 'result-callout danger';
        document.getElementById('slc-callout').innerHTML = `<strong>Heads up:</strong> this payment is too low to cover the interest, so the balance would keep growing. Increase your monthly payment.`;
    } else {
        let yrs = Math.floor(totalMonths / 12);
        let mos = totalMonths % 12;
        document.getElementById('slc-out-time').textContent = `${yrs} yrs ${mos} mos`;
        
        // Calculate min payment cost for comparison
        let baselineCost = 0;
        workingLoans.forEach(wl => { baselineCost += wl.standardPmt * 114; });
        let baselineInt = baselineCost - initialTotalBal;
        if (baselineInt < 0) baselineInt = 0; // standard 0% loans
        
        let saved = baselineInt - totalInterestPaid;
        document.getElementById('slc-out-saved').textContent = '$' + Math.max(0, saved).toLocaleString(undefined, {maximumFractionDigits:0});

        if (saved > 100 && actualPayment > minPaymentSum * 1.05) {
            document.getElementById('slc-callout').hidden = false;
            document.getElementById('slc-callout').className = 'result-callout';
            document.getElementById('slc-callout').innerHTML = `<strong>Great move!</strong> By paying an extra $${Math.max(0, actualPayment - minPaymentSum).toLocaleString()} per month, you're saving over <strong>$${saved.toLocaleString(undefined, {maximumFractionDigits:0})}</strong> in interest and shaving off your debt timeline.`;
        } else {
            document.getElementById('slc-callout').hidden = true;
        }
    }

    document.getElementById('slc-table-body').innerHTML = graceRows.join('') + tableRows.join('');
}
