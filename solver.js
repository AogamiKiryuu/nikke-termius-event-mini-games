class NikkeSolver {
    constructor() {
        this.grid = [];
        this.originalGrid = [];
        this.rows = 14;
        this.cols = 8;
        this.solutions = [];
        this.currentStep = 0;
        this.gridStates = []; // Store grid state at each step
        
        this.init();
    }
    
    init() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Grid controls
        document.getElementById('createGrid').addEventListener('click', () => this.createInputGrid());
        document.getElementById('solveBtn').addEventListener('click', () => this.solvePuzzle());
        
        // Navigation
        document.getElementById('prevStep').addEventListener('click', () => this.goToStep(this.currentStep - 1));
        document.getElementById('nextStep').addEventListener('click', () => this.goToStep(this.currentStep + 1));
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.goToStep(this.currentStep - 1);
            if (e.key === 'ArrowRight') this.goToStep(this.currentStep + 1);
        });
        
        // Mobile Numpad
        this.setupNumpad();
        
        // OCR Upload
        this.setupOCR();
        
        // Initialize grid
        this.createInputGrid();
    }
    
    setupNumpad() {
        const numpad = document.getElementById('mobileNumpad');
        if (!numpad) return;
        
        numpad.querySelectorAll('.numpad-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const num = btn.dataset.num;
                const focusedCell = document.querySelector('.input-cell:focus');
                
                if (num === 'clear') {
                    // Delete/backspace
                    if (focusedCell) {
                        const row = parseInt(focusedCell.dataset.row);
                        const col = parseInt(focusedCell.dataset.col);
                        focusedCell.value = '';
                        this.grid[row][col] = 1;
                        focusedCell.classList.remove('has-value');
                    }
                } else if (num === 'next') {
                    // Move to next cell
                    if (focusedCell) {
                        const row = parseInt(focusedCell.dataset.row);
                        const col = parseInt(focusedCell.dataset.col);
                        this.moveToNextCell(row, col);
                    }
                } else {
                    // Number input
                    if (focusedCell) {
                        const row = parseInt(focusedCell.dataset.row);
                        const col = parseInt(focusedCell.dataset.col);
                        const val = parseInt(num);
                        if (val >= 1 && val <= 9) {
                            focusedCell.value = num;
                            this.grid[row][col] = val;
                            focusedCell.classList.add('has-value');
                            this.moveToNextCell(row, col);
                        }
                    } else {
                        // No cell focused, focus first cell
                        this.focusCell(0, 0);
                    }
                }
            });
        });
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }
    
    createInputGrid() {
        this.rows = parseInt(document.getElementById('rows').value) || 14;
        this.cols = parseInt(document.getElementById('cols').value) || 8;
        this.rows = Math.max(4, Math.min(20, this.rows));
        this.cols = Math.max(4, Math.min(14, this.cols));
        
        // Initialize grid with random numbers (no empty cells)
        this.grid = [];
        for (let i = 0; i < this.rows; i++) {
            const row = [];
            for (let j = 0; j < this.cols; j++) {
                row.push(Math.floor(Math.random() * 9) + 1); // 1-9 only
            }
            this.grid.push(row);
        }
        
        this.renderInputGrid();
    }
    
    renderInputGrid() {
        const container = document.getElementById('inputGrid');
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.cols}, 38px)`;
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('input');
                cell.type = 'text';
                cell.inputMode = 'numeric';
                cell.pattern = '[1-9]';
                cell.maxLength = 1;
                cell.className = 'input-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const value = this.grid[i][j];
                cell.value = value || '';
                if (value) cell.classList.add('has-value');
                
                // Handle input
                cell.addEventListener('input', (e) => {
                    let val = e.target.value.replace(/[^1-9]/g, '');
                    if (val.length > 1) val = val.charAt(val.length - 1);
                    e.target.value = val;
                    
                    this.grid[i][j] = parseInt(val) || 1;
                    e.target.classList.toggle('has-value', val !== '');
                    
                    // Auto move to next cell
                    if (val) {
                        this.moveToNextCell(i, j);
                    }
                });
                
                // Handle keyboard navigation
                cell.addEventListener('keydown', (e) => {
                    switch(e.key) {
                        case 'ArrowUp':
                            e.preventDefault();
                            this.focusCell(i - 1, j);
                            break;
                        case 'ArrowDown':
                            e.preventDefault();
                            this.focusCell(i + 1, j);
                            break;
                        case 'ArrowLeft':
                            if (cell.selectionStart === 0) {
                                e.preventDefault();
                                this.focusCell(i, j - 1);
                            }
                            break;
                        case 'ArrowRight':
                            if (cell.selectionStart === cell.value.length) {
                                e.preventDefault();
                                this.focusCell(i, j + 1);
                            }
                            break;
                        case 'Backspace':
                            if (cell.value === '') {
                                e.preventDefault();
                                this.focusCell(i, j - 1);
                            }
                            break;
                        case 'Enter':
                            e.preventDefault();
                            this.moveToNextCell(i, j);
                            break;
                    }
                });
                
                // Select all on focus
                cell.addEventListener('focus', () => {
                    cell.select();
                });
                
                container.appendChild(cell);
            }
        }
    }
    
    moveToNextCell(row, col) {
        let nextCol = col + 1;
        let nextRow = row;
        
        if (nextCol >= this.cols) {
            nextCol = 0;
            nextRow++;
        }
        
        if (nextRow < this.rows) {
            this.focusCell(nextRow, nextCol);
        }
    }
    
    focusCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            const cell = document.querySelector(`.input-cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.focus();
                cell.select();
            }
        }
    }
    
    cycleCell(row, col) {
        // Cycle through 1-9, no 0/empty
        let current = this.grid[row][col] || 0;
        current = (current % 9) + 1; // 1 -> 2 -> ... -> 9 -> 1
        this.grid[row][col] = current;
        this.renderInputGrid();
    }
    
    // ============ OCR FUNCTIONALITY ============
    setupOCR() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const processBtn = document.getElementById('processOCR');
        const parseBtn = document.getElementById('parseText');
        
        // Parse text button
        parseBtn.addEventListener('click', () => this.parseTextInput());
        
        // Click to upload
        uploadArea.addEventListener('click', () => imageInput.click());
        
        // File selected
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageUpload(e.target.files[0]);
            }
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleImageUpload(e.dataTransfer.files[0]);
            }
        });
        
        // Process OCR button
        processBtn.addEventListener('click', () => this.processOCR());
    }
    
    parseTextInput() {
        const text = document.getElementById('gridText').value.trim();
        const status = document.getElementById('ocrStatus');
        
        if (!text) {
            status.className = 'ocr-status error';
            status.innerHTML = '❌ Masukkan angka terlebih dahulu';
            return;
        }
        
        // Extract all digits
        const digits = text.replace(/[^1-9]/g, '');
        
        if (digits.length === 0) {
            status.className = 'ocr-status error';
            status.innerHTML = '❌ Tidak ada angka 1-9 yang ditemukan';
            return;
        }
        
        // Try to parse as lines first
        const lines = text.split('\n').filter(line => line.trim());
        let grid = [];
        
        // Check if input is line-by-line
        if (lines.length > 1) {
            for (const line of lines) {
                const lineDigits = line.replace(/[^1-9]/g, '');
                if (lineDigits.length > 0) {
                    grid.push(lineDigits.split('').map(d => parseInt(d)));
                }
            }
            
            // Normalize column count
            if (grid.length > 0) {
                const maxCols = Math.max(...grid.map(r => r.length));
                grid = grid.map(row => {
                    while (row.length < maxCols) row.push(1);
                    return row.slice(0, maxCols);
                });
            }
        }
        
        // If no valid grid from lines, use row/col settings
        if (grid.length === 0) {
            const ocrRows = parseInt(document.getElementById('ocrRows').value) || 14;
            const ocrCols = parseInt(document.getElementById('ocrCols').value) || 8;
            
            if (digits.length < ocrRows * ocrCols) {
                status.className = 'ocr-status error';
                status.innerHTML = `❌ Butuh ${ocrRows * ocrCols} angka, hanya ada ${digits.length}`;
                return;
            }
            
            for (let i = 0; i < ocrRows; i++) {
                const row = [];
                for (let j = 0; j < ocrCols; j++) {
                    const idx = i * ocrCols + j;
                    row.push(parseInt(digits[idx]) || 1);
                }
                grid.push(row);
            }
        }
        
        if (grid.length > 0 && grid[0].length > 0) {
            this.grid = grid;
            this.rows = grid.length;
            this.cols = grid[0].length;
            
            document.getElementById('rows').value = this.rows;
            document.getElementById('cols').value = this.cols;
            
            this.switchTab('manual');
            this.renderInputGrid();
            
            status.className = 'ocr-status success';
            status.innerHTML = `✅ Grid ${this.rows}x${this.cols} berhasil di-parse!`;
        }
    }
    
    handleImageUpload(file) {
        const reader = new FileReader();
        const preview = document.getElementById('previewImage');
        const placeholder = document.getElementById('uploadPlaceholder');
        const processBtn = document.getElementById('processOCR');
        
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.hidden = false;
            placeholder.hidden = true;
            processBtn.disabled = false;
            this.uploadedImage = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    async processOCR() {
        const status = document.getElementById('ocrStatus');
        const processBtn = document.getElementById('processOCR');
        
        status.className = 'ocr-status loading';
        status.innerHTML = '⏳ Memproses gambar... (memuat Tesseract)';
        processBtn.disabled = true;
        
        try {
            // Load Tesseract dynamically
            if (!window.Tesseract) {
                await this.loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
            }
            
            status.innerHTML = '⏳ Mengenali teks dari gambar...';
            
            const result = await Tesseract.recognize(
                this.uploadedImage,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            status.innerHTML = `⏳ OCR: ${Math.round(m.progress * 100)}%`;
                        }
                    }
                }
            );
            
            // Extract digits
            const text = result.data.text;
            const digits = text.replace(/[^1-9]/g, '');
            
            status.innerHTML = `⏳ Ditemukan ${digits.length} angka, memproses...`;
            
            const ocrRows = parseInt(document.getElementById('ocrRows').value) || 14;
            const ocrCols = parseInt(document.getElementById('ocrCols').value) || 8;
            const needed = ocrRows * ocrCols;
            
            if (digits.length < needed) {
                // Put detected text in textarea for manual editing
                document.getElementById('gridText').value = text;
                throw new Error(`Hanya ${digits.length} angka terdeteksi, butuh ${needed}. Silakan edit manual di textarea.`);
            }
            
            // Create grid
            const grid = [];
            for (let i = 0; i < ocrRows; i++) {
                const row = [];
                for (let j = 0; j < ocrCols; j++) {
                    const idx = i * ocrCols + j;
                    row.push(parseInt(digits[idx]) || 1);
                }
                grid.push(row);
            }
            
            this.grid = grid;
            this.rows = ocrRows;
            this.cols = ocrCols;
            
            document.getElementById('rows').value = this.rows;
            document.getElementById('cols').value = this.cols;
            
            this.switchTab('manual');
            this.renderInputGrid();
            
            status.className = 'ocr-status success';
            status.innerHTML = `✅ Grid ${this.rows}x${this.cols} terdeteksi! Periksa dan edit jika perlu.`;
            
        } catch (error) {
            status.className = 'ocr-status error';
            status.innerHTML = `❌ ${error.message}`;
        }
        
        processBtn.disabled = false;
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // ============ SOLVER ============
    solvePuzzle() {
        // Copy grid for solving
        this.originalGrid = this.grid.map(row => [...row]);
        this.solutions = [];
        this.gridStates = [];
        this.currentStep = 0;
        
        // Store initial state
        this.gridStates.push({
            grid: this.originalGrid.map(row => [...row]),
            solution: null,
            totalCleared: 0
        });
        
        // Find all solutions sequentially
        let workingGrid = this.originalGrid.map(row => [...row]);
        let totalCleared = 0;
        
        while (true) {
            const solution = this.findBestSolution(workingGrid);
            if (!solution) break;
            
            this.solutions.push(solution);
            totalCleared += solution.cells.length;
            
            // Apply solution to working grid
            for (const cell of solution.cells) {
                workingGrid[cell.row][cell.col] = 0;
            }
            
            // Store state after this solution
            this.gridStates.push({
                grid: workingGrid.map(row => [...row]),
                solution: solution,
                totalCleared: totalCleared
            });
        }
        
        this.renderSolutionSummary();
        this.renderStepTabs();
        this.goToStep(0);
    }
    
    findBestSolution(grid) {
        const solutions = [];
        const rows = grid.length;
        const cols = grid[0].length;
        
        // Find all valid rectangular combinations (like mobile drag selection)
        // This includes: single cells, horizontal lines, vertical lines, and rectangles
        
        for (let startRow = 0; startRow < rows; startRow++) {
            for (let startCol = 0; startCol < cols; startCol++) {
                // Try all possible rectangle sizes from this starting point
                for (let endRow = startRow; endRow < rows; endRow++) {
                    for (let endCol = startCol; endCol < cols; endCol++) {
                        const cells = [];
                        let sum = 0;
                        let valid = true;
                        
                        // Collect all cells in this rectangle
                        for (let r = startRow; r <= endRow && valid; r++) {
                            for (let c = startCol; c <= endCol && valid; c++) {
                                if (grid[r][c] > 0) {
                                    cells.push({ row: r, col: c, value: grid[r][c] });
                                    sum += grid[r][c];
                                } else {
                                    // Empty cell in selection - still valid, just skip it
                                }
                            }
                        }
                        
                        // Check if sum equals 10 and has at least 1 cell
                        if (sum === 10 && cells.length > 0) {
                            solutions.push(cells);
                        }
                    }
                }
            }
        }
        
        // Remove duplicates
        const unique = this.removeDuplicateSolutions(solutions);
        
        // Sort by length (prefer fewer cells = more efficient)
        unique.sort((a, b) => a.length - b.length);
        
        if (unique.length === 0) return null;
        
        // Return best solution with metadata
        const best = unique[0];
        return {
            cells: best,
            type: this.getSolutionType(best),
            sum: best.reduce((acc, c) => acc + c.value, 0)
        };
    }
    
    removeDuplicateSolutions(solutions) {
        const unique = new Map();
        for (const sol of solutions) {
            const key = sol.map(c => `${c.row},${c.col}`).sort().join('|');
            if (!unique.has(key)) {
                unique.set(key, sol);
            }
        }
        return Array.from(unique.values());
    }
    
    getSolutionType(cells) {
        if (cells.length === 1) return 'single';
        
        const rows = new Set(cells.map(c => c.row));
        const cols = new Set(cells.map(c => c.col));
        
        if (rows.size === 1) return 'horizontal';
        if (cols.size === 1) return 'vertical';
        
        // It's a rectangle (multiple rows and columns)
        return 'rectangle';
    }
    
    getSolutionTypeLabel(cells) {
        const type = this.getSolutionType(cells);
        const labels = {
            'single': 'Single',
            'horizontal': 'Horizontal',
            'vertical': 'Vertical',
            'diagonal': 'Diagonal',
            'rectangle': 'Rectangle',
            'l-shape': 'L-Shape'
        };
        if (labels[type]) return labels[type];
        return `${cells.length} Cells`;
    }
    
    // ============ RENDERING ============
    renderSolutionSummary() {
        const summary = document.getElementById('solutionSummary');
        const totalBlocks = this.originalGrid.flat().filter(v => v > 0).length;
        const clearedBlocks = this.solutions.reduce((acc, s) => acc + s.cells.length, 0);
        const remaining = totalBlocks - clearedBlocks;
        
        summary.innerHTML = `
            <div class="found">✅ Found ${this.solutions.length} moves, clearing ${clearedBlocks} blocks!</div>
            <div class="remaining">Remaining blocks: ${remaining}</div>
        `;
        summary.classList.add('show');
    }
    
    renderStepTabs() {
        const container = document.getElementById('stepTabs');
        container.innerHTML = '';
        
        // Initial tab
        const initialTab = document.createElement('button');
        initialTab.className = 'step-tab initial';
        initialTab.textContent = 'Initial';
        initialTab.addEventListener('click', () => this.goToStep(0));
        container.appendChild(initialTab);
        
        // Step tabs
        for (let i = 0; i < this.solutions.length; i++) {
            const tab = document.createElement('button');
            tab.className = 'step-tab';
            tab.textContent = `Step ${i + 1}`;
            tab.addEventListener('click', () => this.goToStep(i + 1));
            container.appendChild(tab);
        }
    }
    
    goToStep(step) {
        if (step < 0 || step > this.solutions.length) return;
        
        this.currentStep = step;
        
        // Update tab highlighting
        document.querySelectorAll('.step-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === step);
        });
        
        // Update navigation buttons
        document.getElementById('prevStep').disabled = step === 0;
        document.getElementById('nextStep').disabled = step === this.solutions.length;
        
        // Render step detail
        this.renderStepDetail(step);
    }
    
    renderStepDetail(step) {
        const container = document.getElementById('stepDetail');
        const state = this.gridStates[step];
        
        if (!state) {
            container.innerHTML = '<p class="no-solution">No data</p>';
            return;
        }
        
        // For initial state
        if (step === 0) {
            container.innerHTML = `
                <div class="step-content">
                    <div class="grid-overview">
                        <h4>Initial Grid</h4>
                        ${this.renderOverviewGrid(state.grid, null)}
                    </div>
                    <div class="step-info">
                        <div class="step-title">
                            <h3>Initial State</h3>
                        </div>
                        <p>Grid size: ${this.rows} × ${this.cols}</p>
                        <p>Total blocks: ${state.grid.flat().filter(v => v > 0).length}</p>
                        <p style="margin-top: 15px;">Click "Next" or a Step tab to see solutions.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // For solution steps
        const solution = state.solution;
        const prevGrid = this.gridStates[step - 1].grid;
        const cells = solution.cells;
        
        // Determine location description
        const rowSet = [...new Set(cells.map(c => c.row))];
        const colSet = [...new Set(cells.map(c => c.col))];
        
        let location = '';
        if (solution.type === 'horizontal') {
            location = `Row ${rowSet[0] + 1}, Cols ${Math.min(...colSet.map(c => c + 1))}-${Math.max(...colSet.map(c => c + 1))}`;
        } else if (solution.type === 'vertical') {
            location = `Col ${colSet[0] + 1}, Rows ${Math.min(...rowSet.map(r => r + 1))}-${Math.max(...rowSet.map(r => r + 1))}`;
        } else {
            location = `Cells: ${cells.map(c => `(${c.row + 1},${c.col + 1})`).join(' → ')}`;
        }
        
        const cellTags = cells.map(c => 
            `<span class="cell-tag">R${c.row + 1}C${c.col + 1}: ${c.value}</span>`
        ).join('');
        
        const formula = cells.map(c => c.value).join(' + ');
        
        container.innerHTML = `
            <div class="step-content">
                <div class="grid-overview">
                    <h4>Grid Overview</h4>
                    ${this.renderOverviewGrid(prevGrid, cells)}
                </div>
                <div class="step-info">
                    <div class="step-title">
                        <h3>Step ${step}</h3>
                        <span class="step-badge ${solution.type}">${this.getSolutionTypeLabel(cells)}</span>
                    </div>
                    <div class="step-location">
                        <span class="icon">📍</span>
                        <span>${location}</span>
                    </div>
                    <div class="step-cells">
                        ${cellTags}
                    </div>
                    <div class="step-sum">Sum: ${formula} = ${solution.sum}</div>
                </div>
            </div>
        `;
    }
    
    renderOverviewGrid(grid, highlightCells) {
        const highlightSet = new Set(
            (highlightCells || []).map(c => `${c.row},${c.col}`)
        );
        
        let html = `<div class="overview-grid" style="grid-template-columns: repeat(${grid[0].length}, 24px)">`;
        
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                const value = grid[i][j];
                const isHighlight = highlightSet.has(`${i},${j}`);
                const isEmpty = value <= 0;
                
                let classes = 'overview-cell';
                if (isEmpty) classes += ' empty';
                if (isHighlight) classes += ' highlight';
                
                html += `<div class="${classes}">${isEmpty ? '' : value}</div>`;
            }
        }
        
        html += '</div>';
        return html;
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new NikkeSolver();
});
