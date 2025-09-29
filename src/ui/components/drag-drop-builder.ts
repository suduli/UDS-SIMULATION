/**
 * Drag and Drop Builder Component
 * Handles the interactive message building interface
 */

import { UDSRequest } from '../../core/uds-protocol';
import { UDSConstants } from '../../core/constants';

export interface DroppedService {
  id: string;
  service: number;
  name: string;
  icon: string;
  parameters: { [key: string]: any };
}

export class DragDropBuilder {
  private dropZone: HTMLElement;
  private messageBuilder: HTMLElement;
  private parameterPanel: HTMLElement;
  private parameterForm: HTMLElement;
  private droppedServices: DroppedService[] = [];
  private selectedServiceId: string | null = null;

  // Event callback
  public onMessageBuilt: ((canSend: boolean) => void) | null = null;

  constructor() {
    // Elements will be initialized in initialize()
    this.dropZone = null as any;
    this.messageBuilder = null as any;
    this.parameterPanel = null as any;
    this.parameterForm = null as any;
  }

  public async initialize(): Promise<void> {
    console.log('🎯 Initializing Drag & Drop Builder...');

    // Get DOM elements
    this.dropZone = this.getElement('drop-zone');
    this.messageBuilder = this.getElement('message-builder');
    this.parameterPanel = this.getElement('parameter-panel');
    this.parameterForm = this.getElement('parameter-form');

    // Setup drag and drop events
    this.setupDragAndDrop();

    console.log('✅ Drag & Drop Builder initialized');
  }

  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with ID '${id}' not found`);
    }
    return element;
  }

  private setupDragAndDrop(): void {
    // Drop zone events
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('drag-over');
    });

    this.dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!this.dropZone.contains(e.relatedTarget as Node)) {
        this.dropZone.classList.remove('drag-over');
      }
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('drag-over');
      this.handleDrop(e);
    });

    // Global drag events to handle service tiles
    document.addEventListener('dragstart', (e) => {
      const serviceElement = (e.target as HTMLElement).closest('.service-tile');
      if (serviceElement) {
        this.handleDragStart(e, serviceElement);
      }
    });

    document.addEventListener('dragend', (e) => {
      const serviceElement = (e.target as HTMLElement).closest('.service-tile');
      if (serviceElement) {
        (serviceElement as HTMLElement).classList.remove('dragging');
      }
    });
  }

  private handleDragStart(e: DragEvent, serviceElement: Element): void {
    const htmlElement = serviceElement as HTMLElement;
    htmlElement.classList.add('dragging');
    
    const serviceData = {
      service: parseInt(htmlElement.dataset.service || '0'),
      name: htmlElement.dataset.name || '',
      icon: htmlElement.dataset.icon || ''
    };

    if (e.dataTransfer) {
      e.dataTransfer.setData('application/json', JSON.stringify(serviceData));
      e.dataTransfer.effectAllowed = 'copy';
    }
  }

  private handleDrop(e: DragEvent): void {
    try {
      if (!e.dataTransfer) return;

      const serviceData = JSON.parse(e.dataTransfer.getData('application/json'));
      this.addServiceToBuilder(serviceData);
      
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }

  private addServiceToBuilder(serviceData: any): void {
    const serviceId = `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const droppedService: DroppedService = {
      id: serviceId,
      service: serviceData.service,
      name: serviceData.name,
      icon: serviceData.icon,
      parameters: this.getDefaultParameters(serviceData.service)
    };

