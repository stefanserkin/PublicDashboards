import { LightningElement, wire } from 'lwc';
import { refreshApex } from "@salesforce/apex";
import { 
    baseConfig, 
    getUnstackedData, 
    getStackedData
} from 'c/dashboardUtil';
import getOpenCaseStatusCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseStatusCounts';
import getOpenCaseOwnerCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseOwnerCounts';
import getOpenCasePriorityCounts from '@salesforce/apex/CasesDashboardController.getOpenCasePriorityCounts';
import getOpenCaseFacilityCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseFacilityCounts';
import getOpenCaseTypeCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseTypeCounts';
import getClosedCasesLastThirtyDays from '@salesforce/apex/CasesDashboardController.getClosedCasesLastThirtyDays';

export default class EngineeringCasesDashboard extends LightningElement {
    error;
    intervalId;

    locationNames = ['Upper East Side','Battery Park City'];

    // Store wired results so they can be refreshed
    wiredOpenCasesByStatus = [];
    wiredOpenCasesByOwner = [];
    wiredOpenCasesByPriority = [];
    wiredOpenCasesByFacility = [];
    wiredOpenCasesByType = [];
    wiredClosedCasesByOwner = [];

    // Chart configurations
    openCasesByStatusConfig;
    openCasesByOwnerConfig;
    openCasesByPriorityConfig;
    openCasesByFacilityConfig;
    openCasesByTypeConfig;
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
            const config = baseConfig('doughnut');
            config.data = getUnstackedData(rows, 'Status', 'CaseCount', 'Open Cases by Status');
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
            const config = baseConfig('horizontalBar');
            config.data = getUnstackedData(rows, 'CaseOwner', 'CaseCount', 'Closed Cases');
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
            // Create chart config for stacked bar chart
            const config = baseConfig('horizontalBar', true);
            config.data = getStackedData(rows, 'CaseOwner', 'Status', 'CaseCount');
            this.openCasesByOwnerConfig = config;
        } else if (result.error) {
            this.error = result.error;
            console.error(this.error);
        }
    }

    /**
     * @description Wire aggregate results of open cases by priority
     */
    @wire(getOpenCasePriorityCounts)
    openCasesByPriorityWire(result) {
        this.wiredOpenCasesByPriority = result;
        if (result.data) {
            let rows = JSON.parse(JSON.stringify(result.data));
            // Create chart config for stacked bar chart
            const config = baseConfig('horizontalBar', true);
            config.data = getStackedData(rows, 'Priority', 'Status', 'CaseCount');
            this.openCasesByPriorityConfig = config;
        } else if (result.error) {
            this.error = result.error;
            console.error(this.error);
        }
    }

    /**
     * @description Wire aggregate results of open clases by facility name
     */
    @wire(getOpenCaseFacilityCounts)
    openCasesByFacilityWire(result) {
        this.wiredOpenCasesByFacility = result;
        if (result.data) {
            let rows = JSON.parse(JSON.stringify(result.data));
            const config = baseConfig('bar');
            config.data = getUnstackedData(rows, 'Facility', 'CaseCount', 'Open Cases');
            this.openCasesByFacilityConfig = config;
        } else if (result.error) {
            this.error = result.error;
            console.error(this.error);
        }
    }

    /**
     * @description Wire aggregate results of open clases by facility name
     */
    @wire(getOpenCaseTypeCounts)
    openCasesByTypeWire(result) {
        this.wiredOpenCasesByType = result;
        if (result.data) {
            let rows = JSON.parse(JSON.stringify(result.data));
            const config = baseConfig('bar');
            config.data = getUnstackedData(rows, 'Type', 'CaseCount', 'Open Cases');
            this.openCasesByTypeConfig = config;
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
        refreshApex(this.wiredOpenCasesByPriority);
        refreshApex(this.wiredOpenCasesByFacility);
        refreshApex(this.wiredOpenCasesByType);
        refreshApex(this.wiredClosedCasesByOwner);
    }

}