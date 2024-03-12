import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from "@salesforce/apex";
import { 
    baseConfig, 
    getUnstackedData, 
    getStackedData
} from 'c/dashboardUtil';
import isPasswordProtected from '@salesforce/apex/CasesDashboardController.isPasswordProtected';
import authorizeSession from '@salesforce/apex/CasesDashboardController.authorizeSession';
import getLocations from '@salesforce/apex/CasesDashboardController.getLocations';
import getOpenCaseStatusCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseStatusCounts';
import getOpenCaseOwnerCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseOwnerCounts';
import getOpenCasePriorityCounts from '@salesforce/apex/CasesDashboardController.getOpenCasePriorityCounts';
import getOpenCaseFacilityCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseFacilityCounts';
import getOpenCaseTypeCounts from '@salesforce/apex/CasesDashboardController.getOpenCaseTypeCounts';
import getClosedCasesLastThirtyDays from '@salesforce/apex/CasesDashboardController.getClosedCasesLastThirtyDays';

export default class EngineeringCasesDashboard extends LightningElement {
    error;
    intervalId;
    isLoading = false;

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

    // Password protection
    isPasswordProtected = true;
    isAuthorized = false;
    password;
    lwcName;

    // Location picklist and selection
    wiredLocations = [];
    locationOptions = [];
    selectedLocationId = 'All';
    selectedLocationName;
    recordTypeName = 'Engineering';

    get hasDashboardAccess() {
        return !this.isPasswordProtected || this.isAuthorized;
    }

    /****************************************
     * Lifecycle hooks
     ****************************************/

    /**
     * @description When component is connected to the DOM, start the refresh interval
     * to automatically update the charts.
     */
    connectedCallback() {
        this.isLoading = true;
        this.intervalId = setInterval(() => {
            this.refreshComponents();
        }, 5000);
        
        // Store the name of the current component
        this.lwcName = this.getComponentName();

        // Check for password protection
        isPasswordProtected({lwcName: this.lwcName})
            .then(result => {
                this.isPasswordProtected = result;
                this.isLoading = false;
            })
            .catch(error => {
                this.error = error;
                console.error(this.error);
                this.isLoading = false;
            });
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
     * @description Get locations marked available for cases
     */
    @wire(getLocations)
    wiredResult(result) {
        this.wiredLocations = result;
        if (result.data) {
            result.data.forEach(row => {
                this.locationOptions = [...this.locationOptions, {value: row.Id, label: row.Name}];
            });
            this.error = undefined;
        } else if (result.error) {
            this.locations = undefined;
            this.error = result.error;
            console.error(this.error);
        }
    }

    /**
     * @description Handle location combobox change event
     */
    handleLocationChange(event) {
        this.selectedLocationId = event.detail.value;
        this.selectedLocationName = event.target.options.find(opt => opt.value === this.selectedLocationId).label;
    }

    /**
     * @description Wire aggregate results of open cases by case status
     */
    @wire(getOpenCaseStatusCounts, {recordTypeName: '$recordTypeName', locationId: '$selectedLocationId'})
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
    @wire(getClosedCasesLastThirtyDays, {recordTypeName: '$recordTypeName', locationId: '$selectedLocationId'})
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
    @wire(getOpenCaseOwnerCounts, {recordTypeName: '$recordTypeName', locationId: '$selectedLocationId'})
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
    @wire(getOpenCasePriorityCounts, {recordTypeName: '$recordTypeName', locationId: '$selectedLocationId'})
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
    @wire(getOpenCaseFacilityCounts, {recordTypeName: '$recordTypeName', locationId: '$selectedLocationId'})
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
    @wire(getOpenCaseTypeCounts, {recordTypeName: '$recordTypeName', locationId: '$selectedLocationId'})
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

    /****************************************
     * Password protection
     ****************************************/

    /**
     * Handle password change event
     */
    handlePasswordChange(event) {
        this.password = event.target.value;
    }

    /**
     * Handle submitted password
     */
    handleSubmitPassword() {
        this.isLoading = true;
        authorizeSession({lwcName: this.lwcName, password: this.password})
            .then(result => {
                this.isAuthorized = result == 'success';
                if (result == 'success') {
                    this.isAuthorized = true;
                } else {
                    this.password = '';
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Did not authorize',
                            message: result,
                            variant: 'warning',
                        })
                    );
                }
                this.isLoading = false;
            })
            .catch(error => {
                this.error = error;
                console.error(this.error);
            });
    }

    /**
     * Requests to authenticate require the name of the component
     */
    getComponentName() {
        return this.template.host.localName
            .split('-')
            .slice(1)
            .reduce((a, b) => a + b.charAt(0).toUpperCase() + b.slice(1));
    }

}