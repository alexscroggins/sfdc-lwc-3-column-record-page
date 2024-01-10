import { LightningElement, api, track, wire } from 'lwc';
import { getRelatedListsInfo } from 'lightning/uiRelatedListApi';

export default class RelatedLists extends LightningElement {

    // Make the component aware of its object context.
    @api objectApiName;

    // Make the component aware of its record context.
    @api recordId;

    // Fields.
    error;
    @track relatedLists;

    // These related lists are currently not supported by lightning/uiRelatedListApi and therefore this component. Sorry!
    unsupportedRelatedLists = ['Open Activities', 'Activity History', 'Notes & Attachments', 'Partners'];

    @wire(getRelatedListsInfo, {
        parentObjectApiName: '$objectApiName'
    })listInfo({error, data}) {
        if (data) {
            this.relatedLists = data.relatedLists.filter(rl => !this.unsupportedRelatedLists.includes(rl.label));
            this.error = undefined;
        } else if (error) {
            console.error(error);
            this.error = error;
            this.relatedLists = undefined;
        }
    }

}