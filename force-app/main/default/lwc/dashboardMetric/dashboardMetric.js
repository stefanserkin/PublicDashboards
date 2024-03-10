import { LightningElement, api } from 'lwc';

export default class DashboardMetric extends LightningElement {
    @api title;
    @api value;

    get valueStyle() {
        const colorStyle = this.value > 0 ? 'slds-text-color_error' : 'slds-text-color_success';
        return `dash-metric-value ${colorStyle}`;
    }
}