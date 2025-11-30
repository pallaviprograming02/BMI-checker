
    const nameInput = document.getElementById("patientName");
    const weightInput = document.getElementById("weight");
    const heightInput = document.getElementById("height");

    const nameErr = document.getElementById("nameErr");
    const weightErr = document.getElementById("weightErr");
    const heightErr = document.getElementById("heightErr");

    const resultBox = document.getElementById("resultBox");
    const bmiValueEl = document.getElementById("bmiValue");
    const bmiCatEl = document.getElementById("bmiCategory");
    const bmiAdviceEl = document.getElementById("bmiAdvice");

    const shareBtn = document.getElementById("shareBtn");
    const copyBtn = document.getElementById("copyBtn");
    const exportBtn = document.getElementById("exportBtn");
    const shareStatus = document.getElementById("shareStatus");

    function sanitizeNumberInput(raw) {
      if (typeof raw !== "string") return "";
      let s = raw.trim().replace(",", ".");
      s = s.replace(/[^0-9.]/g, "");
      const parts = s.split(".");
      if (parts.length > 2) {
        s = parts[0] + "." + parts.slice(1).join("");
      }
      return s;
    }

    function validateInputs() {
      weightInput.value = sanitizeNumberInput(weightInput.value);
      heightInput.value = sanitizeNumberInput(heightInput.value);

      const name = nameInput.value.trim();
      const weight = parseFloat(weightInput.value);
      const height = parseFloat(heightInput.value);

      nameErr.textContent = "";
      weightErr.textContent = "";
      heightErr.textContent = "";
      nameInput.classList.remove("error");
      weightInput.classList.remove("error");
      heightInput.classList.remove("error");

      let ok = true;

      if (!name) {
        nameErr.textContent = "Enter patient name.";
        nameInput.classList.add("error");
        ok = false;
      }

      if (!weight || Number.isNaN(weight) || weight <= 0 || weight > 500) {
        weightErr.textContent = "Enter valid weight (1–500 kg).";
        weightInput.classList.add("error");
        ok = false;
      }

      if (!height || Number.isNaN(height) || height <= 0 || height > 250) {
        heightErr.textContent = "Enter valid height (50–250 cm).";
        heightInput.classList.add("error");
        ok = false;
      }

      return ok ? { name, weight, heightCm: height } : null;
    }

    function getCategory(bmi) {
      if (bmi < 18.5) {
        return {
          label: "Underweight",
          className: "cat-under",
          advice:
            "BMI below healthy range. Consider discussing nutrition and weight gain with a professional."
        };
      } else if (bmi < 25) {
        return {
          label: "Normal weight",
          className: "cat-normal",
          advice:
            "BMI is in the healthy range. Continue balanced diet and regular physical activity."
        };
      } else if (bmi < 30) {
        return {
          label: "Overweight",
          className: "cat-over",
          advice:
            "BMI above healthy range. Adjusting diet and increasing activity may help."
        };
      } else {
        return {
          label: "Obese",
          className: "cat-obese",
          advice:
            "BMI in obese range. Consider a structured weight management plan with a healthcare professional."
        };
      }
    }

    function updateBMI() {
      const values = validateInputs();

      if (!values) {
        resultBox.classList.remove("show");
        bmiValueEl.textContent = "--";
        bmiCatEl.innerHTML = "";
        bmiAdviceEl.textContent =
          "Enter patient name, weight and height above to see BMI.";
        shareBtn.disabled = true;
        copyBtn.disabled = true;
        exportBtn.disabled = true;
        shareStatus.textContent = "";
        return;
      }

      const { weight, heightCm } = values;
      const heightM = heightCm / 100;
      const bmi = weight / (heightM * heightM);
      const bmiRounded = Number(bmi.toFixed(1));

      bmiValueEl.textContent = bmiRounded.toFixed(1);

      const cat = getCategory(bmiRounded);
      bmiCatEl.innerHTML = `
        <span class="category-pill ${cat.className}">
          <span class="badge-chip"></span>
          ${cat.label}
        </span>
      `;
      bmiAdviceEl.textContent = cat.advice;

      resultBox.classList.add("show");
      shareBtn.disabled = false;
      copyBtn.disabled = false;
      exportBtn.disabled = false;
      shareStatus.textContent = "";
    }

    async function shareResult() {
      const values = validateInputs();
      if (!values) {
        shareStatus.textContent = "Fix input errors before sharing.";
        return;
      }

      const { name, weight, heightCm } = values;
      const bmiText = bmiValueEl.textContent;
      const catText = bmiCatEl.textContent.trim();

      const summary =
        `Patient: ${name}\n` +
        `Weight: ${weight.toFixed(1)} kg\n` +
        `Height: ${heightCm.toFixed(1)} cm\n` +
        `BMI: ${bmiText}\n` +
        `Category: ${catText}\n` +
        `Note: BMI is a general indicator and does not replace full clinical assessment.`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: "Patient BMI Result",
            text: summary
          });
          shareStatus.textContent = "Shared via system share (if app selected).";
        } else {
          shareStatus.textContent = "System share not supported; use copy instead.";
        }
      } catch (err) {
        shareStatus.textContent = "Share cancelled or failed.";
      }
    }

    async function copyNameAndBMI() {
      const values = validateInputs();
      if (!values) {
        shareStatus.textContent = "Fix input errors before copying.";
        return;
      }
      const { name } = values;
      const bmiText = bmiValueEl.textContent;

      const text = `Patient: ${name} | BMI: ${bmiText}`;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          shareStatus.textContent = "Name & BMI copied to clipboard.";
        } else {
          shareStatus.textContent = "Clipboard API not supported in this browser.";
        }
      } catch (err) {
        shareStatus.textContent = "Copy to clipboard failed.";
      }
    }

    function exportCSV() {
      const values = validateInputs();
      if (!values) {
        shareStatus.textContent = "Fix input errors before exporting.";
        return;
      }

      const { name, weight, heightCm } = values;
      const bmiText = bmiValueEl.textContent;
      const catText = bmiCatEl.textContent.trim();

      const rows = [
        ["Patient Name", "Weight (kg)", "Height (cm)", "BMI", "Category"],
        [name, weight.toFixed(1), heightCm.toFixed(1), bmiText, catText]
      ];

      const csv = rows
        .map(row =>
          row
            .map(field => {
              const f = String(field).replace(/"/g, '""');
              return `"${f}"`;
            })
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "patient_bmi.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      shareStatus.textContent = "CSV file downloaded.";
    }

    ["input", "change", "blur"].forEach(eventName => {
      nameInput.addEventListener(eventName, updateBMI);
      weightInput.addEventListener(eventName, updateBMI);
      heightInput.addEventListener(eventName, updateBMI);
    });

    shareBtn.addEventListener("click", shareResult);
    copyBtn.addEventListener("click", copyNameAndBMI);
    exportBtn.addEventListener("click", exportCSV);

    nameInput.value = "John Doe";
    weightInput.value = "70";
    heightInput.value = "170";
    updateBMI();
  
