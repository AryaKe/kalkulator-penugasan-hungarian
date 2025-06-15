<template>
  <div class="container">
    <header>
      <h1>Penyelesaian Masalah Penugasan</h1>
      <p class="subtitle">Menggunakan Algoritma Hungarian</p>
    </header>
    
    <div class="controls">
      <div class="control-group">
        <label for="problem-type">Jenis Masalah:</label>
        <select id="problem-type" v-model="problemType">
          <option value="min">Minimisasi (Biaya)</option>
          <option value="max">Maksimisasi (Keuntungan)</option>
        </select>
      </div>
      
      <div class="control-group">
        <label for="workers">Jumlah Pekerja:</label>
        <input type="number" id="workers" v-model.number="workers" min="1" max="10">
      </div>
      
      <div class="control-group">
        <label for="jobs">Jumlah Tugas:</label>
        <input type="number" id="jobs" v-model.number="jobs" min="1" max="10">
      </div>
      
      <button @click="updateMatrixSize" class="btn secondary">
        Update Ukuran Matriks
      </button>
    </div>
    
    <MatrixInput 
      :workers="workers" 
      :jobs="jobs" 
      :matrix="matrix" 
      @update-matrix="updateMatrix"
    />
    
    <button @click="solveProblem" :disabled="solving" class="btn primary">
      {{ solving ? 'Memproses...' : 'Selesaikan' }}
    </button>
    
    <div v-if="result" class="results">
      <h2>Hasil Penugasan Optimal</h2>
      
      <button @click="exportAllStepsToPDF" class="btn export-btn">
        Download Seluruh Langkah (PDF)
      </button>
      
      <div class="optimal-solution">
        <h3>Solusi Optimal:</h3>
        <table class="solution-table">
          <thead>
            <tr>
              <th>Pekerja</th>
              <th>Tugas</th>
              <th>{{ problemType === 'min' ? 'Biaya' : 'Keuntungan' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(assign, index) in sortedAssignment" :key="index">
              <td>{{ getWorkerLabel(assign.worker) }}</td>
              <td>{{ getJobLabel(assign.job) }}</td>
              <td>{{ getOriginalValue(assign.worker, assign.job) }}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2">Total</td>
              <td>{{ calculateTotal() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <StepsDisplay :steps="result.steps" />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import MatrixInput from './components/MatrixInput.vue';
import StepsDisplay from './components/StepsDisplay.vue';
import { solveHungarian } from './hungarian';
import { jsPDF } from 'jspdf';

export default {
  components: { MatrixInput, StepsDisplay },
  setup() {
    const problemType = ref('min');
    const workers = ref(4);
    const jobs = ref(4);
    const matrix = ref(createEmptyMatrix(workers.value, jobs.value));
    const originalMatrix = ref(createEmptyMatrix(workers.value, jobs.value));
    const result = ref(null);
    const solving = ref(false);
    
    function createEmptyMatrix(workers, jobs) {
      return Array.from({ length: workers }, () => 
        Array.from({ length: jobs }, () => 0)
      );
    }
    
    function updateMatrixSize() {
      const newMatrix = createEmptyMatrix(workers.value, jobs.value);
      
      for (let w = 0; w < Math.min(matrix.value.length, workers.value); w++) {
        for (let j = 0; j < Math.min(matrix.value[0].length, jobs.value); j++) {
          newMatrix[w][j] = matrix.value[w][j];
        }
      }
      
      matrix.value = newMatrix;
      originalMatrix.value = JSON.parse(JSON.stringify(newMatrix));
      result.value = null;
    }
    
    function updateMatrix(newMatrix) {
      matrix.value = newMatrix;
      originalMatrix.value = JSON.parse(JSON.stringify(newMatrix));
      result.value = null;
    }
    
    function solveProblem() {
      solving.value = true;
      result.value = null;
      
      setTimeout(() => {
        try {
          result.value = solveHungarian(originalMatrix.value, problemType.value === 'max');
        } catch (error) {
          alert(`Terjadi error: ${error.message}`);
        } finally {
          solving.value = false;
        }
      }, 100);
    }
    
    function calculateTotal() {
      if (!result.value) return 0;
      return result.value.assignment.reduce((total, assign) => {
        return total + getOriginalValue(assign.worker, assign.job);
      }, 0);
    }
    
    function getOriginalValue(worker, job) {
      return originalMatrix.value[worker][job];
    }
    
    const sortedAssignment = computed(() => {
      if (!result.value) return [];
      return [...result.value.assignment].sort((a, b) => a.worker - b.worker);
    });

    const getWorkerLabel = (workerIndex) => {
      return String.fromCharCode(65 + workerIndex);
    };

    const getJobLabel = (jobIndex) => {
      return jobIndex + 1;
    };

    const exportAllStepsToPDF = async () => {
      if (!result.value) return;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
      let positionY = margin;
      
      // Add title
      pdf.setFontSize(18);
      pdf.text('Laporan Lengkap Algoritma Hungarian', 105, positionY, { align: 'center' });
      positionY += 10;
      
      pdf.setFontSize(12);
      pdf.text(`Jenis Masalah: ${problemType.value === 'min' ? 'Minimisasi Biaya' : 'Maksimisasi Keuntungan'}`, 105, positionY, { align: 'center' });
      positionY += 10;
      pdf.text(`Ukuran Matriks: ${workers.value} Pekerja × ${jobs.value} Tugas`, 105, positionY, { align: 'center' });
      positionY += 20;
      
      // Add original matrix
      pdf.setFontSize(14);
      pdf.text('Matriks Awal:', margin, positionY);
      positionY += 10;
      
      positionY = await addMatrixToPDF(pdf, originalMatrix.value, margin, positionY, pageWidth, [], []);
      positionY += 15;
      
      // Add all steps
      pdf.setFontSize(16);
      pdf.text('Langkah-langkah Penyelesaian:', margin, positionY);
      positionY += 15;
      
      for (const step of result.value.steps) {
        if (positionY > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          positionY = margin;
        }
        
        pdf.setFontSize(12);
        pdf.text(`Langkah ${result.value.steps.indexOf(step) + 1}: ${step.description}`, margin, positionY);
        positionY += 10;
        
        const matrixToShow = step.isFinal ? step.originalMatrix : step.matrix;
        positionY = await addMatrixToPDF(
          pdf, 
          matrixToShow, 
          margin, 
          positionY, 
          pageWidth, 
          step.lines, 
          step.assignment
        );
        positionY += 10;
        
        // Add lines info
        if (step.lines.length > 0) {
          pdf.setFontSize(11);
          pdf.text('Garis Penutup:', margin, positionY);
          positionY += 7;
          
          step.lines.forEach((line, idx) => {
            const label = line.type === 'row' 
              ? `Baris ${line.index + 1} (Pekerja ${getWorkerLabel(line.index)})`
              : `Kolom ${line.index + 1} (Tugas ${line.index + 1})`;
            pdf.text(`- ${label}`, margin + 5, positionY);
            positionY += 7;
          });
          positionY += 5;
        }
        
        // Add assignment if available
        if (step.assignment.length > 0) {
          pdf.setFontSize(11);
          pdf.text('Alokasi:', margin, positionY);
          positionY += 7;
          
          step.assignment.forEach(assign => {
            const worker = getWorkerLabel(assign.worker);
            const job = getJobLabel(assign.job);
            const cost = step.originalMatrix ? step.originalMatrix[assign.worker][assign.job] : '-';
            pdf.text(`- Pekerja ${worker} → Tugas ${job} (Biaya: ${cost})`, margin + 5, positionY);
            positionY += 7;
          });
          positionY += 5;
        }
        
        positionY += 10;
      }
      
      // Add final summary
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.text('Hasil Penugasan Optimal', 105, margin, { align: 'center' });
      positionY = margin + 20;
      
      pdf.setFontSize(14);
      pdf.text('Alokasi Final:', margin, positionY);
      positionY += 15;
      
      result.value.assignment.forEach(assign => {
        const worker = getWorkerLabel(assign.worker);
        const job = getJobLabel(assign.job);
        const cost = getOriginalValue(assign.worker, assign.job);
        
        pdf.setFontSize(12);
        pdf.text(`• Pekerja ${worker} ditugaskan ke Tugas ${job}`, margin, positionY);
        pdf.text(`Biaya: ${cost}`, margin + 70, positionY);
        positionY += 10;
      });
      
      pdf.setFontSize(14);
      pdf.text(`Total Biaya: ${calculateTotal()}`, margin, positionY + 15);
      
      pdf.save(`laporan_penugasan_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const addMatrixToPDF = async (pdf, matrix, x, y, width, lines, assignment) => {
      const cellWidth = width / (matrix[0].length + 1);
      const cellHeight = 8;
      
      // Draw headers (jobs)
      pdf.setFontSize(10);
      pdf.text('P\\T', x, y + cellHeight/2);
      for (let j = 0; j < matrix[0].length; j++) {
        pdf.text(`${j+1}`, x + (j+1)*cellWidth + cellWidth/2, y + cellHeight/2, { align: 'center' });
      }
      
      // Draw matrix with styles
      for (let i = 0; i < matrix.length; i++) {
        // Worker label
        pdf.text(getWorkerLabel(i), x, y + (i+1)*cellHeight + cellHeight/2);
        
        // Values with styling
        for (let j = 0; j < matrix[i].length; j++) {
          const isCoveredRow = lines.some(line => line.type === 'row' && line.index === i);
          const isCoveredCol = lines.some(line => line.type === 'col' && line.index === j);
          const isAssigned = assignment.some(a => a.worker === i && a.job === j);
          
          // Save current graphics state
          pdf.saveGraphicsState();
          
          // Apply cell styling
          if (isCoveredRow && isCoveredCol) {
            pdf.setFillColor(200, 220, 255); // Light purple for both
          } else if (isCoveredRow) {
            pdf.setFillColor(255, 230, 200); // Light orange for row
          } else if (isCoveredCol) {
            pdf.setFillColor(200, 240, 255); // Light blue for column
          }
          
          if (isAssigned) {
            pdf.setFillColor(200, 255, 200); // Light green for assignment
          }
          
          // Draw cell background
          if (isCoveredRow || isCoveredCol || isAssigned) {
            pdf.rect(
              x + (j+1)*cellWidth, 
              y + (i+1)*cellHeight, 
              cellWidth, 
              cellHeight, 
              'F'
            );
          }
          
          // Restore graphics state
          pdf.restoreGraphicsState();
          
          // Draw cell value
          pdf.setTextColor(0, 0, 0);
          pdf.text(
            matrix[i][j].toString(), 
            x + (j+1)*cellWidth + cellWidth/2, 
            y + (i+1)*cellHeight + cellHeight/2, 
            { align: 'center' }
          );
          
          // Draw assignment marker
          if (isAssigned) {
            pdf.setFontSize(8);
            pdf.setTextColor(0, 128, 0);
            pdf.text(
              '✓', 
              x + (j+1)*cellWidth + cellWidth - 2, 
              y + (i+1)*cellHeight + 2
            );
            pdf.setFontSize(10);
          }
        }
      }
      
      // Draw borders
      pdf.setDrawColor(100);
      for (let i = 0; i <= matrix.length; i++) {
        pdf.line(x, y + i*cellHeight, x + width, y + i*cellHeight);
      }
      for (let j = 0; j <= matrix[0].length + 1; j++) {
        pdf.line(x + j*cellWidth, y, x + j*cellWidth, y + (matrix.length + 1)*cellHeight);
      }
      
      return y + (matrix.length + 1)*cellHeight + 5;
    };

    return {
      problemType,
      workers,
      jobs,
      matrix,
      result,
      solving,
      sortedAssignment,
      updateMatrixSize,
      updateMatrix,
      solveProblem,
      calculateTotal,
      getWorkerLabel,
      getJobLabel,
      getOriginalValue,
      exportAllStepsToPDF
    };
  }
};
</script>

<style>
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --text-color: #2c3e50;
  --light-gray: #ecf0f1;
  --border-color: #ddd;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: #f9f9f9;
  padding: 20px;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  color: var(--text-color);
  font-size: 2.2em;
  margin-bottom: 5px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1em;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 25px;
  align-items: flex-end;
}

.control-group {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

label {
  margin-bottom: 5px;
  font-weight: 500;
  font-size: 0.9em;
  color: #34495e;
}

input, select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn.primary {
  background-color: var(--primary-color);
  color: white;
}

.btn.primary:hover {
  background-color: #2980b9;
}

.btn.secondary {
  background-color: var(--light-gray);
  color: var(--text-color);
}

.btn.secondary:hover {
  background-color: #d5dbdb;
}

.btn.export-btn {
  background-color: #17a2b8;
  color: white;
  margin: 20px 0;
  padding: 12px 20px;
  font-size: 15px;
}

.btn.export-btn:hover {
  background-color: #138496;
}

.results {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid var(--light-gray);
}

.optimal-solution {
  margin: 25px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.optimal-solution h3 {
  margin-top: 0;
  color: #2c3e50;
  margin-bottom: 15px;
}

.solution-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.solution-table th, .solution-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.solution-table th {
  background-color: #3498db;
  color: white;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.9em;
  letter-spacing: 0.5px;
}

.solution-table tr:last-child td {
  border-bottom: none;
}

.solution-table tr:nth-child(even) {
  background-color: #f8f9fa;
}

.solution-table tr:hover {
  background-color: #f1f1f1;
}

.total-row {
  font-weight: bold;
  background-color: #f1f1f1;
  border-top: 2px solid #ddd;
}

.total-row td {
  padding-top: 15px;
  padding-bottom: 15px;
  font-size: 1.1em;
}

@media (max-width: 768px) {
  .container {
    padding: 15px;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-group {
    width: 100%;
  }
  
  .solution-table {
    font-size: 0.9em;
  }
  
  .solution-table th, 
  .solution-table td {
    padding: 8px 10px;
  }
}

@media print {
  body * {
    visibility: hidden;
  }
  
  .optimal-solution, .steps-display,
  .optimal-solution *, .steps-display * {
    visibility: visible;
  }
  
  .optimal-solution, .steps-display {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    box-shadow: none;
    background: white;
    color: black;
  }
  
  .btn {
    display: none;
  }
}
</style>