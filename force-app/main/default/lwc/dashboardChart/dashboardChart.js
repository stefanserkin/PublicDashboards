import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import chartjs from '@salesforce/resourceUrl/ChartJs';
import saveAsImage from '@salesforce/apex/CasesDashboardController.saveAsImage';

/**
 * When using this component in an LWR site, please import the below custom implementation of 'loadScript' module
 * instead of the one from 'lightning/platformResourceLoader'
 *
 * import { loadScript } from 'c/resourceLoader';
 *
 * This workaround is implemented to get around a limitation of the Lightning Locker library in LWR sites.
 * Read more about it in the "Lightning Locker Limitations" section of the documentation
 * https://developer.salesforce.com/docs/atlas.en-us.exp_cloud_lwr.meta/exp_cloud_lwr/template_limitations.htm
 */

export default class DashboardChart extends LightningElement {
    // Name the chart component's lightning card
    @api title;
    // Show/hide download image button-icon
    @api showDownload = false;

    /**
     * Use getter/setter for config to ensure chart data is recreated when it changes
     */
    _config;
    @api 
    set config(value) {
        this._config = value;
        if (this.chartjsInitialized) {
            this.updateChart();
        }
    }
    get config() {
        return this._config;
    }

    error;
    chart;
    chartjsInitialized = false;
    isLoading = false;

    /**
     * @description Called every time the component is rendered, after the DOM is available.
     */
    async renderedCallback() {
        if (this.chartjsInitialized) {
            return;
        }
        
        Promise.all([loadScript(this, chartjs)])
            .then(() => {
                this.chartjsInitialized = true;
                this.updateChart();
            })
            .catch(error => {
                this.error = error;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error loading Chart',
                        message: error.message,
                        variant: 'error',
                    })
                );
            });
    }

    /**
     * @description Updates the chart with the latest data from the API
     * @returns void
     */
    updateChart() {
        if (this.chart) {
            this.chart.destroy();
        }
        const canvas = this.template.querySelector('canvas') || document.createElement('canvas');
        if (!this.template.querySelector('canvas')) {
            this.template.querySelector('div.chart').appendChild(canvas);
        }
        const ctx = canvas.getContext('2d');
        this.chart = new window.Chart(ctx, JSON.parse(JSON.stringify(this._config)));
    }

    /**
     * @description Generates a base64 image of the chart and saves it as a file
     * @returns {Promise}
     */
    async generateImage() {
        this.isLoading = true;
        const image = this.chart.toBase64Image();
        const saveResult = await saveAsImage({
            base64: image.split(',')[1], 
            fileName: `${this.chartTitle}`
        });
        if (saveResult) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: `The image was saved as a Salesforce File. Record ID: ${saveResult}`,
                    variant: 'success',
                })
            );
            this.isLoading = false;
        }
    }

}