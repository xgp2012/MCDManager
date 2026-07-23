export interface IImageTemplate {
  uuid: string;
  name: string;
  description: string;
  type: "docker" | "preset";
  imageUrl: string;
  icon: string;
  category: string;

  defaultConfig: {
    processType: "general" | "docker";
    instanceType: string;
    startCommand: string;
    docker: {
      image: string;
      memory: number;
      cpuUsage: number;
      maxSpace: number;
      ports: Array<{ containerPort: number; protocol: string }>;
      env: string[];
    };
  };

  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  createdBy: string;
}

export class ImageTemplate implements IImageTemplate {
  uuid: string = "";
  name: string = "";
  description: string = "";
  type: "docker" | "preset" = "docker";
  imageUrl: string = "";
  icon: string = "";
  category: string = "通用";
  defaultConfig = {
    processType: "docker" as const,
    instanceType: "universal",
    startCommand: "",
    docker: {
      image: "",
      memory: 1024,
      cpuUsage: 100,
      maxSpace: 10,
      ports: [] as Array<{ containerPort: number; protocol: string }>,
      env: [] as string[]
    }
  };
  isActive: boolean = true;
  sortOrder: number = 0;
  createdAt: string = "";
  createdBy: string = "";
}