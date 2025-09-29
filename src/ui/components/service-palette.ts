/**
 * Service Palette Component
 * Displays available UDS services as draggable tiles
 */

export interface ServiceInfo {
  service: number;
  info: {
    name: string;
    description: string;
    icon: string;
    category: string;
    securityRequired: boolean;
  };
}

export class ServicePalette {
  private container: HTMLElement;
  private services: ServiceInfo[] = [];

  constructor() {
    this.container = null as any;
  }

  public async initialize(): Promise<void> {
    console.log('🎨 Initializing Service Palette...');

    this.container = this.getElement('service-categories');

    console.log('✅ Service Palette initialized');
  }

  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with ID '${id}' not found`);
    }
    return element;
  }

  public populateServices(services: ServiceInfo[]): void {
    this.services = services;
    this.renderServices();
  }

  private renderServices(): void {
    this.container.innerHTML = '';

    this.services.forEach(serviceInfo => {
      const tile = this.createServiceTile(serviceInfo);
      this.container.appendChild(tile);
    });
  }

  private createServiceTile(serviceInfo: ServiceInfo): HTMLElement {
    const tile = document.createElement('div');
    tile.className = 'service-tile';
    tile.draggable = true;
    
    // Set data attributes for drag & drop
    tile.dataset.service = serviceInfo.service.toString();
    tile.dataset.name = serviceInfo.info.name;
    tile.dataset.icon = serviceInfo.info.icon;

    tile.innerHTML = `
      <div class="service-icon">
        ${serviceInfo.info.icon}
      </div>
      <div class="service-info">
        <div class="service-name">${serviceInfo.info.name}</div>
        <div class="service-code">0x${serviceInfo.service.toString(16).padStart(2, '0').toUpperCase()}</div>
      </div>
      ${serviceInfo.info.securityRequired ? '<div class="security-badge" title="Security Access Required">🔐</div>' : ''}
    `;

    // Add tooltip with description
    tile.title = serviceInfo.info.description;

    return tile;
  }

  public filterServices(searchTerm: string): void {
    const normalizedSearch = searchTerm.toLowerCase();
    
    const tiles = this.container.querySelectorAll('.service-tile');
    tiles.forEach(tile => {
      const element = tile as HTMLElement;
      const name = element.dataset.name?.toLowerCase() || '';
      const service = element.dataset.service || '';
      const hexCode = `0x${parseInt(service).toString(16)}`.toLowerCase();
      
      const matches = name.includes(normalizedSearch) || 
                     hexCode.includes(normalizedSearch) ||
                     service.includes(normalizedSearch);
      
      element.style.display = matches ? 'flex' : 'none';
    });
  }

  public cleanup(): void {
    this.services = [];
    console.log('🧹 Service Palette cleaned up');
  }
}