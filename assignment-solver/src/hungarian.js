export function solveHungarian(originalMatrix, isMaximization = false) {
    let matrix = originalMatrix.map(row => [...row]);
    let steps = [];
    
    const addedSteps = (description, matrixState, lines = [], assignment = [], isFinal = false) => {
        steps.push({
            description, 
            matrix: matrixState.map(row => [...row]),
            lines: lines.map(line => ({
                type: line.type,
                index: line.index,
                label: line.type === 'row' 
                    ? `Baris ${line.index + 1} (Pekerja ${String.fromCharCode(65 + line.index)})`
                    : `Kolom ${line.index + 1} (Tugas ${line.index + 1})`
            })),
            assignment: [...assignment],
            isFinal,
            originalMatrix: isFinal ? originalMatrix.map(row => [...row]) : null
        });
    };
    
    // Step 0: Original matrix
    addedSteps("Matriks awal", matrix);
    
    // Convert to minimization problem if it's maximization
    if (isMaximization) {
        const maxValue = Math.max(...matrix.flat());
        matrix = matrix.map(row => row.map(val => maxValue - val));
        addedSteps(`Konversi masalah maksimisasi ke minimisasi (mengurangi setiap elemen dari ${maxValue})`, matrix);
    }
    
    // Step 1: Subtract row minima (untuk setiap pekerja)
    for (let worker = 0; worker < matrix.length; worker++) {
        const min = Math.min(...matrix[worker]);
        if (min !== 0) {
            matrix[worker] = matrix[worker].map(val => val - min);
            addedSteps(`Kurangi baris pekerja ${String.fromCharCode(65 + worker)} dengan nilai minimum ${min}`, matrix);
        }
    }
    
    // Step 2: Subtract column minima (untuk setiap tugas)
    for (let job = 0; job < matrix[0].length; job++) {
        const column = matrix.map(row => row[job]);
        const min = Math.min(...column);
        if (min !== 0) {
            for (let worker = 0; worker < matrix.length; worker++) {
                matrix[worker][job] -= min;
            }
            addedSteps(`Kurangi kolom tugas ${job + 1} dengan nilai minimum ${min}`, matrix);
        }
    }
    
    // Step 3: Cover all zeros with minimum number of lines
    let lines = coverZeros(matrix);
    addedSteps(`Tutup semua nol dengan ${lines.length} garis`, matrix, lines);
    
    // Step 4: Create additional zeros if needed
    while (lines.length < matrix.length) {
        const minUncovered = findMinUncovered(matrix, lines);
        
        // Subtract from uncovered rows (pekerja)
        for (let worker = 0; worker < matrix.length; worker++) {
            if (!lines.some(line => line.type === 'row' && line.index === worker)) {
                for (let job = 0; job < matrix[0].length; job++) {
                    matrix[worker][job] -= minUncovered;
                }
            }
        }
        
        // Add to covered columns (tugas)
        for (let job = 0; job < matrix[0].length; job++) {
            if (lines.some(line => line.type === 'col' && line.index === job)) {
                for (let worker = 0; worker < matrix.length; worker++) {
                    matrix[worker][job] += minUncovered;
                }
            }
        }
        
        addedSteps(`Buat nol tambahan (kurangi ${minUncovered} dari baris tidak tertutup)`, matrix, lines);
        
        lines = coverZeros(matrix);
        addedSteps(`Tutup semua nol dengan ${lines.length} garis`, matrix, lines);
        
        // Find temporary assignment
        const tempAssignment = findOptimalAssignment(matrix);
        addedSteps(`Alokasi sementara ditemukan (${tempAssignment.length} pasangan)`, matrix, lines, tempAssignment);
    }
    
    // Step 5: Find optimal assignment
    const assignment = findOptimalAssignment(matrix).map(assign => ({
        worker: assign.row,
        job: assign.col,
        cost: originalMatrix[assign.row][assign.col]
    }));
    
    // Tambahkan langkah final dengan matriks asli dan assignment yang benar
    steps.push({
        description: "Penugasan optimal ditemukan",
        matrix: originalMatrix.map(row => [...row]),
        lines: [],
        assignment: [...assignment],
        isFinal: true,
        originalMatrix: originalMatrix.map(row => [...row])
    });
    
    return { steps, assignment, originalMatrix };
}

