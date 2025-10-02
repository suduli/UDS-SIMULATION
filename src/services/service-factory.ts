/**
 * Service Factory - Creates and registers all UDS services
 */

import { VirtualECU } from '../simulation/virtual-ecu';
import { SessionControlService } from './session-control';
import { ECUResetService } from './ecu-reset';
import { ClearDTCService } from './clear-dtc';
import { ReadDTCService } from './read-dtc';
import { ReadDataByIdentifierService } from './read-data';
import { WriteDataByIdentifierService } from './write-data';
import { SecurityAccessService } from './security-access';
import { TesterPresentService } from './tester-present';
import { RoutineControlService } from './routine-control';
import { ControlDTCSettingService } from './control-dtc';

export class ServiceFactory {
  static registerAllServices(ecu: VirtualECU): void {
    const config = ecu.getConfig();

    // Register all implemented services
    ecu.registerService(new SessionControlService());
    ecu.registerService(new ECUResetService());
    ecu.registerService(new ClearDTCService());
    ecu.registerService(new ReadDTCService(config.dtcRecords));
    ecu.registerService(new ReadDataByIdentifierService(config.dataIdentifiers));
    ecu.registerService(new WriteDataByIdentifierService(config.dataIdentifiers));
    ecu.registerService(new SecurityAccessService());
    ecu.registerService(new TesterPresentService());
    ecu.registerService(new RoutineControlService());
    ecu.registerService(new ControlDTCSettingService());
  }
}
