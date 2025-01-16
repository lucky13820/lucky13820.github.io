function calculateWeightTrajectory(initialWeight, isMobile) {
    // Helper function to calculate intermediate points
    const interpolate = (start, end, fraction) => start + (end - start) * fraction;
    
    // Calculate average trajectory
    const average = {
        month0: initialWeight,
        month1: initialWeight * (1 - 0.03),
        month4: initialWeight * (1 - 0.085), // Interpolated between month 3 and 6
        month6: initialWeight * (1 - 0.10)
    };

    // Calculate 75th percentile trajectory
    const percentile75 = {
        month0: initialWeight,
        month1: initialWeight * (1 - 0.045),
        month4: initialWeight * (1 - 0.11), // Interpolated between month 3 and 6
        month6: initialWeight * (1 - 0.135)
    };

    // Calculate 95th percentile trajectory
    const percentile95 = {
        month0: initialWeight,
        month1: initialWeight * (1 - 0.065),
        month4: initialWeight * (1 - 0.15), // Interpolated between month 3 and 6
        month6: initialWeight * (1 - 0.175)
    };

    if (isMobile) {
        return {
            average: [average.month0, average.month1, average.month4, average.month6],
            percentile75: [percentile75.month0, percentile75.month1, percentile75.month4, percentile75.month6],
            percentile95: [percentile95.month0, percentile95.month1, percentile95.month4, percentile95.month6]
        };
    }

    // Calculate full dataset for desktop
    const fullAverage = {
        ...average,
        month2: interpolate(average.month1, average.month4, 0.33),
        month3: interpolate(average.month1, average.month4, 0.66),
        month5: interpolate(average.month4, average.month6, 0.5)
    };

    const fullPercentile75 = {
        ...percentile75,
        month2: interpolate(percentile75.month1, percentile75.month4, 0.33),
        month3: interpolate(percentile75.month1, percentile75.month4, 0.66),
        month5: interpolate(percentile75.month4, percentile75.month6, 0.5)
    };

    const fullPercentile95 = {
        ...percentile95,
        month2: interpolate(percentile95.month1, percentile95.month4, 0.33),
        month3: interpolate(percentile95.month1, percentile95.month4, 0.66),
        month5: interpolate(percentile95.month4, percentile95.month6, 0.5)
    };

    return {
        average: [
            fullAverage.month0,
            fullAverage.month1,
            fullAverage.month2,
            fullAverage.month3,
            fullAverage.month4,
            fullAverage.month5,
            fullAverage.month6
        ],
        percentile75: [
            fullPercentile75.month0,
            fullPercentile75.month1,
            fullPercentile75.month2,
            fullPercentile75.month3,
            fullPercentile75.month4,
            fullPercentile75.month5,
            fullPercentile75.month6
        ],
        percentile95: [
            fullPercentile95.month0,
            fullPercentile95.month1,
            fullPercentile95.month2,
            fullPercentile95.month3,
            fullPercentile95.month4,
            fullPercentile95.month5,
            fullPercentile95.month6
        ]
    };
}

// Initialize the chart
const ctx = document.getElementById('predictChart').getContext('2d');
const isMobile = window.innerWidth <= 768;

// Set chart height based on device
const chartCanvas = document.getElementById('predictChart');
if (isMobile) {
    chartCanvas.style.height = '430px';
} else {
    chartCanvas.style.height = '490px';
}

const data = {
    labels: isMobile 
        ? ['0', '1st month', '4th month', '6th month']
        : ['0', '1st month', '2nd month', '3rd month', '4th month', '5th month', '6th month'],
    datasets: [
        {
            label: 'Average Weight Loss',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#0057B8',
            backgroundColor: '#0057B8',
            tension: 0.4,
            datalabels: {
                color: '#0057B8',
                align: 'top'
            }
        },
        {
            label: '75th percentile',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#EF9646',
            backgroundColor: '#EF9646',
            tension: 0.4,
            datalabels: {
                color: '#EF9646',
                align: 'bottom'
            }
        },
        {
            label: '95th percentile',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#686868',
            backgroundColor: '#686868',
            tension: 0.4,
            datalabels: {
                color: '#686868',
                align: 'bottom'
            }
        }
    ]
};

