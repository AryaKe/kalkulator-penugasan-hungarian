<template>
  <div class="steps-display printable-section">
    <h2>Langkah-langkah Algoritma Hungarian</h2>
    
    <div class="steps-container">
      <div v-for="(step, index) in steps" :key="index" class="step">
        <h3>Langkah {{ index + 1 }}: {{ step.description }}</h3>
        
        <div class="matrix-container">
          <table class="matrix-table">
            <thead>
              <tr>
                <th></th>
                <th v-for="job in step.matrix[0].length" :key="job">Tugas {{ job }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(workerRow, workerIndex) in step.matrix" :key="workerIndex">
                <th>Pekerja {{ getWorkerLabel(workerIndex) }}</th>
                <td 
                  v-for="(cost, jobIndex) in workerRow" 
                  :key="jobIndex"
                  :class="{
                    'covered-row': !step.isFinal && isCoveredRow(step.lines, workerIndex),
                    'covered-col': !step.isFinal && isCoveredCol(step.lines, jobIndex),
                    'assigned': isAssigned(step.assignment, workerIndex, jobIndex)
                  }"
                >
                  {{ step.isFinal ? step.originalMatrix[workerIndex][jobIndex] : cost }}
                  <span v-if="isAssigned(step.assignment, workerIndex, jobIndex)" class="assignment-marker">✓</span>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="step.lines.length > 0 && !step.isFinal" class="lines-info">
            <h4>Garis Penutup:</h4>
            <ul>
              <li v-for="(line, i) in step.lines" :key="i">
                {{ line.type === 'row' ? 'Baris' : 'Kolom' }} {{ line.index + 1 }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    steps: Array
  },
  methods: {
    getWorkerLabel(workerIndex) {
      return String.fromCharCode(65 + workerIndex);
    },
    isCoveredRow(lines, workerIndex) {
      return lines.some(line => line.type === 'row' && line.index === workerIndex);
    },
    isCoveredCol(lines, jobIndex) {
      return lines.some(line => line.type === 'col' && line.index === jobIndex);
    },
    isAssigned(assignment, workerIndex, jobIndex) {
      return assignment.some(a => a.worker === workerIndex && a.job === jobIndex);
    }
  }
};
</script>

<style scoped>
.steps-display {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #eee;
}

.steps-container {
  max-height: 600px;
  overflow-y: auto;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.step {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #ddd;
  page-break-inside: avoid;
}

.step:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

h3 {
  color: #2c3e50;
  margin-top: 0;
  font-size: 1.2em;
}

h4 {
  margin-top: 0;
  color: #34495e;
}

.matrix-container {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.matrix-table {
  border-collapse: collapse;
  min-width: 300px;
}

.matrix-table th, .matrix-table td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: center;
}

.matrix-table th {
  background-color: #f2f2f2;
  font-weight: normal;
}

.covered-row {
  background-color: rgba(255, 165, 0, 0.15);
}

.covered-col {
  background-color: rgba(0, 191, 255, 0.15);
}

.assigned {
  background-color: rgba(50, 205, 50, 0.25);
  font-weight: bold;
  position: relative;
}

.assignment-marker {
  position: absolute;
  top: 2px;
  right: 2px;
  color: #27ae60;
  font-weight: bold;
  font-size: 0.8em;
}

.lines-info {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  min-width: 150px;
}

.lines-info ul {
  padding-left: 20px;
  margin: 8px 0 0 0;
}

@media (max-width: 768px) {
  .matrix-container {
    flex-direction: column;
  }
}

@media print {
  .steps-display {
    padding: 0;
    margin: 0;
    border: none;
  }
  
  .steps-container {
    max-height: none;
    overflow: visible;
    box-shadow: none;
    border: none;
    background: white;
    color: black;
    padding: 5px;
  }
  
  .step {
    margin-bottom: 15px;
    padding-bottom: 10px;
  }
}
</style>