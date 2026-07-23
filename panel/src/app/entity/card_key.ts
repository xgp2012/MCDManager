import { v4 } from "uuid";

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
  duration: number; // Instance validity in days
  maxUsage: number; // Max times this key can be used
  usedCount: number; // How many times it's been used
  createdBy: string; // Admin UUID who created it
  createdAt: string;
  isActive: boolean;
  expiredAt: string; // When the card key itself expires (not the instance)
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
    startCommand: "",
    memoryLimit: 0,
    diskLimit: 0,
    cpuLimit: 0,
    instanceName: "My Server"
  };
  duration: number = 30;
  maxUsage: number = 1;
  usedCount: number = 0;
  createdBy: string = "";
  createdAt: string = "";
  isActive: boolean = true;
  expiredAt: string = "";
  remarks: string = "";
}