import { LightningElement, api } from 'lwc';
import chartjs from '@salesforce/resourceUrl/ChartJs';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
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

export default class CustomChart extends LightningElement {
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

    @api chartTitle;
    @api showDownload = false;

    error;
    chart;
    chartjsInitialized = false;

    async renderedCallback() {
        if (this.chartjsInitialized) {
            console.log('chartjs is initialized');
            return;
        }

        console.log('show download --> ', this.showDownload);
        
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

    async generateImage() {
        const image = this.chart.toBase64Image();
        console.log(image);
        const saveResult = await saveAsImage({
            base64: image.split(',')[1], 
            fileName: `${this.chartTitle}`
        });
    }

}