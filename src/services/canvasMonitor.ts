import { Peer, type MediaConnection } from "peerjs";
import { reactive } from "vue";

export interface MonitorStatus {
  isConnected: boolean;
  isPlaying: boolean;
  connectionId: string | null;
  designToolPeerId: string | null;
  error: string | null;
}

export interface MonitorConfig {
  autoReconnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onStatusChange?: (status: MonitorStatus) => void;
}

class PageMonitorService {
  private peer: Peer | null = null;
  private currentCall: MediaConnection | null = null;
  private remoteStream: MediaStream | null = null;
  private localOfferStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;
  private manuallyStopping = false;

  public status = reactive<MonitorStatus>({
    isConnected: false,
    isPlaying: false,
    connectionId: null,
    designToolPeerId: null,
    error: null,
  });

  initPeer(): Promise<string> {
    if (this.peer && !this.peer.destroyed && this.peer.open && this.peer.id) {
      return Promise.resolve(this.peer.id);
    }

    return new Promise((resolve, reject) => {
      if (this.peer && !this.peer.destroyed) {
        this.peer.once("open", resolve);
        this.peer.once("error", reject);
        return;
      }

      const peerConfig = resolvePeerjsConfig();
      this.peer = new Peer(undefined, {
        debug: 1,
        host: peerConfig.host,
        port: peerConfig.port,
        path: peerConfig.path,
        secure: peerConfig.secure,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
      });

      this.peer.on("open", (id) => {
        console.log("[PageMonitor] Admin peer initialized:", id);
        this.status.connectionId = id;
        resolve(id);
      });

      this.peer.on("error", (err) => {
        console.error("[PageMonitor] Peer error:", err);
        this.status.error = err.message;
        reject(err);
      });

      this.peer.on("disconnected", () => {
        console.log("[PageMonitor] Peer disconnected");
        this.status.isConnected = false;
        this.status.isPlaying = false;
        this.clearRetryTimer();
      });
    });
  }

