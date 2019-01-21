export class RaffleProperties {
    public customFlair: string;
    public skippedPms: string[];
    public slotListFileDownloadUrl: string;
    public latestSessionId: string;

    constructor() {
        this.customFlair = '';
        this.skippedPms = [];
        this.slotListFileDownloadUrl = '';
        this.latestSessionId = '';
    }
}
