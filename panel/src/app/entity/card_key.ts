
export interface ICardKeyConfig {
  // Instance type
  processType: "general" | "docker";
  instanceType: string; // "universal" | "minecraft/java" | "minecraft/bedrock"

  // Docker configuration (if applicable)
  dockerImage: string;
  dockerMemory: number; // MB
  dockerCpuUsage: number; // Percentage (e.g., 100 = 1 core)
  dockerMaxSpace: number; // GB
  dockerPorts: Array<{ containerPort: number; protocol: string }>;

  // Bandwidth limits (KB/s, 0 = unlimited)
  uploadSpeedLimit: number;
  downloadSpeedLimit: number;

  // General configuration
  startCommand: string;

  // Resource limits
  memoryLimit: number; // MB
  diskLimit: number; // GB
  cpuLimit: number; // Percentage

  // Instance metadata
  instanceName: string; // Default instance name
}

export interface ICardKey {
  uuid: string;
  code: string; // The redeem code (e.g., "MCDM-XXXX-XXXX")
  name: string; // Display name for this card key type
  config: ICardKeyConfig;
  duration: number; // Instance validity in days (admin-customizable)
  usedCount: number; // How many times it's been used (max 1)
  createdBy: string; // Admin UUID who created it
  createdAt: string;
  isActive: boolean; // Manually deactivated by admin
  expiredAt: string; // Optional: when the card key itself expires (empty = never expires)
  remarks: string; // Admin notes
}

export class CardKey implements ICardKey {
  uuid: string = "";
  code: string = "";
  name: string = "";
  config: ICardKeyConfig = {
    processType: "general",
    instanceType: "universal",
    dockerImage: "",
    dockerMemory: 0,
    dockerCpuUsage: 0,
    dockerMaxSpace: 0,
    dockerPorts: [],
    uploadSpeedLimit: 0,
    downloadSpeedLimit: 0,
    startCommand: "",
    memoryLimit: 0,
    diskLimit: 0,
    cpuLimit: 0,
    instanceName: "My Server"
  };
  duration: number = 30;
  usedCount: number = 0;
  createdBy: string = "";
  createdAt: string = "";
  isActive: boolean = true;
  expiredAt: string = "";
  remarks: string = "";
}