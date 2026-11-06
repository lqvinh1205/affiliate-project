import "server-only";
import {
  ProviderError,
  type AiProvider,
  type ProviderCapabilities,
  type ProviderRequest,
} from "@/platform/ai/providers/types";

// Nhà cung cấp giả lập cho test (spine AD-16: suite không gọi AI thật). Bật bằng `AI_PROVIDERS=fake`
// (hai nhà `fake,fake-2` để thử chuyển nhà). Test đặt câu trả lời qua `fakeAi.reply(...)`; handler ném lỗi
// (vd `new ProviderError("quota", …)`) để giả lập nhà lỗi.

type FakeHandler = (req: ProviderRequest) => unknown;

type FakeState = { handler: FakeHandler | null; supports: ProviderCapabilities; calls: ProviderRequest[] };

const FULL: ProviderCapabilities = { images: true, webSearch: true, video: false };
const states = new Map<string, FakeState>();

function state(name: string) {
  let s = states.get(name);
  if (!s) {
    s = { handler: null, supports: { ...FULL }, calls: [] };
    states.set(name, s);
  }
  return s;
}

export const fakeAi = {
  reply(handler: FakeHandler, name = "fake") {
    state(name).handler = handler;
  },
  supports(caps: Partial<ProviderCapabilities>, name = "fake") {
    Object.assign(state(name).supports, caps);
  },
  calls(name = "fake") {
    return state(name).calls;
  },
  reset() {
    states.clear();
  },
};

function fakeProvider(name: string): AiProvider {
  return {
    name,
    get supports() {
      return state(name).supports;
    },
    async generate(req) {
      const s = state(name);
      s.calls.push(req);
      if (!s.handler) throw new ProviderError("unavailable", `${name}: chưa đặt câu trả lời giả lập`);
      return { json: await s.handler(req), imagesUsed: req.images.length };
    },
  };
}

export const fakeProviders = { fake: fakeProvider("fake"), "fake-2": fakeProvider("fake-2") };