  async connectToDesignTool(
    designToolPeerId: string,
    videoElement: HTMLVideoElement,
    config: MonitorConfig = {},
  ): Promise<void> {
    this.videoElement = videoElement;
    this.status.designToolPeerId = designToolPeerId;
    this.status.error = null;
    this.manuallyStopping = false;
    this.notify(config);

    if (!this.peer || this.peer.destroyed) {
      await this.initPeer();
    }

    return new Promise<void>((resolve, reject) => {
      const localStream = this.createLocalOfferStream();
      const call = this.peer!.call(designToolPeerId, localStream, {
        metadata: { mode: "page-monitor", requestedAt: new Date().toISOString() },
      });
      this.currentCall = call;

      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        this.clearConnectTimeout();
        error ? reject(error) : resolve();
      };

      call.on("stream", (remoteStream: MediaStream) => {
        console.log("[PageMonitor] Received page stream");
        this.remoteStream = remoteStream;
        this.attachStreamToVideo(remoteStream);
        this.status.isConnected = true;
        this.status.isPlaying = true;
        this.status.error = null;
        this.retryCount = 0;
        this.notify(config);
        finish();
      });

      call.on("close", () => {
        const wasConnected = this.status.isConnected;
        this.handleCallClose(wasConnected ? config : { ...config, autoReconnect: false });
        if (!wasConnected) {
          finish(new Error("页面监控连接已关闭"));
        }
      });

      call.on("error", (err: Error) => {
        const message = err?.message || "页面监控连接失败";
        console.error("[PageMonitor] Call error:", err);
        this.status.error = message;
        this.handleCallClose({ ...config, autoReconnect: false });
        this.notify(config);
        finish(new Error(message));
      });

      this.connectTimeout = setTimeout(() => {
        if (this.status.isConnected) return;
        const error = new Error("页面监控连接超时");
        this.status.error = error.message;
        this.handleCallClose({ ...config, autoReconnect: false });
        this.notify(config);
        finish(error);
      }, 12_000);
    });
  }

  stopMonitoring(): void {
    this.manuallyStopping = true;
    this.closeCurrentCall();
    this.clearConnectTimeout();
    this.clearRetryTimer();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.resetStreamsAndVideo();
    this.status.isConnected = false;
    this.status.isPlaying = false;
    this.status.connectionId = null;
    this.status.designToolPeerId = null;
    this.status.error = null;
    this.retryCount = 0;
    this.manuallyStopping = false;

    console.log("[PageMonitor] Monitoring stopped");
  }

  getStatus(): MonitorStatus {
    return { ...this.status };
  }

  isActive(): boolean {
    return this.status.isConnected && this.status.isPlaying;
  }

  togglePlay(): void {
    if (!this.videoElement) return;
    if (this.videoElement.paused) {
      void this.videoElement.play();
      this.status.isPlaying = true;
    } else {
      this.videoElement.pause();
      this.status.isPlaying = false;
    }
  }

  setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
    if (this.remoteStream) {
      this.attachStreamToVideo(this.remoteStream);
    }
  }

  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.currentCall) return null;
    try {
      return await this.currentCall.peerConnection.getStats();
    } catch (error) {
      console.error("[PageMonitor] Failed to get stats:", error);
      return null;
    }
  }

  private attachStreamToVideo(stream: MediaStream): void {
    if (!this.videoElement) return;

    this.videoElement.srcObject = stream;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;
    this.videoElement.play().catch((err) => {
      this.status.error = `播放页面流失败: ${err.message}`;
    });
  }

  private createLocalOfferStream(): MediaStream {
    if (this.localOfferStream) return this.localOfferStream;

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 1, 1);
    }

    this.localOfferStream = canvas.captureStream(1);
    return this.localOfferStream;
  }

  private handleCallClose(config: MonitorConfig): void {
    this.currentCall = null;
    this.resetStreamsAndVideo();
    this.status.isConnected = false;
    this.status.isPlaying = false;
    this.notify(config);

    if (this.manuallyStopping || !config.autoReconnect || !this.status.designToolPeerId) {
      return;
    }

    const maxRetries = config.maxRetries ?? 3;
    const retryDelay = config.retryDelay ?? 3000;
    if (this.retryCount >= maxRetries) {
      this.status.error = "页面监控重连次数已用完";
      this.notify(config);
      return;
    }

    this.retryCount += 1;
    this.retryTimer = setTimeout(() => {
      if (!this.videoElement || !this.status.designToolPeerId) return;
      void this.connectToDesignTool(this.status.designToolPeerId, this.videoElement, config);
    }, retryDelay);
  }

  private closeCurrentCall(): void {
    if (!this.currentCall) return;
    this.currentCall.close();
    this.currentCall = null;
  }

  private resetStreamsAndVideo(): void {
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    if (this.localOfferStream) {
      this.localOfferStream.getTracks().forEach((track) => track.stop());
      this.localOfferStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  private clearConnectTimeout(): void {
    if (!this.connectTimeout) return;
    clearTimeout(this.connectTimeout);
    this.connectTimeout = null;
  }

  private clearRetryTimer(): void {
    if (!this.retryTimer) return;
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private notify(config: MonitorConfig): void {
    config.onStatusChange?.(this.getStatus());
  }
}

function resolvePeerjsConfig() {
  const explicitHost = import.meta.env.VITE_PEERJS_HOST;
  if (explicitHost) {
    const explicitConfig = parsePeerjsUrl(explicitHost);
    if (explicitConfig) return explicitConfig;
  }

  const candidates = [
    import.meta.env.VITE_BASE_URL,
    import.meta.env.VITE_API_URL,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const peerConfig = parsePeerjsUrl(candidate);
    if (peerConfig) return peerConfig;
  }

  const { protocol, hostname } = window.location;
  return {
    host: hostname,
    port: protocol === "https:" ? 443 : 80,
    path: "/",
    secure: protocol === "https:",
  };
}

function parsePeerjsUrl(rawUrl: string) {
  const value = String(rawUrl || "").trim();
  if (!value || !/^https?:\/\//i.test(value)) return null;

  try {
    const url = new URL(value);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80,
      path: "/",
      secure: url.protocol === "https:",
    };
  } catch {
    return null;
  }
}

export const canvasMonitorService = new PageMonitorService();
