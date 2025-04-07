
let chartInstance = null;

function renderTable(labels, values) {
  let cumulative = 0;
  let html = '<table border="1" cellpadding="5"><tr><th>x</th><th>Probability</th><th>Cumulative</th></tr>';
  for (let i = 0; i < labels.length; i++) {
    cumulative += values[i];
    html += `<tr><td>${labels[i]}</td><td>${values[i].toFixed(5)}</td><td>${cumulative.toFixed(5)}</td></tr>`;
  }
  html += '</table>';
  document.getElementById('dataTableContainer').innerHTML = html;
}

function drawChart(labels, values, label) {
  const ctx = document.getElementById('distributionChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  renderTable(labels, values);
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: values,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function exportCSV() {
  let csv = "x,Probability\n";
  chartInstance.data.labels.forEach((label, idx) => {
    csv += `${label},${chartInstance.data.datasets[0].data[idx]}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "distribution_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function updateTestForm() {
  const type = document.getElementById("testType").value;
  let html = "";
  if (type === "z") {
    html = `
      <h3>Z-Test</h3>
      Sample Mean: <input id="z_mean"><br>
      Population Mean (H₀): <input id="z_mu0"><br>
      Std Dev: <input id="z_sigma"><br>
      Sample Size: <input id="z_n"><br>
      Alpha (significance level): <input id="z_alpha" value="0.05"><br>
      <button onclick="runZTest()">Run Z-Test</button>
    `;
  } else if (type === "t") {
    html = `
      <h3>T-Test</h3>
      Sample Mean: <input id="t_mean"><br>
      Population Mean (H₀): <input id="t_mu0"><br>
      Std Dev: <input id="t_s"><br>
      Sample Size: <input id="t_n"><br>
      Alpha (significance level): <input id="t_alpha" value="0.05"><br>
      <button onclick="runTTest()">Run T-Test</button>
    `;
  } else if (type === "chi2") {
    html = `
      <h3>Chi-Square Test</h3>
      Observed (comma separated): <input id="chi_obs"><br>
      Expected (comma separated): <input id="chi_exp"><br>
      Alpha (significance level): <input id="chi_alpha" value="0.05"><br>
      <button onclick="runChi2Test()">Run Chi-Square Test</button>
    `;
  }
  document.getElementById("testFormContainer").innerHTML = html;
  document.getElementById("testResult").innerHTML = "";
}

function runZTest() {
  const x̄ = parseFloat(document.getElementById("z_mean").value);
  const μ0 = parseFloat(document.getElementById("z_mu0").value);
  const σ = parseFloat(document.getElementById("z_sigma").value);
  const n = parseFloat(document.getElementById("z_n").value);
  const α = parseFloat(document.getElementById("z_alpha").value);
  const z = (x̄ - μ0) / (σ / Math.sqrt(n));
  const p = 2 * (1 - normalCDF(Math.abs(z)));
  const result = p < α ? "Reject H₀" : "Fail to Reject H₀";
  document.getElementById("testResult").innerHTML = `
    <p>Z = ${z.toFixed(4)}, p = ${p.toFixed(4)} → <strong>${result}</strong></p>
  `;
}

function runTTest() {
  const x̄ = parseFloat(document.getElementById("t_mean").value);
  const μ0 = parseFloat(document.getElementById("t_mu0").value);
  const s = parseFloat(document.getElementById("t_s").value);
  const n = parseFloat(document.getElementById("t_n").value);
  const α = parseFloat(document.getElementById("t_alpha").value);
  const t = (x̄ - μ0) / (s / Math.sqrt(n));
  const df = n - 1;
  const p = 2 * (1 - tCDF(Math.abs(t), df));
  const result = p < α ? "Reject H₀" : "Fail to Reject H₀";
  document.getElementById("testResult").innerHTML = `
    <p>t = ${t.toFixed(4)}, df = ${df}, p = ${p.toFixed(4)} → <strong>${result}</strong></p>
  `;
}

function runChi2Test() {
  const obs = document.getElementById("chi_obs").value.split(',').map(Number);
  const exp = document.getElementById("chi_exp").value.split(',').map(Number);
  const α = parseFloat(document.getElementById("chi_alpha").value);
  let chi2 = 0;
  for (let i = 0; i < obs.length; i++) {
    chi2 += Math.pow(obs[i] - exp[i], 2) / exp[i];
  }
  const df = obs.length - 1;
  const p = 1 - chi2CDF(chi2, df);
  const result = p < α ? "Reject H₀" : "Fail to Reject H₀";
  document.getElementById("testResult").innerHTML = `
    <p>χ² = ${chi2.toFixed(4)}, df = ${df}, p = ${p.toFixed(4)} → <strong>${result}</strong></p>
  `;
}

// CDF helpers
function normalCDF(z) {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 =  0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  return sign * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
}

// Approximate Student t-distribution CDF (simplified)
function tCDF(t, df) {
  // Using incomplete beta approximation
  const x = df / (df + t * t);
  return 1 - 0.5 * Math.pow(x, df / 2); // Approximation
}

// Chi-square CDF (simplified lower tail approx)
function chi2CDF(x, k) {
  let m = x / 2.0, sum = Math.exp(-m), term = sum;
  for (let i = 1; i < k / 2; i++) {
    term *= m / i;
    sum += term;
  }
  return sum;
}
