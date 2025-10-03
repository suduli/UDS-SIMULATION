// ISO-TP transport layer simulator
export interface ISOTPConfig {
  blockSize: number;
  separationTime: number;
  frameDelay: number;
}

export class ISOTPSimulator {
  private config: ISOTPConfig;

  constructor(config?: Partial<ISOTPConfig>) {
    this.config = {
      blockSize: 8,
      separationTime: 10,
      frameDelay: 10,
      ...config,
    };
  }

  async send(data: Uint8Array): Promise<Uint8Array> {
    // Simulate frame segmentation and transmission
    await this.delay(this.config.frameDelay);
    return data; // Echo for simulation
  }

  // eslint-disable-next-line class-methods-use-this
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
