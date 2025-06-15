<template>
  <div class="matrix-input">
    <h2>Matriks Biaya/Keuntungan</h2>
    <table class="input-table">
      <thead>
        <tr>
          <th></th>
          <th v-for="job in jobs" :key="job">Tugas {{ job }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(workerRow, workerIndex) in matrix" :key="workerIndex">
          <th>Pekerja {{ getWorkerLabel(workerIndex) }}</th>
          <td v-for="(cost, jobIndex) in workerRow" :key="jobIndex">
            <input
              type="number"
              v-model.number="matrix[workerIndex][jobIndex]"
              @input="emitUpdate"
              min="0"
              step="1"
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { watch } from 'vue';

export default {
  props: {
    workers: Number,
    jobs: Number,
    matrix: Array
  },
  emits: ['update-matrix'],
  setup(props, { emit }) {
    const getWorkerLabel = (workerIndex) => {
      return String.fromCharCode(65 + workerIndex);
    };

    function emitUpdate() {
      emit('update-matrix', props.matrix);
    }
    
    watch(() => props.matrix, emitUpdate);
    
    return {
      emitUpdate,
      getWorkerLabel
    };
  }
};
</script>

<style scoped>
.matrix-input {
  margin: 30px 0;
  overflow-x: auto;
}

.input-table {
  border-collapse: collapse;
  margin: 15px 0;
  width: 100%;
}

.input-table th, .input-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}

.input-table th {
  background-color: #f2f2f2;
  font-weight: normal;
}

.input-table input {
  width: 60px;
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.input-table input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

@media print {
  .matrix-input {
    display: none;
  }
}
</style>