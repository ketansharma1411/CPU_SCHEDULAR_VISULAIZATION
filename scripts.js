document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const algorithmSelect = document.getElementById('algorithm');
    const timeQuantumGroup = document.querySelector('.time-quantum-group');
    const timeQuantumInput = document.getElementById('time-quantum');
    const addProcessBtn = document.getElementById('add-process-btn');
    const processContainer = document.getElementById('process-container');
    const emptyProcessMessage = document.getElementById('empty-process-message');
    const runSimulationBtn = document.getElementById('run-simulation-btn');
    const resultsContainer = document.getElementById('results-container');
    const ganttChartContainer = document.getElementById('gantt-chart-container');
    const resultsTableBody = document.getElementById('results-table-body');
    const avgWaitingTime = document.getElementById('avg-waiting-time');
    const avgTurnaroundTime = document.getElementById('avg-turnaround-time');
    const avgCompletionTime = document.getElementById('avg-completion-time');
    const priorityColumn = document.querySelector('.priority-column');
    const algorithmInfoTitle = document.getElementById('algorithm-info-title');
    const algorithmDescription = document.getElementById('algorithm-description');
    
    // State
    let processes = [
      { id: 1, name: 'P1', arrivalTime: 0, burstTime: 5, priority: 3 },
      { id: 2, name: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
      { id: 3, name: 'P3', arrivalTime: 2, burstTime: 8, priority: 2 },
      { id: 4, name: 'P4', arrivalTime: 3, burstTime: 2, priority: 4 }
    ];
    let metricsChart = null;
  
    // Algorithm Info
    const algorithmDescriptions = {
      'FCFS': `
        <p class="mb-2">
          <strong>First Come First Serve (FCFS)</strong> is the simplest CPU scheduling algorithm. In this scheme, the process that requests the CPU first is allocated the CPU first.
        </p>
        <p class="mb-2">
          FCFS is easy to understand and implement, but it can lead to the "convoy effect" where short processes wait for a long process to finish.
        </p>
        <p>
          <strong>Key characteristics:</strong>
        </p>
        <ul class="list-disc pl-5">
          <li>Non-preemptive scheduling algorithm</li>
          <li>Process execution is based on arrival order</li>
          <li>Simple, but not optimal for time-sharing systems</li>
          <li>Easy to implement using a FIFO queue</li>
        </ul>
      `,
      'SJF': `
        <p class="mb-2">
          <strong>Shortest Job First (SJF)</strong> assigns CPU to the process with the smallest burst time. This is an optimal algorithm for average waiting time when all processes are available simultaneously.
        </p>
        <p class="mb-2">
          SJF can significantly reduce average waiting time compared to FCFS, but it requires knowing the burst time in advance.
        </p>
        <p>
          <strong>Key characteristics:</strong>
        </p>
        <ul class="list-disc pl-5">
          <li>Non-preemptive scheduling algorithm</li>
          <li>Optimal for minimizing average waiting time</li>
          <li>May cause starvation for longer processes</li>
          <li>Requires advance knowledge of CPU burst time</li>
        </ul>
      `,
      'SRTF': `
        <p class="mb-2">
          <strong>Shortest Remaining Time First (SRTF)</strong> is the preemptive version of SJF. If a new process arrives with a smaller burst time than the remaining time of the current process, the CPU is preempted to the new process.
        </p>
        <p class="mb-2">
          SRTF further reduces average waiting time compared to SJF but increases context switching overhead.
        </p>
        <p>
          <strong>Key characteristics:</strong>
        </p>
        <ul class="list-disc pl-5">
          <li>Preemptive version of SJF</li>
          <li>Optimal for minimizing average waiting time</li>
          <li>Involves context switching overhead</li>
          <li>Requires continuous monitoring of remaining burst times</li>
        </ul>
      `,
      'Round Robin': `
        <p class="mb-2">
          <strong>Round Robin (RR)</strong> is designed specifically for time-sharing systems. Each process is assigned a fixed time quantum (time slice), and after this quantum expires, the process is preempted and added to the end of the ready queue.
        </p>
        <p class="mb-2">
          Round Robin ensures fair allocation of CPU and prevents starvation but introduces context switching overhead.
        </p>
        <p>
          <strong>Key characteristics:</strong>
        </p>
        <ul class="list-disc pl-5">
          <li>Preemptive scheduling algorithm</li>
          <li>Uses fixed time quantum for execution</li>
          <li>Fair allocation of CPU among processes</li>
          <li>Time quantum affects performance (too small: excessive overhead, too large: becomes FCFS)</li>
        </ul>
      `,
      'Priority': `
        <p class="mb-2">
          <strong>Priority Scheduling</strong> allocates the CPU to the process with the highest priority (lowest priority number in this implementation). Equal priority processes are scheduled based on FCFS.
        </p>
        <p class="mb-2">
          Priority can be determined internally (by the system) or externally (by users).
        </p>
        <p>
          <strong>Key characteristics:</strong>
        </p>
        <ul class="list-disc pl-5">
          <li>Can be preemptive or non-preemptive</li>
          <li>May lead to starvation of low-priority processes</li>
          <li>Aging can be implemented to prevent starvation</li>
          <li>Priority can be dynamic or static</li>
        </ul>
      `
    };
  
    // Initialize
    init();
  
    function init() {
      // Set up event listeners
      algorithmSelect.addEventListener('change', handleAlgorithmChange);
      addProcessBtn.addEventListener('click', addProcess);
      runSimulationBtn.addEventListener('click', runSimulation);
      
      // Set up accordion
      document.querySelector('.accordion-header').addEventListener('click', function() {
        this.parentElement.classList.toggle('open');
      });
      
      // Set up tabs
      document.querySelectorAll('.tab-trigger').forEach(tab => {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.tab-trigger').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          
          this.classList.add('active');
          document.getElementById(this.dataset.tab).classList.add('active');
        });
      });
      
      // Initialize the UI
      handleAlgorithmChange();
      updateProcessContainer();
    }
  
    function handleAlgorithmChange() {
      const selectedAlgorithm = algorithmSelect.value;
      
      // Show/hide time quantum input for Round Robin
      if (selectedAlgorithm === 'Round Robin') {
        timeQuantumGroup.style.display = 'block';
      } else {
        timeQuantumGroup.style.display = 'none';
      }
      
      // Show/hide priority column based on selected algorithm
      if (selectedAlgorithm === 'Priority') {
        priorityColumn.style.display = '';
        document.querySelectorAll('.process-priority').forEach(el => {
          el.style.display = 'block';
        });
      } else {
        priorityColumn.style.display = 'none';
        document.querySelectorAll('.process-priority').forEach(el => {
          el.style.display = 'none';
        });
      }
      
      // Update algorithm info
      algorithmInfoTitle.textContent = `About ${selectedAlgorithm} Algorithm`;
      algorithmDescription.innerHTML = algorithmDescriptions[selectedAlgorithm];
    }
  
    function addProcess() {
      const newId = processes.length > 0 ? Math.max(...processes.map(p => p.id)) + 1 : 1;
      const newProcess = {
        id: newId,
        name: `P${newId}`,
        arrivalTime: 0,
        burstTime: 1,
        priority: 1
      };
      
      processes.push(newProcess);
      updateProcessContainer();
    }
  
    function removeProcess(id) {
      processes = processes.filter(p => p.id !== id);
      updateProcessContainer();
    }
  
    function updateProcessContainer() {
      // Clear the container
      processContainer.innerHTML = '';
      
      // Show/hide empty message
      if (processes.length === 0) {
        emptyProcessMessage.style.display = 'block';
      } else {
        emptyProcessMessage.style.display = 'none';
      }
      
      // Add process cards
      processes.forEach(process => {
        const processCard = document.createElement('div');
        processCard.className = 'process-card';
        
        const showPriority = algorithmSelect.value === 'Priority';
        
        processCard.innerHTML = `
          <div class="process-title">${process.name}</div>
          <button class="remove-process" data-id="${process.id}">✕</button>
          
          <div class="process-inputs">
            <div class="input-group">
              <label for="arrival-${process.id}">Arrival Time</label>
              <input 
                id="arrival-${process.id}" 
                type="number" 
                min="0" 
                value="${process.arrivalTime}" 
                data-id="${process.id}" 
                data-field="arrivalTime"
                class="process-input"
              >
            </div>
            
            <div class="input-group">
              <label for="burst-${process.id}">Burst Time</label>
              <input 
                id="burst-${process.id}" 
                type="number" 
                min="1" 
                value="${process.burstTime}" 
                data-id="${process.id}" 
                data-field="burstTime"
                class="process-input"
              >
            </div>
          </div>
          
          <div class="input-group process-priority" style="${showPriority ? 'display: block;' : 'display: none;'}">
            <label for="priority-${process.id}">Priority (Lower = Higher)</label>
            <input 
              id="priority-${process.id}" 
              type="number" 
              min="1" 
              value="${process.priority}" 
              data-id="${process.id}" 
              data-field="priority"
              class="process-input"
            >
          </div>
        `;
        
        processContainer.appendChild(processCard);
        
        // Add event listeners for inputs
        processCard.querySelectorAll('.process-input').forEach(input => {
          input.addEventListener('change', function() {
            const id = parseInt(this.dataset.id);
            const field = this.dataset.field;
            const value = parseInt(this.value) || 0;
            
            const processIndex = processes.findIndex(p => p.id === id);
            if (processIndex !== -1) {
              processes[processIndex][field] = value;
            }
          });
        });
        
        // Add event listener for remove button
        processCard.querySelector('.remove-process').addEventListener('click', function() {
          const id = parseInt(this.dataset.id);
          removeProcess(id);
        });
      });
    }
  
    function runSimulation() {
      if (processes.length === 0) {
        alert("Please add at least one process");
        return;
      }
      
      const algorithm = algorithmSelect.value;
      const timeQuantum = parseInt(timeQuantumInput.value) || 2;
      
      try {
        let result;
        
        switch (algorithm) {
          case 'FCFS':
            result = fcfs([...processes]);
            break;
          case 'SJF':
            result = sjf([...processes]);
            break;
          case 'SRTF':
            result = srtf([...processes]);
            break;
          case 'Round Robin':
            result = roundRobin([...processes], timeQuantum);
            break;
          case 'Priority':
            result = priorityScheduling([...processes]);
            break;
          default:
            throw new Error("Invalid algorithm selected");
        }
        
        displayResults(result);
        resultsContainer.style.display = 'block';
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        alert(`Error running simulation: ${error.message}`);
      }
    }
  
    function displayResults(result) {
      // Display Gantt Chart
      displayGanttChart(result.ganttChart);
      
      // Display Results Table
      displayResultsTable(result.processes, algorithm.value === 'Priority');
      
      // Display Average Metrics
      avgWaitingTime.textContent = result.averageWaitingTime.toFixed(2);
      avgTurnaroundTime.textContent = result.averageTurnaroundTime.toFixed(2);
      avgCompletionTime.textContent = result.averageCompletionTime.toFixed(2);
      
      // Display Bar Chart
      displayMetricsChart(result.processes);
    }
  
    function displayGanttChart(ganttData) {
      // Clear the container
      ganttChartContainer.innerHTML = '';
      
      if (!ganttData || ganttData.length === 0) {
        ganttChartContainer.innerHTML = '<p class="empty-process">Run the simulation to see the Gantt Chart</p>';
        return;
      }
      
      // Find the total time span
      const endTime = Math.max(...ganttData.map(item => item.endTime));
      
      // Calculate the width of each time unit (in percentage)
      const timeUnitWidth = 100 / endTime;
      
      // Group the Gantt items by process
      const processIds = Array.from(new Set(ganttData.map(item => item.processId)));
      
      // Create process rows
      processIds.forEach((processId, rowIndex) => {
        const process = processes.find(p => p.id === processId);
        const processItems = ganttData.filter(item => item.processId === processId);
        
        const processRow = document.createElement('div');
        processRow.className = 'process-row';
        
        const processLabel = document.createElement('div');
        processLabel.className = 'process-label';
        processLabel.textContent = process ? process.name : `P${processId}`;
        
        const processTimeline = document.createElement('div');
        processTimeline.className = 'process-timeline';
        
        // Add bars for this process
        processItems.forEach(item => {
          const width = (item.endTime - item.startTime) * timeUnitWidth;
          const left = item.startTime * timeUnitWidth;
          
          const bar = document.createElement('div');
          bar.className = `gantt-bar process-color-${processId % 10}`;
          bar.style.width = `${width}%`;
          bar.style.left = `${left}%`;
          
          if (width > 5) {
            bar.textContent = `${item.startTime}-${item.endTime}`;
          }
          
          processTimeline.appendChild(bar);
        });
        
        processRow.appendChild(processLabel);
        processRow.appendChild(processTimeline);
        ganttChartContainer.appendChild(processRow);
      });
      
      // Add time marks
      const timeScale = document.createElement('div');
      timeScale.className = 'time-scale';
      
      for (let i = 0; i <= endTime; i++) {
        const timeMark = document.createElement('div');
        timeMark.className = 'time-mark';
        timeMark.style.width = `${timeUnitWidth}%`;
        timeMark.textContent = i;
        
        timeScale.appendChild(timeMark);
      }
      
      ganttChartContainer.appendChild(timeScale);
    }
  
    function displayResultsTable(processes, showPriority) {
      // Clear the table
      resultsTableBody.innerHTML = '';
      
      // Show/hide priority column
      priorityColumn.style.display = showPriority ? '' : 'none';
      
      // Add table rows
      processes.forEach(process => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${process.name}</td>
          <td>${process.arrivalTime}</td>
          <td>${process.burstTime}</td>
          ${showPriority ? `<td>${process.priority}</td>` : ''}
          <td>${process.completionTime}</td>
          <td>${process.turnaroundTime}</td>
          <td>${process.waitingTime}</td>
        `;
        
        resultsTableBody.appendChild(row);
      });
    }
  
    function displayMetricsChart(processes) {
      // Destroy previous chart if exists
      if (metricsChart) {
        metricsChart.destroy();
      }
      
      const ctx = document.getElementById('metrics-chart').getContext('2d');
      
      const labels = processes.map(p => p.name);
      const waitingTimeData = processes.map(p => p.waitingTime);
      const turnaroundTimeData = processes.map(p => p.turnaroundTime);
      const burstTimeData = processes.map(p => p.burstTime);
      
      metricsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Waiting Time',
              data: waitingTimeData,
              backgroundColor: '#9b87f5',
              borderColor: '#9b87f5',
              borderWidth: 1
            },
            {
              label: 'Turnaround Time',
              data: turnaroundTimeData,
              backgroundColor: '#1EAEDB',
              borderColor: '#1EAEDB',
              borderWidth: 1
            },
            {
              label: 'Burst Time',
              data: burstTimeData,
              backgroundColor: '#7E69AB',
              borderColor: '#7E69AB',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  
    // Scheduling Algorithms
    // First Come First Serve (FCFS) Scheduling Algorithm
    function fcfs(processes) {
      // Sort processes based on arrival time
      const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
      const ganttChart = [];
      const resultProcesses = [];
  
      let currentTime = 0;
      let totalWaitingTime = 0;
      let totalTurnaroundTime = 0;
      let totalCompletionTime = 0;
  
      for (const process of sortedProcesses) {
        const processClone = { ...process };
        
        // If the current time is less than the process arrival time,
        // update the current time to the arrival time
        currentTime = Math.max(currentTime, processClone.arrivalTime);
        
        processClone.startTime = currentTime;
        processClone.completionTime = currentTime + processClone.burstTime;
        processClone.turnaroundTime = processClone.completionTime - processClone.arrivalTime;
        processClone.waitingTime = processClone.turnaroundTime - processClone.burstTime;
  
        // Add the process to the Gantt chart
        ganttChart.push({
          processId: processClone.id,
          startTime: currentTime,
          endTime: processClone.completionTime
        });
  
        // Update the current time
        currentTime = processClone.completionTime;
  
        // Update the total waiting time and turnaround time
        totalWaitingTime += processClone.waitingTime;
        totalTurnaroundTime += processClone.turnaroundTime;
        totalCompletionTime += processClone.completionTime;
  
        resultProcesses.push(processClone);
      }
  
      return {
        ganttChart,
        processes: resultProcesses,
        averageWaitingTime: totalWaitingTime / processes.length,
        averageTurnaroundTime: totalTurnaroundTime / processes.length,
        averageCompletionTime: totalCompletionTime / processes.length
      };
    }
  
    // Shortest Job First (SJF) Scheduling Algorithm
    function sjf(processes) {
      const resultProcesses = processes.map(p => ({...p, remainingTime: p.burstTime}));
      const ganttChart = [];
      
      let currentTime = 0;
      let completedProcesses = 0;
      let totalWaitingTime = 0;
      let totalTurnaroundTime = 0;
      let totalCompletionTime = 0;
  
      // Find the earliest arrival time
      currentTime = Math.min(...resultProcesses.map(p => p.arrivalTime));
  
      while (completedProcesses < resultProcesses.length) {
        let nextProcess = null;
        let shortestBurst = Number.MAX_VALUE;
        let shortestIndex = -1;
  
        // Find the process with minimum burst time among the arrived processes
        for (let i = 0; i < resultProcesses.length; i++) {
          if (resultProcesses[i].remainingTime > 0 && 
              resultProcesses[i].arrivalTime <= currentTime &&
              resultProcesses[i].remainingTime < shortestBurst) {
            shortestBurst = resultProcesses[i].remainingTime;
            shortestIndex = i;
          }
        }
  
        // If no process is found, move time to the next arrival
        if (shortestIndex === -1) {
          const notArrivedProcesses = resultProcesses.filter(p => p.arrivalTime > currentTime && p.remainingTime > 0);
          if (notArrivedProcesses.length === 0) break;
          currentTime = Math.min(...notArrivedProcesses.map(p => p.arrivalTime));
          continue;
        }
  
        nextProcess = resultProcesses[shortestIndex];
        
        // If this is the first time the process is being executed,
        // set its start time
        if (nextProcess.remainingTime === nextProcess.burstTime) {
          nextProcess.startTime = currentTime;
        }
        
        // Execute the process
        nextProcess.remainingTime = 0;
        nextProcess.completionTime = currentTime + nextProcess.burstTime;
  
        // Add the process to the Gantt chart
        ganttChart.push({
          processId: nextProcess.id,
          startTime: currentTime,
          endTime: nextProcess.completionTime
        });
  
        // Update the current time
        currentTime = nextProcess.completionTime;
  
        // Calculate the turnaround time and waiting time
        nextProcess.turnaroundTime = nextProcess.completionTime - nextProcess.arrivalTime;
        nextProcess.waitingTime = nextProcess.turnaroundTime - nextProcess.burstTime;
  
        // Update the total waiting time and turnaround time
        totalWaitingTime += nextProcess.waitingTime;
        totalTurnaroundTime += nextProcess.turnaroundTime;
        totalCompletionTime += nextProcess.completionTime;
  
        completedProcesses++;
      }
  
      return {
        ganttChart,
        processes: resultProcesses,
        averageWaitingTime: totalWaitingTime / processes.length,
        averageTurnaroundTime: totalTurnaroundTime / processes.length,
        averageCompletionTime: totalCompletionTime / processes.length
      };
    }
  
    // Shortest Remaining Time First (SRTF) Scheduling Algorithm
    function srtf(processes) {
      const resultProcesses = processes.map(p => ({...p, remainingTime: p.burstTime}));
      const ganttChart = [];
  
      let currentTime = 0;
      let completedProcesses = 0;
      let totalWaitingTime = 0;
      let totalTurnaroundTime = 0;
      let totalCompletionTime = 0;
      let lastProcessId = -1;
      let ganttStartTime = 0;
  
      // Find the earliest arrival time
      currentTime = Math.min(...resultProcesses.map(p => p.arrivalTime));
  
      while (completedProcesses < resultProcesses.length) {
        let shortestTime = Number.MAX_VALUE;
        let shortestProcessIndex = -1;
  
        // Find the process with minimum remaining time among the arrived processes
        for (let i = 0; i < resultProcesses.length; i++) {
          if (resultProcesses[i].arrivalTime <= currentTime && 
              resultProcesses[i].remainingTime > 0 && 
              resultProcesses[i].remainingTime < shortestTime) {
            shortestTime = resultProcesses[i].remainingTime;
            shortestProcessIndex = i;
          }
        }
  
        // If no process is found, move time to the next arrival
        if (shortestProcessIndex === -1) {
          const notArrivedProcesses = resultProcesses.filter(p => p.arrivalTime > currentTime && p.remainingTime > 0);
          if (notArrivedProcesses.length === 0) break;
          
          // Add idle time to gantt chart if there was a previous process
          if (lastProcessId !== -1) {
            ganttChart.push({
              processId: lastProcessId,
              startTime: ganttStartTime,
              endTime: currentTime
            });
            lastProcessId = -1;
          }
          
          currentTime = Math.min(...notArrivedProcesses.map(p => p.arrivalTime));
          continue;
        }
  
        // If this is the first time the process is being executed,
        // set its start time
        if (resultProcesses[shortestProcessIndex].remainingTime === resultProcesses[shortestProcessIndex].burstTime) {
          resultProcesses[shortestProcessIndex].startTime = currentTime;
        }
  
        // If we're switching processes, add the previous one to the Gantt chart
        if (lastProcessId !== -1 && lastProcessId !== resultProcesses[shortestProcessIndex].id) {
          ganttChart.push({
            processId: lastProcessId,
            startTime: ganttStartTime,
            endTime: currentTime
          });
          ganttStartTime = currentTime;
        }
        
        // If this is the first process or a new process
        if (lastProcessId === -1 || lastProcessId !== resultProcesses[shortestProcessIndex].id) {
          ganttStartTime = currentTime;
        }
  
        lastProcessId = resultProcesses[shortestProcessIndex].id;
        
        // Determine how much time to execute
        let timeToExecute = 1; // Execute for 1 time unit
  
        // Update the remaining time of the process
        resultProcesses[shortestProcessIndex].remainingTime -= timeToExecute;
        
        // Update the current time
        currentTime += timeToExecute;
  
        // Check if the process has completed
        if (resultProcesses[shortestProcessIndex].remainingTime === 0) {
          completedProcesses++;
          
          // Calculate completion time, turnaround time, and waiting time
          resultProcesses[shortestProcessIndex].completionTime = currentTime;
          resultProcesses[shortestProcessIndex].turnaroundTime = 
            resultProcesses[shortestProcessIndex].completionTime - resultProcesses[shortestProcessIndex].arrivalTime;
          resultProcesses[shortestProcessIndex].waitingTime = 
            resultProcesses[shortestProcessIndex].turnaroundTime - resultProcesses[shortestProcessIndex].burstTime;
  
          // Update the total waiting time and turnaround time
          totalWaitingTime += resultProcesses[shortestProcessIndex].waitingTime;
          totalTurnaroundTime += resultProcesses[shortestProcessIndex].turnaroundTime;
          totalCompletionTime += resultProcesses[shortestProcessIndex].completionTime;
  
          // Add the completed process to the Gantt chart
          ganttChart.push({
            processId: resultProcesses[shortestProcessIndex].id,
            startTime: ganttStartTime,
            endTime: currentTime
          });
          
          lastProcessId = -1;
        }
      }
  
      return {
        ganttChart,
        processes: resultProcesses,
        averageWaitingTime: totalWaitingTime / processes.length,
        averageTurnaroundTime: totalTurnaroundTime / processes.length,
        averageCompletionTime: totalCompletionTime / processes.length
      };
    }
  
    // Round Robin Scheduling Algorithm
    function roundRobin(processes, timeQuantum) {
      const resultProcesses = processes.map(p => ({...p, remainingTime: p.burstTime}));
      const ganttChart = [];
      
      let currentTime = 0;
      let completedProcesses = 0;
      let totalWaitingTime = 0;
      let totalTurnaroundTime = 0;
      let totalCompletionTime = 0;
      
      // Find the earliest arrival time
      const earliestArrivalTime = Math.min(...resultProcesses.map(p => p.arrivalTime));
      currentTime = earliestArrivalTime;
  
      // Ready queue for Round Robin scheduling
      let readyQueue = [];
      
      // Initially add all processes that have arrived at the earliest arrival time
      for (let i = 0; i < resultProcesses.length; i++) {
        if (resultProcesses[i].arrivalTime === earliestArrivalTime) {
          readyQueue.push(i);
        }
      }
  
      while (completedProcesses < resultProcesses.length) {
        if (readyQueue.length === 0) {
          // If ready queue is empty, find the next process to arrive
          const notArrivedProcesses = resultProcesses.filter(p => p.arrivalTime > currentTime && p.remainingTime > 0);
          if (notArrivedProcesses.length === 0) break;
          
          currentTime = Math.min(...notArrivedProcesses.map(p => p.arrivalTime));
          
          // Add all processes that arrive at this time to the ready queue
          for (let i = 0; i < resultProcesses.length; i++) {
            if (resultProcesses[i].arrivalTime === currentTime && resultProcesses[i].remainingTime > 0) {
              readyQueue.push(i);
            }
          }
          continue;
        }
  
        // Get the next process from the ready queue
        const processIndex = readyQueue.shift();
        
        // If this is the first time the process is being executed,
        // set its start time
        if (resultProcesses[processIndex].remainingTime === resultProcesses[processIndex].burstTime) {
          resultProcesses[processIndex].startTime = currentTime;
        }
        
        // Determine how much time to execute
        const timeToExecute = Math.min(timeQuantum, resultProcesses[processIndex].remainingTime);
        
        // Add the process to the Gantt chart
        ganttChart.push({
          processId: resultProcesses[processIndex].id,
          startTime: currentTime,
          endTime: currentTime + timeToExecute
        });
        
        // Update the remaining time of the process
        resultProcesses[processIndex].remainingTime -= timeToExecute;
        
        // Update the current time
        currentTime += timeToExecute;
        
        // Add any processes that have arrived during execution to the ready queue
        for (let i = 0; i < resultProcesses.length; i++) {
          if (resultProcesses[i].arrivalTime > currentTime - timeToExecute && 
              resultProcesses[i].arrivalTime <= currentTime && 
              resultProcesses[i].remainingTime > 0 && 
              i !== processIndex && 
              !readyQueue.includes(i)) {
            readyQueue.push(i);
          }
        }
        
        // Check if the process has completed
        if (resultProcesses[processIndex].remainingTime === 0) {
          completedProcesses++;
          
          // Calculate completion time, turnaround time, and waiting time
          resultProcesses[processIndex].completionTime = currentTime;
          resultProcesses[processIndex].turnaroundTime = 
            resultProcesses[processIndex].completionTime - resultProcesses[processIndex].arrivalTime;
          resultProcesses[processIndex].waitingTime = 
            resultProcesses[processIndex].turnaroundTime - resultProcesses[processIndex].burstTime;
          
          // Update the total waiting time and turnaround time
          totalWaitingTime += resultProcesses[processIndex].waitingTime;
          totalTurnaroundTime += resultProcesses[processIndex].turnaroundTime;
          totalCompletionTime += resultProcesses[processIndex].completionTime;
        } else {
          // If the process has not completed, add it back to the ready queue
          readyQueue.push(processIndex);
        }
      }
  
      return {
        ganttChart,
        processes: resultProcesses,
        averageWaitingTime: totalWaitingTime / processes.length,
        averageTurnaroundTime: totalTurnaroundTime / processes.length,
        averageCompletionTime: totalCompletionTime / processes.length
      };
    }
  
    // Priority Scheduling Algorithm (lower number = higher priority)
    function priorityScheduling(processes) {
      // Check if all processes have priority
      if (processes.some(p => p.priority === undefined)) {
        throw new Error("Priority scheduling requires a priority for each process");
      }
      
      const resultProcesses = processes.map(p => ({...p, remainingTime: p.burstTime}));
      const ganttChart = [];
  
      let currentTime = 0;
      let completedProcesses = 0;
      let totalWaitingTime = 0;
      let totalTurnaroundTime = 0;
      let totalCompletionTime = 0;
  
      // Find the earliest arrival time
      currentTime = Math.min(...resultProcesses.map(p => p.arrivalTime));
  
      while (completedProcesses < resultProcesses.length) {
        let highestPriority = Number.MAX_VALUE;
        let priorityProcessIndex = -1;
  
        // Find the process with highest priority (lowest number)
        for (let i = 0; i < resultProcesses.length; i++) {
          if (resultProcesses[i].arrivalTime <= currentTime && 
              resultProcesses[i].remainingTime > 0 && 
              resultProcesses[i].priority < highestPriority) {
            highestPriority = resultProcesses[i].priority;
            priorityProcessIndex = i;
          }
        }
  
        // If no process is found, move time to the next arrival
        if (priorityProcessIndex === -1) {
          const notArrivedProcesses = resultProcesses.filter(p => p.arrivalTime > currentTime && p.remainingTime > 0);
          if (notArrivedProcesses.length === 0) break;
          currentTime = Math.min(...notArrivedProcesses.map(p => p.arrivalTime));
          continue;
        }
  
        const process = resultProcesses[priorityProcessIndex];
        
        // If this is the first time the process is being executed,
        // set its start time
        if (process.remainingTime === process.burstTime) {
          process.startTime = currentTime;
        }
        
        // Execute the process
        process.remainingTime = 0;
        process.completionTime = currentTime + process.burstTime;
  
        // Add the process to the Gantt chart
        ganttChart.push({
          processId: process.id,
          startTime: currentTime,
          endTime: process.completionTime
        });
  
        // Update the current time
        currentTime = process.completionTime;
  
        // Calculate the turnaround time and waiting time
        process.turnaroundTime = process.completionTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;
  
        // Update the total waiting time and turnaround time
        totalWaitingTime += process.waitingTime;
        totalTurnaroundTime += process.turnaroundTime;
        totalCompletionTime += process.completionTime;
  
        completedProcesses++;
      }
  
      return {
        ganttChart,
        processes: resultProcesses,
        averageWaitingTime: totalWaitingTime / processes.length,
        averageTurnaroundTime: totalTurnaroundTime / processes.length,
        averageCompletionTime: totalCompletionTime / processes.length
      };
    }
  });