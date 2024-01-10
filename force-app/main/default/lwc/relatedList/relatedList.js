import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRelatedListInfo, getRelatedListRecords } from 'lightning/uiRelatedListApi'
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import recordSelected from '@salesforce/messageChannel/RecordSelected__c';

export default class RelatedList extends LightningElement {

    // API.
    @api objectApiName;
    @api recordId;
    @api relatedListId;
    
    // Fields.
    relatedListObjectApiName;
    relatedListApiFieldNames;
    relatedListInfoError;
    relatedListColumns;
    relatedListRecords;
    relatedListRecordsError;
    subscription = null;
    iconName;

    // Wire adapters.
    @wire(MessageContext) messageContext;

    @wire(getRelatedListInfo, {
        parentObjectApiName: '$objectApiName',
        relatedListId: '$relatedListId'
    })
    relListInfo({error, data}) {
        if (data) {
            this.relatedListInfoError = undefined;
            this.relatedListObjectApiName = data.objectApiNames[0];
            this.relatedListColumns = data.displayColumns;
            this.relatedListRecords = undefined;

            // Get related list API field names.
            this.relatedListApiFieldNames = data.displayColumns.map(dc => `${this.relatedListObjectApiName}.${dc.fieldApiName}`);

        } else if (error) {
            console.error(`Error fetching related list info for ${this.relatedListId}: ${JSON.stringify(error)}`);
            this.relatedListInfoError = error;
            this.relatedListColumns = undefined;
            this.relatedListRecords = undefined;
        }
    }

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: '$relatedListId',
        fields: '$relatedListApiFieldNames'
    })
    relListRecords({ error, data }) {
        if (data) {
            this.relatedListRecordsError = undefined;

            /*
             * Format records in a way so that its fields can be iterated over in the view. In "data.fields", fields are 
             * stored in an object key/value format. The "data.fields" object needs to be converted to an array of fields.
             */
            this.relatedListRecords = [];
            data.records.forEach(rec => {
                let formattedFields = [];
                for (const key in rec.fields) {
                    formattedFields.push({
                        id: `${rec.id}.${key}`,
                        name: key,
                        value: rec.fields[key].displayValue ? rec.fields[key].displayValue : rec.fields[key].value
                    });
                }
                this.relatedListRecords.push({
                    id: rec.id,
                    fields: formattedFields
                });
            });
        } else if (error) {
            console.error(`Error fetching related list records for ${this.relatedListId}: ${JSON.stringify(error)}`);
            this.relatedListRecords = undefined;
            this.relatedListRecordsError = error;
        }
    }

    @wire(getObjectInfo, { 
        objectApiName: '$relatedListObjectApiName' 
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

    recordSelectedHandler(event) {
        // Get attributes of selected record.
        this.selectedRelatedListRecordId = event.currentTarget.getAttribute('data-id');
        
        // Create event payload.
        const selectedRecordEventPayload = {
            recordId: this.selectedRelatedListRecordId,
            objectApiName: this.relatedListObjectApiName
        };

        // Publish the event.
        publish(this.messageContext, recordSelected, selectedRecordEventPayload);
    }

    // Handler for message received by component.
    handleMessage(message) {
        // Remove previous selected records.
        let previouslySelectedRecords = this.template.querySelectorAll('.record');
        previouslySelectedRecords.forEach(psr => psr.classList.remove('selected-record'));
        
        if (this.selectedRelatedListRecordId === message.recordId) {
            // Style selected record.
            this.template.querySelector(`[data-id="${message.recordId}"]`).classList.add('selected-record');
        }
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