/********************************************************
* Chart js utilities for custom dashboard components
* chartjs v2.8.0
********************************************************/

/**
 * @description Provides a base configuration, without any datasets, for a given chart type
 * @param {String} chartType 
 * @returns configuration for a chart js component
 */
const baseConfig = (chartType, stacked = false) => {
    const chartConfig = {
        type: chartType,
        data: {
            datasets: [],
            labels: []
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    };

    // Add options by chart type
    if (chartType === 'doughnut' || chartType === 'pie') {
        chartConfig.options.animation = {
            animateRotate: true,
            animateScale: true
        };
        chartConfig.options.cutoutPercentage = chartType === 'doughnut' ? 25 : 0;
    }
    else if (chartType === 'bar') {
        chartConfig.options.scales = {
            xAxes: [{ 
                stacked: stacked
            }],
            yAxes: [{
                stacked: stacked,
                beginAtZero: true, 
                ticks: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }]
        };
    }
    else if (chartType === 'horizontalBar') {
        chartConfig.options.scales = {
            xAxes: [{ 
                stacked: stacked, 
                beginAtZero: true, 
                ticks: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }],
            yAxes: [{
                stacked: stacked
            }]
        };
    }

    return chartConfig;
}

/**
 * Returns a data object to use in a chart.js doughnut or bar chart
 * @param {Array} rows 
 * @param {String} groupProperty 
 * @param {String} valueProperty 
 * @param {String} label 
 * @returns data object
 */
const getUnstackedData = (rows, groupProperty, valueProperty, label) => {
    const labels = [];
    const dataset = {
        data: [],
        backgroundColor: [],
        label: label
    }
    rows.forEach(row => {
        dataset.data.push(row[valueProperty]);
        dataset.backgroundColor.push(randomRGB());
        const groupVal = row[groupProperty] != null ? row[groupProperty] : '-';
        labels.push(groupVal);
    });
    return {
        labels: labels,
        datasets: [dataset]
    };
}

/**
 * @description Returns a data object to use in a chart.js stacked bar chart
 * @param {Array} rows AggregateResults array
 * @param {String} groupingProperty 
 * @param {String} subGroupingProperty 
 * @param {String} countProperty 
 * @returns data for a chart.js stacked bar chart
 */
const getStackedData = (rows, groupingProperty, subGroupingProperty, countProperty) => {
    // Create sets and counts object to track unique owner/status combos
    let groupingVals = new Set();
    let subGroupingVals = new Set();
    let counts = {}; // { groupingVal: { subGroupingVal: count } }

    rows.forEach(row => {
        let groupingVal = row[groupingProperty] != null ? row[groupingProperty] : '-';
        let subGroupingVal = row[subGroupingProperty];
        let count = row[countProperty];
        groupingVals.add(groupingVal);
        subGroupingVals.add(subGroupingVal);
        if (!counts[groupingVal]) {
            counts[groupingVal] = {};
        }
        counts[groupingVal][subGroupingVal] = count;
    });

    // Convert to arrays to iterate with map
    groupingVals = Array.from(groupingVals);
    subGroupingVals = Array.from(subGroupingVals);

    // Create datasets
    let datasets = subGroupingVals.map(subGp => ({
        label: subGp,
        data: groupingVals.map(gp => (counts[gp] && counts[gp][subGp]) ? counts[gp][subGp] : 0),
        backgroundColor: randomRGB(),
        stack: 'Stack 0',
    }));

    // Return data object with labels from grouping values
    return {
        labels: [...groupingVals],
        datasets: datasets
    };
}

/**
 * Generates random rgb value
 * @returns RGB string - rgb(255,255,255)
 */
const randomRGB = () => {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

export {
    baseConfig, 
    getUnstackedData, 
    getStackedData, 
    randomRGB
};