const config = {
    type: 'line',
    data: data,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                enabled: false
            },
            title: {
                display: true,
                text: 'Projected Weight Loss Journey',
                padding: 20,
                font: {
                    size: 16,
                    family: "'Abcdiatype', 'Helvetica', 'Arial', sans-serif",
                }
            },
            legend: {
                position: 'bottom'
            }
        },
        scales: {
            y: {
                min: 0,
                max: 400,
                ticks: {
                    stepSize: isMobile ? 20 : 25,
                    font: {
                        size: isMobile ? 12 : 14,
                        family: "'Abcdiatype', 'Helvetica', 'Arial', sans-serif",
                    }
                },
                grid: {
                    display: false
                }
            },
        },
        elements: {
            point: {
                radius: 5,
                borderWidth: 2,
                backgroundColor: 'white'
            },
            line: {
                borderWidth: 2
            }
        }
    },
    plugins: [
        {
            id: "weightLabels",
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                
                // Draw initial weight label only once using first dataset
                const firstMeta = chart.getDatasetMeta(0);
                const firstPoint = firstMeta.data[0];
                const initialWeight = chart.data.datasets[0].data[0];
                
                ctx.save();
                ctx.textAlign = "center";
                ctx.font = "bold 14px Abcdiatype";
                ctx.fillStyle = "#0057B8";
                ctx.fillText(`${Math.round(initialWeight)}`, firstPoint.x, firstPoint.y - 20);
                
                // Draw other labels for each dataset
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    
                    meta.data.forEach((point, index) => {
                        // Skip the first point (month 0) as we already drew it
                        if (index === 0) return;
                        
                        const value = dataset.data[index];
                        const x = point.x;
                        const y = point.y - 20;
                        
                        ctx.fillStyle = dataset.borderColor;
                        ctx.fillText(`${Math.round(value)}`, x, y);
                    });
                });
                
                ctx.restore();
            }
        }
    ]
};

const chart = new Chart(ctx, config);

// Function to update the chart
function updateChart(chart, initialWeight) {
    const isMobile = window.innerWidth <= 768;
    const trajectories = calculateWeightTrajectory(initialWeight, isMobile);
    
    chart.data.datasets[0].data = trajectories.average.map(val => Math.round(val));
    chart.data.datasets[1].data = trajectories.percentile75.map(val => Math.round(val));
    chart.data.datasets[2].data = trajectories.percentile95.map(val => Math.round(val));
    
    // Find the lowest month 6 weight across all trajectories
    const lowestMonth6Weight = Math.min(
        trajectories.average[trajectories.average.length - 1],
        trajectories.percentile75[trajectories.percentile75.length - 1],
        trajectories.percentile95[trajectories.percentile95.length - 1]
    );
    
    // Calculate max and min for y-axis
    const maxWeight = initialWeight * 1.02;
    const minWeight = lowestMonth6Weight * 0.97;
    
    // Round to nearest 10 for cleaner numbers
    chart.options.scales.y.max = Math.ceil(maxWeight / 10) * 10;
    chart.options.scales.y.min = Math.floor(minWeight / 10) * 10;
    
    // Adjust step size based on the range
    const range = chart.options.scales.y.max - chart.options.scales.y.min;
    chart.options.scales.y.ticks.stepSize = Math.ceil(range / 10 / 5) * 5;
    
    chart.update();
}

// Add event listener to weight input
document.getElementById('weight').addEventListener('input', function(e) {
    const weight = parseFloat(e.target.value);
    if (weight > 0) {
        updateChart(chart, weight);
    }
});

// Add resize handler for responsive behavior
window.addEventListener('resize', () => {
    const newIsMobile = window.innerWidth <= 768;
    if (newIsMobile !== isMobile) {
        location.reload();
    }
});