function coverZeros(matrix) {
    const lines = [];
    const coveredRows = new Set();
    const coveredCols = new Set();
    const tempMatrix = matrix.map(row => [...row]);
    
    while (true) {
        let maxRowIndex = -1;
        let maxRowCount = -1;
        
        // Cari baris (pekerja) dengan nol terbanyak
        for (let worker = 0; worker < tempMatrix.length; worker++) {
            if (!coveredRows.has(worker)) {
                const zeroCount = tempMatrix[worker].filter((val, job) => val === 0 && !coveredCols.has(job)).length;
                if (zeroCount > maxRowCount) {
                    maxRowCount = zeroCount;
                    maxRowIndex = worker;
                }
            }
        }
        
        let maxColIndex = -1;
        let maxColCount = -1;
        
        // Cari kolom (tugas) dengan nol terbanyak
        for (let job = 0; job < tempMatrix[0].length; job++) {
            if (!coveredCols.has(job)) {
                let zeroCount = 0;
                for (let worker = 0; worker < tempMatrix.length; worker++) {
                    if (tempMatrix[worker][job] === 0 && !coveredRows.has(worker)) zeroCount++;
                }
                if (zeroCount > maxColCount) {
                    maxColCount = zeroCount;
                    maxColIndex = job;
                }
            }
        }
        
        // Berhenti jika tidak ada nol yang tersisa
        if (maxRowCount <= 0 && maxColCount <= 0) break;
        
        // Prioritaskan menutup baris/kolom dengan nol terbanyak
        if (maxRowCount >= maxColCount) {
            lines.push({ 
                type: 'row', 
                index: maxRowIndex,
                label: `Baris ${maxRowIndex + 1} (Pekerja ${String.fromCharCode(65 + maxRowIndex)})`
            });
            coveredRows.add(maxRowIndex);
            // Tandai nol di baris ini
            for (let job = 0; job < tempMatrix[0].length; job++) {
                if (tempMatrix[maxRowIndex][job] === 0) {
                    tempMatrix[maxRowIndex][job] = -1;
                }
            }
        } else {
            lines.push({ 
                type: 'col', 
                index: maxColIndex,
                label: `Kolom ${maxColIndex + 1} (Tugas ${maxColIndex + 1})`
            });
            coveredCols.add(maxColIndex);
            // Tandai nol di kolom ini
            for (let worker = 0; worker < tempMatrix.length; worker++) {
                if (tempMatrix[worker][maxColIndex] === 0) {
                    tempMatrix[worker][maxColIndex] = -1;
                }
            }
        }
    }
    
    return lines;
}

function findMinUncovered(matrix, lines) {
    const coveredRows = new Set(lines.filter(line => line.type === 'row').map(line => line.index));
    const coveredCols = new Set(lines.filter(line => line.type === 'col').map(line => line.index));
    
    let min = Infinity;
    
    // Cari nilai terkecil yang tidak tertutup garis
    for (let worker = 0; worker < matrix.length; worker++) {
        if (!coveredRows.has(worker)) {
            for (let job = 0; job < matrix[0].length; job++) {
                if (!coveredCols.has(job)) {
                    if (matrix[worker][job] < min) {
                        min = matrix[worker][job];
                    }
                }
            }
        }
    }
    
    return min;
}

function findOptimalAssignment(matrix) {
    const assignment = [];
    const assignedJobs = new Set();
    
    function backtrack(worker) {
        if (worker >= matrix.length) return true;
        
        for (let job = 0; job < matrix[0].length; job++) {
            if (matrix[worker][job] === 0 && !assignedJobs.has(job)) {
                assignedJobs.add(job);
                assignment.push({ row: worker, col: job });
                
                if (backtrack(worker + 1)) return true;
                
                assignedJobs.delete(job);
                assignment.pop();
            }
        }
        
        return false;
    }
    
    backtrack(0);
    return assignment;
}