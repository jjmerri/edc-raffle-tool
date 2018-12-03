export class RaffleProperties {
    public customFlair: string;
    public skippedPms: string[];
    public slotListFileDownloadUrl: string;

    RaffleProperties() {
        this.customFlair = '';
        this.skippedPms = [];
        this.slotListFileDownloadUrl = '';
    }
}