    this.droppedServices.push(droppedService);
    this.renderMessageBuilder();
    this.updatePlaceholderVisibility();
    this.notifyMessageBuilt();
  }

  private getDefaultParameters(service: number): { [key: string]: any } {
    switch (service) {
      case UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL:
        return { sessionType: UDSConstants.SESSION_TYPES.DEFAULT_SESSION };

      case UDSConstants.SERVICES.ECU_RESET:
        return { resetType: UDSConstants.RESET_TYPES.HARD_RESET };

      case UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER:
        return { dataIdentifier: '0xF190' }; // VIN

      case UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER:
        return { dataIdentifier: '0xF010', data: '0x01 0x02 0x03' };

      case UDSConstants.SERVICES.READ_DTC_INFORMATION:
        return { subFunction: 0x01, statusMask: 0xFF };

      case UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION:
        return { groupOfDTC: '0xFFFFFF' };

      case UDSConstants.SERVICES.SECURITY_ACCESS:
        return { subFunction: 0x01, securityLevel: 1 };

      case UDSConstants.SERVICES.COMMUNICATION_CONTROL:
        return { 
          subFunction: UDSConstants.COMMUNICATION_CONTROL.ENABLE_RX_AND_TX,
          communicationType: 0x01
        };

      case UDSConstants.SERVICES.ROUTINE_CONTROL:
        return { 
          subFunction: UDSConstants.ROUTINE_CONTROL.START_ROUTINE,
          routineIdentifier: '0x0203',
          data: ''
        };

      case UDSConstants.SERVICES.TESTER_PRESENT:
        return { suppressResponse: false };

      default:
        return {};
    }
  }

  private renderMessageBuilder(): void {
    this.messageBuilder.innerHTML = '';

    this.droppedServices.forEach((service) => {
      const serviceElement = this.createServiceComponent(service);
      this.messageBuilder.appendChild(serviceElement);
    });
  }

  private createServiceComponent(service: DroppedService): HTMLElement {
    const component = document.createElement('div');
    component.className = 'message-component';
    component.dataset.serviceId = service.id;

    component.innerHTML = `
      <div class="component-icon">
        ${service.icon}
      </div>
      <div class="component-info">
        <div class="component-name">${service.name}</div>
        <div class="component-details">0x${service.service.toString(16).padStart(2, '0').toUpperCase()}</div>
      </div>
      <div class="component-actions">
        <button class="btn btn-small component-config-btn" title="Configure">
          ⚙️
        </button>
        <button class="btn btn-small component-remove-btn" title="Remove">
          ✕
        </button>
      </div>
    `;

    // Add event listeners
    const configBtn = component.querySelector('.component-config-btn') as HTMLButtonElement;
    const removeBtn = component.querySelector('.component-remove-btn') as HTMLButtonElement;

    configBtn.addEventListener('click', () => {
      this.selectService(service.id);
    });

    removeBtn.addEventListener('click', () => {
      this.removeService(service.id);
    });

    // Make component clickable for selection
    component.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.component-actions')) {
        this.selectService(service.id);
      }
    });

    return component;
  }

  private selectService(serviceId: string): void {
    // Update visual selection
    const components = this.messageBuilder.querySelectorAll('.message-component');
    components.forEach(comp => comp.classList.remove('selected'));

    const selectedComponent = this.messageBuilder.querySelector(`[data-service-id="${serviceId}"]`) as HTMLElement;
    selectedComponent?.classList.add('selected');

    this.selectedServiceId = serviceId;
    this.showParameterPanel(serviceId);
  }

  private removeService(serviceId: string): void {
    this.droppedServices = this.droppedServices.filter(s => s.id !== serviceId);
    this.renderMessageBuilder();
    this.updatePlaceholderVisibility();
    
    if (this.selectedServiceId === serviceId) {
      this.hideParameterPanel();
      this.selectedServiceId = null;
    }

    this.notifyMessageBuilt();
  }

  private showParameterPanel(serviceId: string): void {
    const service = this.droppedServices.find(s => s.id === serviceId);
    if (!service) return;

    this.parameterForm.innerHTML = this.generateParameterForm(service);
    this.setupParameterFormEvents(service);
  }

  private generateParameterForm(service: DroppedService): string {
    switch (service.service) {
      case UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL:
        return `
          <div class="parameter-group">
            <label for="session-type">Session Type:</label>
            <select id="session-type" name="sessionType">
              <option value="${UDSConstants.SESSION_TYPES.DEFAULT_SESSION}">Default Session (0x01)</option>
              <option value="${UDSConstants.SESSION_TYPES.PROGRAMMING_SESSION}">Programming Session (0x02)</option>
              <option value="${UDSConstants.SESSION_TYPES.EXTENDED_DIAGNOSTIC_SESSION}">Extended Diagnostic Session (0x03)</option>
              <option value="${UDSConstants.SESSION_TYPES.SAFETY_SYSTEM_DIAGNOSTIC_SESSION}">Safety System Diagnostic Session (0x04)</option>
            </select>
          </div>
        `;

      case UDSConstants.SERVICES.ECU_RESET:
        return `
          <div class="parameter-group">
            <label for="reset-type">Reset Type:</label>
            <select id="reset-type" name="resetType">
              <option value="${UDSConstants.RESET_TYPES.HARD_RESET}">Hard Reset (0x01)</option>
              <option value="${UDSConstants.RESET_TYPES.KEY_OFF_ON_RESET}">Key Off On Reset (0x02)</option>
              <option value="${UDSConstants.RESET_TYPES.SOFT_RESET}">Soft Reset (0x03)</option>
            </select>
          </div>
        `;

      case UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER:
        return `
          <div class="parameter-group">
            <label for="data-identifier">Data Identifier:</label>
            <input type="text" id="data-identifier" name="dataIdentifier" value="${service.parameters.dataIdentifier}" placeholder="0xF190" />
            <small>Example: 0xF190 (VIN), 0xF18C (ECU Serial Number)</small>
          </div>
        `;

      case UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER:
        return `
          <div class="parameter-group">
            <label for="data-identifier">Data Identifier:</label>
            <input type="text" id="data-identifier" name="dataIdentifier" value="${service.parameters.dataIdentifier}" placeholder="0xF010" />
          </div>
          <div class="parameter-group">
            <label for="data">Data:</label>
            <input type="text" id="data" name="data" value="${service.parameters.data}" placeholder="0x01 0x02 0x03" />
            <small>Space-separated hex bytes</small>
          </div>
        `;

      case UDSConstants.SERVICES.READ_DTC_INFORMATION:
        return `
          <div class="parameter-group">
            <label for="sub-function">Sub-Function:</label>
            <select id="sub-function" name="subFunction">
              <option value="0x01">Report Number of DTC by Status Mask (0x01)</option>
              <option value="0x02">Report DTC by Status Mask (0x02)</option>
              <option value="0x0A">Report Supported DTC (0x0A)</option>
            </select>
          </div>
          <div class="parameter-group">
            <label for="status-mask">Status Mask:</label>
            <input type="text" id="status-mask" name="statusMask" value="0x${service.parameters.statusMask.toString(16).padStart(2, '0').toUpperCase()}" placeholder="0xFF" />
          </div>
        `;

      case UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION:
        return `
          <div class="parameter-group">
            <label for="group-of-dtc">Group of DTC:</label>
            <input type="text" id="group-of-dtc" name="groupOfDTC" value="${service.parameters.groupOfDTC}" placeholder="0xFFFFFF" />
            <small>0xFFFFFF to clear all DTCs</small>
          </div>
        `;

      case UDSConstants.SERVICES.SECURITY_ACCESS:
        return `
          <div class="parameter-group">
            <label for="sub-function">Sub-Function:</label>
            <select id="sub-function" name="subFunction">
              <option value="0x01">Request Seed - Level 1 (0x01)</option>
              <option value="0x02">Send Key - Level 1 (0x02)</option>
              <option value="0x03">Request Seed - Level 2 (0x03)</option>
              <option value="0x04">Send Key - Level 2 (0x04)</option>
            </select>
          </div>
          <div class="parameter-group" id="key-group" style="display: none;">
            <label for="security-key">Security Key:</label>
            <input type="text" id="security-key" name="securityKey" placeholder="0x01 0x02" />
            <small>Enter key for send key requests</small>
          </div>
        `;

      case UDSConstants.SERVICES.TESTER_PRESENT:
        return `
          <div class="parameter-group">
            <label>
              <input type="checkbox" id="suppress-response" name="suppressResponse" ${service.parameters.suppressResponse ? 'checked' : ''} />
              Suppress Positive Response
            </label>
          </div>
        `;

      default:
        return '<p>No parameters required for this service.</p>';
    }
  }

  private setupParameterFormEvents(service: DroppedService): void {
    const form = this.parameterForm;
    
    // Set current values
    Object.keys(service.parameters).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement | HTMLSelectElement;
      if (input) {
        if (input.type === 'checkbox') {
          (input as HTMLInputElement).checked = service.parameters[key];
        } else {
          input.value = service.parameters[key].toString();
        }
      }
    });

    // Add change listeners
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.updateServiceParameter(service.id, e.target as HTMLInputElement | HTMLSelectElement);
      });
    });

    // Special handling for security access sub-function
    const subFunctionSelect = form.querySelector('#sub-function') as HTMLSelectElement;
    if (subFunctionSelect && service.service === UDSConstants.SERVICES.SECURITY_ACCESS) {
      const keyGroup = form.querySelector('#key-group') as HTMLElement;
      
      const toggleKeyGroup = () => {
        const subFunction = parseInt(subFunctionSelect.value);
        keyGroup.style.display = (subFunction & 0x01) === 0 ? 'block' : 'none';
      };
      
      subFunctionSelect.addEventListener('change', toggleKeyGroup);
      toggleKeyGroup(); // Initial state
    }
  }

  private updateServiceParameter(serviceId: string, input: HTMLInputElement | HTMLSelectElement): void {
    const service = this.droppedServices.find(s => s.id === serviceId);
    if (!service) return;

    const name = input.name;
    let value: any = input.value;

    // Type conversion based on input type and name
    if (input.type === 'checkbox') {
      value = (input as HTMLInputElement).checked;
    } else if (name.includes('Type') || name.includes('Function') || name.includes('Level')) {
      value = parseInt(value);
    } else if (name === 'statusMask') {
      value = parseInt(value.replace(/^0x/i, ''), 16);
    }

    service.parameters[name] = value;
    this.notifyMessageBuilt();
  }

  private hideParameterPanel(): void {
    this.parameterForm.innerHTML = '<p>Select a service to configure parameters</p>';
  }

  private updatePlaceholderVisibility(): void {
    const placeholder = this.dropZone.querySelector('.drop-zone-placeholder') as HTMLElement;
    if (placeholder) {
      placeholder.style.display = this.droppedServices.length > 0 ? 'none' : 'flex';
    }
  }

  private notifyMessageBuilt(): void {
    const canSend = this.droppedServices.length > 0;
    if (this.onMessageBuilt) {
      this.onMessageBuilt(canSend);
    }
  }

  public buildRequest(): UDSRequest | null {
    if (this.droppedServices.length === 0) {
      return null;
    }

    // For now, handle single service (can be extended for multi-service sequences)
    const service = this.droppedServices[0];
    const request: UDSRequest = {
      service: service.service,
      data: this.buildServiceData(service),
      functionalAddress: false,
      suppressResponse: false
    };

    return request;
  }

  private buildServiceData(service: DroppedService): number[] {
    const data: number[] = [];

    switch (service.service) {
      case UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL:
        data.push(service.parameters.sessionType);
        break;

      case UDSConstants.SERVICES.ECU_RESET:
        data.push(service.parameters.resetType);
        break;

      case UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER:
        const did = this.parseHexValue(service.parameters.dataIdentifier);
        data.push((did >> 8) & 0xFF, did & 0xFF);
        break;

      case UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER:
        const writeDid = this.parseHexValue(service.parameters.dataIdentifier);
        data.push((writeDid >> 8) & 0xFF, writeDid & 0xFF);
        data.push(...this.parseByteArray(service.parameters.data));
        break;

      case UDSConstants.SERVICES.READ_DTC_INFORMATION:
        data.push(service.parameters.subFunction);
        if (service.parameters.statusMask !== undefined) {
          data.push(service.parameters.statusMask);
        }
        break;

      case UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION:
        const groupDTC = this.parseHexValue(service.parameters.groupOfDTC);
        data.push((groupDTC >> 16) & 0xFF, (groupDTC >> 8) & 0xFF, groupDTC & 0xFF);
        break;

      case UDSConstants.SERVICES.SECURITY_ACCESS:
        data.push(service.parameters.subFunction);
        if (service.parameters.securityKey && (service.parameters.subFunction & 0x01) === 0) {
          data.push(...this.parseByteArray(service.parameters.securityKey));
        }
        break;

      case UDSConstants.SERVICES.TESTER_PRESENT:
        data.push(service.parameters.suppressResponse ? 0x80 : 0x00);
        break;
    }

    return data;
  }

  private parseHexValue(value: string): number {
    const cleaned = value.replace(/^0x/i, '');
    return parseInt(cleaned, 16);
  }

  private parseByteArray(value: string): number[] {
    return value.split(/\s+/).filter(s => s.length > 0).map(s => {
      const cleaned = s.replace(/^0x/i, '');
      return parseInt(cleaned, 16);
    });
  }

  public clearCanvas(): void {
    this.droppedServices = [];
    this.renderMessageBuilder();
    this.updatePlaceholderVisibility();
    this.hideParameterPanel();
    this.selectedServiceId = null;
    this.notifyMessageBuilt();
  }

  public cleanup(): void {
    this.droppedServices = [];
    this.onMessageBuilt = null;
    console.log('🧹 Drag & Drop Builder cleaned up');
  }
}