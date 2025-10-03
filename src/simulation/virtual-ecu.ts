// Virtual ECU simulation engine
export interface VirtualEcuProfile {
  id: string;
  label: string;
  supportedSessions: string[];
  dtcCatalog: DtcEntry[];
  dataIdentifiers: DataIdentifier[];
  timingProfile: 'fast' | 'nominal' | 'extended';
  defaultSecurityLevel: 'default' | 'supplier' | 'oem';
  capabilities: {
    routineControl: boolean;
    fileTransfer: boolean;
    periodicId: boolean;
  };
}

export interface DtcEntry {
  code: string;
  statusMask: string;
  description: string;
}

export interface DataIdentifier {
  id: number;
  label: string;
  length: number;
  format: 'numeric' | 'ascii' | 'binary';
}

export class VirtualECU {
  constructor(private profile: VirtualEcuProfile) {}

  async processRequest(request: Uint8Array): Promise<Uint8Array> {
    // Simulate processing delay based on timing profile
    const delay = this.getDelay();
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });

    // Echo positive response
    return new Uint8Array([request[0] + 0x40, ...request.slice(1)]);
  }

  private getDelay(): number {
    const delays = { fast: 50, nominal: 100, extended: 200 };
    return delays[this.profile.timingProfile];
  }
}
