
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    // Initialize pass fail chart data
    const passFailChartElement = document.getElementById('passFailChart');
    const passFailChart = new Chart(passFailChartElement, {
      type: 'doughnut',
      options: {
        aspectRatio: 1.5,
        plugins: {
            legend: {
                display: false
            }
        }
      },
      data: {
        labels: ['Pass', 'Fail', 'Review'],
        datasets: [{
          label: '# of Tests',
          data: [0, 0, 0],
          backgroundColor: [
              'rgb(54, 162, 235)',
              'rgb(255, 99, 132)',
              'rgb(255, 205, 86)'
          ],
          borderColor: 'rgba(0, 0, 0, 0.9)',
          hoverOffset: 4
        }]
      }
    });

    // Initial file minimap chart
    const fileMinimapChartElement = document.getElementById('fileMapChart');
    const fileMinimapChart = new Chart(fileMinimapChartElement, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Piton File',
                data: [],
                backgroundColor: '#ADBBD8',
                borderColor: 'rgba(0, 0, 0, 0.9)',
                hoverOffset: 4
            }]
        },
        options: {
            aspectRatio: 4.5,
            plugins: {
                legend: {
                    display: false
                }
            },
            onClick: (e, activeElementList) => {
                let datasetIndex = activeElementList[0].datasetIndex;
                let dataIndex = activeElementList[0].index;
                let value = e.chart.data.datasets[datasetIndex].data[dataIndex];

                console.log('clicked element', value);
                openVscodeFile(value.filePath);
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Percent of Valid Data'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Checks'
                    },
                    suggestedMin: 0,
                    suggestedMax: 6
                }
            }
        }
    });

    openVscodeFile = function(filePath) {
        vscode.postMessage({
            command: 'vscode.open',
            text: filePath
        });
    };

    rerenderPassFail = function(passCount, failCount, toReviewCount) {
        // Update pass fail chart data
        passFailChart.data.datasets.pop();
        passFailChart.data.datasets.push({
            label: '# of Tests',
            data: [passCount, failCount, toReviewCount],
            backgroundColor: [
                'rgb(54, 162, 235)',
                'rgb(255, 99, 132)',
                'rgb(255, 205, 86)'
            ],
            borderColor: 'rgba(0, 0, 0, 0.9)',
            hoverOffset: 4
        });
        passFailChart.update();
    };

    rerenderFilesToReview = function(pitonToReviewIconUri, toReviewFiles) {
        // Update files to review list
        const toReviewFileElement = document.getElementById('filesToReview');
        const html = `<h2>Files To Review</h2>
        <div class="summary--col--resultsitem ${toReviewFiles.length > 0 ? 'summary--col--resultsitem-hide' : ''}">
            <span>(no files)</span>
        </div>
        <div class="summary--col--resultsitem ${toReviewFiles.length === 0 ? 'summary--col--resultsitem-hide' : ''}">
            <img src="${pitonToReviewIconUri}"/>
            <a class="review-file-button" pnFilePath="${toReviewFiles[0]?.resultFilePath}">${toReviewFiles[0]?.parsedPart?.fileName}:${toReviewFiles[0]?.parsedPart?.name || `Check${toReviewFiles[0]?.parsedPart?.order}`} <i>${toReviewFiles[0]?.toBeReviewedCount} rows to review</i></a>
        </div>
        <div class="summary--col--resultsitem ${toReviewFiles.length <= 1 ? 'summary--col--resultsitem-hide' : ''}">
            <img src="${pitonToReviewIconUri}"/>
            <a class="review-file-button" pnFilePath="${toReviewFiles[1]?.resultFilePath}">${toReviewFiles[1]?.parsedPart?.fileName}:${toReviewFiles[1]?.parsedPart?.name || `Check${toReviewFiles[1]?.parsedPart?.order}`} <i>${toReviewFiles[1]?.toBeReviewedCount} rows to review</i></a>
        </div>
        <div class="summary--col--resultsitem ${toReviewFiles.length <= 2 ? 'summary--col--resultsitem-hide' : ''}">
            <img src="${pitonToReviewIconUri}"/>
            <a class="review-file-button" pnFilePath="${toReviewFiles[2]?.resultFilePath}">${toReviewFiles[2]?.parsedPart?.fileName}:${toReviewFiles[2]?.parsedPart?.name || `Check${toReviewFiles[2]?.parsedPart?.order}`} <i>${toReviewFiles[2]?.toBeReviewedCount} rows to review</i></a>
        </div>
        <div class="summary--col--resultsitem ${toReviewFiles.length <= 3 ? 'summary--col--resultsitem-hide' : ''}">
            <img src="${pitonToReviewIconUri}"/>
            <a class="review-file-button" pnFilePath="${toReviewFiles[3]?.resultFilePath}">${toReviewFiles[3]?.parsedPart?.fileName}:${toReviewFiles[3]?.parsedPart?.name || `Check${toReviewFiles[3]?.parsedPart?.order}`} <i>${toReviewFiles[3]?.toBeReviewedCount} rows to review</i></a>
        </div>
        <div class="summary--col--resultsitem ${toReviewFiles.length <= 4 ? 'summary--col--resultsitem-hide' : ''}">
            <img src="${pitonToReviewIconUri}"/>
            <a class="review-file-button" pnFilePath="${toReviewFiles[4]?.resultFilePath}">${toReviewFiles[4]?.parsedPart?.fileName}:${toReviewFiles[4]?.parsedPart?.name || `Check${toReviewFiles[4]?.parsedPart?.order}`} <i>${toReviewFiles[4]?.toBeReviewedCount} rows to review</i></a>
        </div>
        <div class="summary--col--resultsitem ${toReviewFiles.length <= 3 ? 'summary--col--resultsitem-hide' : ''}">
            <span>(${toReviewFiles.length - 5} more files)</span>
        </div>`;

        toReviewFileElement.innerHTML = html;

        // Attach button action
        const buttons = document.querySelectorAll('.review-file-button');
        for (let button of buttons) {
            button.addEventListener('click', () => {
                const pnFilePath = button.getAttribute('pnFilePath');
                console.log('openning file: ' + pnFilePath);
                openVscodeFile(pnFilePath);
            });
        }
    };

    rerenderFileMap = function(fileMinimapLabels, fileMinimap) {
        // Update minimap data
        fileMinimapChart.data.labels = fileMinimapLabels;
        fileMinimapChart.data.datasets.pop();
        fileMinimapChart.data.datasets.push({
            label: 'Piton File',
            data: fileMinimap,
            backgroundColor: '#ADBBD8',
            borderColor: 'rgba(0, 0, 0, 0.9)',
            hoverOffset: 4
        });
        fileMinimapChart.update();
    };

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'rerender':
                rerenderPassFail(message.passCount, message.failCount, message.toReviewCount);
                rerenderFilesToReview(message.pitonToReviewIconUri, message.toReviewFiles);
                rerenderFileMap(message.fileMinimapLabels, message.fileMinimap);
                break;
        }
    });

    
}());
