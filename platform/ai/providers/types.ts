// Hợp đồng giữa `platform/ai/ask.ts` và từng nhà cung cấp AI (spine AD-10). Module nghiệp vụ không dùng file này.

export type PromptProfile = "fast" | "quality";

export type ProviderRequest = {
  system: string;
  user: string;
  // JSON Schema của kết quả (sinh từ Zod); nhà cung cấp trả JSON đúng schema này.
  jsonSchema: Record<string, unknown>;
  profile: PromptProfile;
  // URL ảnh đã qua `isAllowedImageUrl`; rỗng khi nhà không đọc ảnh hoặc không có ảnh.
  images: string[];
  webSearch: boolean;
  // Thời gian còn lại của hạn 90 giây (AD-18), tính bằng mili giây.
  timeoutMs: number;
};

export type ProviderResult = {
  json: unknown;
  // Số ảnh nhà cung cấp thật sự đưa được cho model (tải được, đúng loại); 0 khi có ảnh → `skipped` có `images`.
  imagesUsed: number;
};

export type ProviderCapabilities = { images: boolean; webSearch: boolean; video: boolean };

export interface AiProvider {
  name: string;
  supports: ProviderCapabilities;
  generate(req: ProviderRequest): Promise<ProviderResult>;
}

// Lý do lỗi quyết định thời gian nhà cung cấp bị tạm bỏ qua (cooldown, NFR-2).
export type ProviderFailure = "quota" | "timeout" | "unavailable";

export class ProviderError extends Error {
  constructor(
    readonly reason: ProviderFailure,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
