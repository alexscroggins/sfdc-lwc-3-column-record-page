import { LightningElement, api, wire } from 'lwc';
import { MessageContext, subscribe, unsubscribe } from 'lightning/messageService';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import recordSelected from '@salesforce/messageChannel/RecordSelected__c';

export default class SelectedRecord extends LightningElement {

    title = 'Selected Record'
    subscription = null;
    objectApiName;
    showRecordForm = false;
    _recordId;
    iconName;

    @api set recordId(value) {
        this._recordId = value;
        this.showRecordForm = false;
        setTimeout(() => this.showRecordForm = true); // Force element to be completed removed from the DOM. Credit: https://salesforce.stackexchange.com/questions/368235/undocumented-bug-lightning-record-form-fields-layout-change-lags-behind-recor
    }

    get recordId() {
        return this._recordId
    }

    /*
     * Checking recordId alone is not a good indicator of whether this component has data, because the target of 
     * this component is lightning__RecordPage and it will therefore have recordId already populated. Therefore, I 
     * created this getter that can be used by the component to know whether it should show data.
     */
    get hasSelectedRecord() {
        return this.objectApiName && this._recordId;
    }

    @wire(MessageContext)
    messageContext;

    @wire(getObjectInfo, { 
        objectApiName: '$objectApiName' 
    })
    handleResult({error, data}) {
        if (data) {
            let iconUrl = data.themeInfo.iconUrl ;
            if (iconUrl && iconUrl.trim() !== '') {
                const iconUrlParts = iconUrl.split('/');
                if (iconUrlParts.length > 2) {
                    const iconSvg = iconUrlParts[iconUrlParts.length - 1];
                    const iconName = iconSvg.substring(0, iconSvg.lastIndexOf('_'));
                    this.iconName = `${iconUrlParts[iconUrlParts.length - 2]}:${iconName}`;
                    console.log('iconName: ' + JSON.stringify(iconName));
                }
            }
        } else if (error) {
            // TODO
        }
    }

    // Standard lifecycle hook used to subscribe to the message channel.
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    // Standard lifecycle hook used to unsubscribe from the message channel.
    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    // Handler for message received by component.
    handleMessage(message) {
        this.recordId = message.recordId;
        this.objectApiName = message.objectApiName;
        this.title = `Selected ${message.objectApiName} Record`;
    }

    // Encapsulate logic for Lightning Message Service subscribe.
    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                recordSelected,
                (message) => this.handleMessage(message)
            );
        }
    }

    // Encapsulate logic for Lightning Message Service unsubscribe.
    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

}