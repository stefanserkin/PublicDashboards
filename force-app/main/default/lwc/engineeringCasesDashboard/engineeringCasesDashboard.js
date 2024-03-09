import { LightningElement, wire } from 'lwc';
import { refreshApex } from "@salesforce/apex";
import getOpenCaseStatusCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseStatusCounts';
// import getClosedCasesLastThirtyDays from '@salesforce/apex/CasesDashboardController.getClosedCasesLastThirtyDays';

export default class EngineeringCasesDashboard extends LightningElement {
    error;
    intervalId;

    openCasesByStatusConfig;
    closedCasesLastThirtyConfig;

    wiredOpenCasesByStatus = [];

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
            const config = this.baseConfig('doughnut');
            const dataset = {
                data: [],
                backgroundColor: [],
                label: 'Open Cases'
            }
            result.data.forEach(row => {
                dataset.data.push(row.CaseCount);
                dataset.backgroundColor.push(this.randomRGB());
                config.data.labels.push(row.Status);
            });
            config.data.datasets.push(dataset);
            // this.openCasesByStatusConfig = JSON.parse(JSON.stringify(config));
            this.openCasesByStatusConfig = config;
        } else if (result.error) {
            this.error = result.error;
            console.error(this.error);
        }
    }

    /****************************************
     * Utilities
     ****************************************/

    /**
     * @description Provides a base configuration, without any datasets, for a given chart type
     * @param {String} chartType 
     * @returns configuration for a chart js component
     */
    baseConfig(chartType) {
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

        // Add animations by chart type
        if (chartType === 'doughnut') {
            chartConfig.options.animation = {
                 animateRotate: false,
                 animateScale: true
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
        return "rgb(" + r + "," + g + "," + b + ")";
    }

    /**
     * @description Refresh wired results
     */
    refreshComponents() {
        refreshApex(this.wiredOpenCasesByStatus);
    }

}