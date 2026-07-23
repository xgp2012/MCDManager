import { $t } from "../i18n";
import { logger } from "./log";
import RemoteServiceSubsystem from "./remote_service";
import RemoteRequest from "./remote_command";
import userSystem from "./user_service";
import { schedule } from "node-schedule";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

class InstanceExpirationService {
  private checkJob: any = null;

  start() {
    // Check every hour
    this.checkJob = schedule.scheduleJob("0 * * * *", () => {
      this.checkExpiredInstances();
    });
    logger.info($t("TXT_CODE_expiration.serviceStarted"));
  }

  stop() {
    if (this.checkJob) {
      this.checkJob.cancel();
      this.checkJob = null;
    }
  }

  private async checkExpiredInstances() {
    const now = Date.now();

    for (const [uuid, user] of userSystem.objects) {
      if (!user.instances || user.instances.length === 0) continue;

      for (const instanceRef of user.instances) {
        try {
          const remoteService = RemoteServiceSubsystem.getInstance(instanceRef.daemonId);
          if (!remoteService || !remoteService.available) continue;

          // Get instance detail from daemon
          const instanceDetail = await new RemoteRequest(remoteService).request("instance/detail", {
            instanceUuid: instanceRef.instanceUuid
          });

          if (!instanceDetail || !instanceDetail.config) continue;

          const endTime = instanceDetail.config.endTime;
          if (!endTime || endTime <= 0) continue;

          const timeUntilExpiry = endTime - now;

          if (timeUntilExpiry <= 0) {
            // Instance is expired
            // Check if it's past the grace period (3 days)
            if (now - endTime > THREE_DAYS_MS) {
              // Grace period passed, delete instance
              await new RemoteRequest(remoteService).request("instance/delete", {
                instanceUuids: [instanceRef.instanceUuid],
                deleteFile: true
              });
              logger.info($t("TXT_CODE_expiration.deleted", { uuid: instanceRef.instanceUuid }));
            } else {
              // Within grace period, ensure instance is stopped
              if (instanceDetail.status === 3) {
                // RUNNING
                await new RemoteRequest(remoteService).request("instance/stop", {
                  instanceUuids: [instanceRef.instanceUuid]
                });
                logger.info($t("TXT_CODE_expiration.stopped", { uuid: instanceRef.instanceUuid }));
              }
            }
          } else if (timeUntilExpiry <= THREE_DAYS_MS && timeUntilExpiry > 0) {
            // Less than 3 days remaining - log warning
            logger.info(
              $t("TXT_CODE_expiration.expiringSoon", {
                uuid: instanceRef.instanceUuid,
                days: Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000))
              })
            );
          }
        } catch (err) {
          // Ignore errors for individual instances
          continue;
        }
      }
    }
  }

  // Get expiration info for a specific instance
  async getExpirationInfo(
    daemonId: string,
    instanceUuid: string
  ): Promise<{
    endTime: number;
    isExpired: boolean;
    daysUntilExpiry: number;
    isInGracePeriod: boolean;
    gracePeriodEnd: number;
  } | null> {
    try {
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      if (!remoteService || !remoteService.available) return null;

      const instanceDetail = await new RemoteRequest(remoteService).request("instance/detail", {
        instanceUuid
      });

      if (!instanceDetail || !instanceDetail.config) return null;

      const endTime = instanceDetail.config.endTime;
      if (!endTime || endTime <= 0) return null;

      const now = Date.now();
      const isExpired = now >= endTime;
      const daysUntilExpiry = Math.ceil((endTime - now) / (24 * 60 * 60 * 1000));
      const isInGracePeriod = isExpired && now - endTime <= THREE_DAYS_MS;

      return {
        endTime,
        isExpired,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        isInGracePeriod,
        gracePeriodEnd: endTime + THREE_DAYS_MS
      };
    } catch {
      return null;
    }
  }
}

export default new InstanceExpirationService();