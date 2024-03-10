import { LightningElement, wire } from 'lwc';
import { refreshApex } from "@salesforce/apex";
import getOpenCaseStatusCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseStatusCounts';
import getOpenCaseOwnerCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseOwnerCounts';
import getClosedCasesLastThirtyDays from '@salesforce/apex/CasesDashboardController.getClosedCasesLastThirtyDays';

export default class EngineeringCasesDashboard extends LightningElement {
    error;
    intervalId;

    // Store wired results so they can be refreshed
    wiredOpenCasesByStatus = [];
    wiredOpenCasesByOwner = [];
    wiredOpenCasesByPriority = [];
    wiredClosedCasesByOwner = [];

    // Chart configurations
    openCasesByStatusConfig;
    openCasesByOwnerConfig;
    openCasesByPriorityConfig;
    closedCasesLastThirtyConfig;

    // Totals for metric components
    totalOpenCases = 0;
    totalUnassignedCases = 0;
    totalInProgressCases = 0;
    totalAwaitingReplyCases = 0;

    /****************************************
     * Lifecycle hooks
     ****************************************/

    /**
     * @description When component is connected to the DOM, start the refresh interval
     * to automatically update the charts.
     */
    connectedCallback() {
        this.intervalId = setInterval(() => {
            this.refreshComponents();
        }, 5000);
    }

    /**
     * @description Clear interval id from set interval when component is disconnected
     */
    disconnectedCallback() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    /****************************************
     * Get data
     ****************************************/

    /**
     * @description Wire aggregate results of open cases by case status
     */
    @wire(getOpenCaseStatusCounts)
    openCasesByStatusWire(result) {
        this.wiredOpenCasesByStatus = result;
        if (result.data) {
            let rows = JSON.parse(JSON.stringify(result.data));
            const config = this.baseConfig('doughnut');
            const dataset = {
                data: [],
                backgroundColor: [],
                label: 'Open Cases'
            }
            rows.forEach(row => {
                dataset.data.push(row.CaseCount);
                dataset.backgroundColor.push(this.randomRGB());
                config.data.labels.push(row.Status);
            });
            config.data.datasets.push(dataset);
            this.openCasesByStatusConfig = config;
            this.calculateTotalOpenCasesByStatus(rows);
        } else if (result.error) {
            this.error = result.error;
            console.error(this.error);
        }
    }

    /**
     * Recalculate totals of open cases for metric charts
     * @param {Array} rows 
     */
    calculateTotalOpenCasesByStatus(rows) {
        this.totalOpenCases = 0;
        this.totalUnassignedCases = 0;
        this.totalInProgressCases = 0;
        this.totalAwaitingReplyCases = 0;

        rows.forEach(row => {
            this.totalOpenCases += row.CaseCount;
            switch(row.Status) {
                case 'New':
                    this.totalUnassignedCases += row.CaseCount;
                    break;
                case 'In Progress':
                    this.totalInProgressCases += row.CaseCount;
                    break;
                case 'Awaiting Reply':
                    this.totalAwaitingReplyCases += row.CaseCount;
            }
        });
    }

    /**
     * @description Wire aggregate results of closed cases in last 30 days by owner
     */
    @wire(getClosedCasesLastThirtyDays)
    closedCasesLastThirtyDaysWire(result) {
        this.wiredClosedCasesByOwner = result;
        if (result.data) {
            let rows = JSON.parse(JSON.stringify(result.data));
            const config = this.baseConfig('horizontalBar');
            const dataset = {
                data: [],
                backgroundColor: [],
                label: 'Closed Cases'
            }
            rows.forEach(row => {
                dataset.data.push(row.CaseCount);
                dataset.backgroundColor.push(this.randomRGB());
                config.data.labels.push(row.CaseOwner);
            });
            config.data.datasets.push(dataset);
            this.closedCasesLastThirtyConfig = config;
        } else if (result.error) {
            this.error = result.error;
            console.error(this.error);
        }
    }

    /**
     * @description Wire aggregate results of open cases by owner
     */
    @wire(getOpenCaseOwnerCounts)
    openCasesByOwnerWire(result) {
        this.wiredOpenCasesByOwner = result;
        if (result.data) {
            let rows = JSON.parse(JSON.stringify(result.data));
            
            // Create sets and counts object to track unique owner/status combos
            let owners = new Set();
            let statuses = new Set();
            let counts = {}; // { owner: { status: count } }

            rows.forEach(row => {
                let owner = row.CaseOwner;
                let status = row.Status;
                let count = row.CaseCount;
        
                owners.add(owner);
                statuses.add(status);
        
                if (!counts[owner]) {
                    counts[owner] = {};
                }
        
                counts[owner][status] = count;
            });

            // Convert to arrays to iterate with map
            owners = Array.from(owners);
            statuses = Array.from(statuses);

            // Create datasets
            let datasets = statuses.map(status => ({
                label: status,
                data: owners.map(owner => (counts[owner] && counts[owner][status]) ? counts[owner][status] : 0),
                backgroundColor: this.randomRGB(),
                stack: 'Stack 0',
            }));

            // Create chart config for stacked bar chart
            const config = this.baseConfig('bar', true);
            config.data.datasets = datasets;
            config.data.labels = [...owners];
            /*
            config.options.scales = {
                xAxes: { 
                    stacked: true, 
                    beginAtZero: true 
                },
                yAxes: { stacked: true }
            }
            */
            this.openCasesByOwnerConfig = config;
        } else if (result.error) {
            this.error = result.error;
            console.error(this.error);
        }
    }

    /**
     * @description Refresh wired results
     */
    refreshComponents() {
        refreshApex(this.wiredOpenCasesByStatus);
        refreshApex(this.wiredOpenCasesByOwner);
        refreshApex(this.wiredClosedCasesByOwner);
    }

    /****************************************
     * Utilities
     ****************************************/

    /**
     * @description Provides a base configuration, without any datasets, for a given chart type
     * @param {String} chartType 
     * @returns configuration for a chart js component
     */
    baseConfig(chartType, stacked = false) {
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
        if (chartType === 'doughnut') {
            chartConfig.options.animation = {
                 animateRotate: false,
                 animateScale: true
            };
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
     * Generates random rgb value
     * @returns RGB string - rgb(255,255,255)
     */
    randomRGB() {
        var r = Math.floor(Math.random() * 256);
        var g = Math.floor(Math.random() * 256);
        var b = Math.floor(Math.random() * 256);
        return `rgb(${r},${g},${b})`;
    }

}