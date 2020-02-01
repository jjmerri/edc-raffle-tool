export class RaffleProperties {
  public customFlair: string;
  public skippedPms: string[];
  public slotListFileDownloadUrl: string;
  public latestSessionId: string;
  public willSendParticipantPm: boolean;
  public auditChecked: boolean;
  public audited: boolean;
  public inOrderMode: boolean;
  public lastUpdated: Date;

  constructor() {
    this.customFlair = '';
    this.skippedPms = [];
    this.slotListFileDownloadUrl = '';
    this.latestSessionId = '';
    this.willSendParticipantPm = true;
    this.auditChecked = false;
    this.audited = false;
    this.inOrderMode = false;
    this.lastUpdated;
  }
}
