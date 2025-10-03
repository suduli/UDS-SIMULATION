// DoIP transport layer simulator
export interface DoIPConfig {
  targetAddress: number;
  sourceAddress: number;
  frameDelay: number;
}

export class DoIPSimulator {
  private config: DoIPConfig;

  constructor(config?: Partial<DoIPConfig>) {
    this.config = {
      targetAddress: 0x0e80,
      sourceAddress: 0x0e00,
      frameDelay: 2,
      ...config,
    };
  }

  async send(data: Uint8Array): Promise<Uint8Array> {
    // Simulate DoIP framing and transmission
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
