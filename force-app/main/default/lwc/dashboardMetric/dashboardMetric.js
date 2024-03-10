import { LightningElement, api } from 'lwc';

export default class DashboardMetric extends LightningElement {
    @api title;
    @api value;
    @api minMidRange;
    @api minTopRange;
    @api lessIsMore = false;

    colorClasses = [
        'low-range',
        'mid-range',
        'top-range'
    ];

    get valueStyle() {
        return `dash-metric-value ${this.colorStyle}`;
    }

    get colorStyle() {
        let ranges = [...this.colorClasses];
        if (this.lessIsMore)
            ranges.reverse();

        const rangeIndex = this.value < this.minMidRange ? 0 : (this.value < this.minTopRange ? 1 : 2);
        return ranges[rangeIndex];
    }

}