import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SplitPane } from "./SplitPane";

// jsdom does not implement offsetWidth — mock it to return 1000px so that
// MIN_PX (120) / 1000 * 100 = 12% is the effective minimum percentage.
const CONTAINER_WIDTH = 1000;
const MIN_PCT = (120 / CONTAINER_WIDTH) * 100; // 12
const NUDGE_PCT = (10 / CONTAINER_WIDTH) * 100; // 1
const STORAGE_KEY = "json-beautifier:panel-ratio";

// ── localStorage in-memory mock ───────────────────────────────────────────────

let store: Record<string, string> = {};

beforeEach(() => {
  store = {};
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(
    (key) => store[key] ?? null,
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
    store[key] = String(value);
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
    delete store[key];
  });

  // Make every element report offsetWidth = 1000 so percentage maths work.
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(
    CONTAINER_WIDTH,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSplitPane() {
  return render(<SplitPane left={<div>LEFT</div>} right={<div>RIGHT</div>} />);
}

function getHandle() {
  return screen.getByRole("separator");
}

// ── localStorage persistence ──────────────────────────────────────────────────

describe("localStorage persistence", () => {
  it("uses default 50% when no entry is stored", () => {
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("aria-valuenow", "50");
  });

  it("reads stored ratio from localStorage on mount without layout jump", () => {
    store[STORAGE_KEY] = "65";
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("aria-valuenow", "65");
  });

  it("falls back to 50% when stored value is NaN", () => {
    store[STORAGE_KEY] = "not-a-number";
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("aria-valuenow", "50");
  });

  it("falls back to 50% when stored value is greater than 80", () => {
    store[STORAGE_KEY] = "85";
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("aria-valuenow", "50");
  });

  it("falls back to 50% when stored value is zero", () => {
    store[STORAGE_KEY] = "0";
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("aria-valuenow", "50");
  });

  it("falls back to 50% when stored value is negative", () => {
    store[STORAGE_KEY] = "-10";
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("aria-valuenow", "50");
  });

  it("writes to localStorage after a double-click collapse", () => {
    renderSplitPane();
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    expect(store[STORAGE_KEY]).toBeDefined();
    const saved = parseFloat(store[STORAGE_KEY]);
    expect(saved).toBeCloseTo(MIN_PCT, 0);
  });
});

// ── Double-click collapse / restore ──────────────────────────────────────────

describe("double-click collapse / restore", () => {
  it("collapses left pane to MIN_PCT on first double-click", () => {
    renderSplitPane();
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    const valuenow = parseInt(getHandle().getAttribute("aria-valuenow") ?? "0");
    expect(valuenow).toBeLessThanOrEqual(Math.ceil(MIN_PCT) + 1);
  });

  it("restores previous ratio on second double-click when collapsed", () => {
    renderSplitPane(); // starts at 50%
    act(() => {
      fireEvent.doubleClick(getHandle()); // collapse
    });
    act(() => {
      fireEvent.doubleClick(getHandle()); // restore
    });
    expect(getHandle()).toHaveAttribute("aria-valuenow", "50");
  });

  it("adds split-handle--collapsed class when collapsed", () => {
    renderSplitPane();
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    expect(getHandle().classList.contains("split-handle--collapsed")).toBe(
      true,
    );
  });

  it("removes split-handle--collapsed class after restore", () => {
    renderSplitPane();
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    expect(getHandle().classList.contains("split-handle--collapsed")).toBe(
      false,
    );
  });

  it("shows split-handle__restore element when collapsed", () => {
    renderSplitPane();
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    expect(
      getHandle().querySelector(".split-handle__restore"),
    ).toBeInTheDocument();
  });

  it("hides split-handle__restore element when not collapsed", () => {
    renderSplitPane();
    // Not collapsed yet — restore element should be absent.
    expect(
      getHandle().querySelector(".split-handle__restore"),
    ).not.toBeInTheDocument();
  });

  it("hides split-handle__restore element after restoring", () => {
    renderSplitPane();
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    expect(
      getHandle().querySelector(".split-handle__restore"),
    ).not.toBeInTheDocument();
  });
});

// ── 3-dot indicator ───────────────────────────────────────────────────────────

describe("3-dot indicator", () => {
  it("always renders .split-handle__dots child", () => {
    renderSplitPane();
    expect(
      getHandle().querySelector(".split-handle__dots"),
    ).toBeInTheDocument();
  });

  it("keeps .split-handle__dots when collapsed", () => {
    renderSplitPane();
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    expect(
      getHandle().querySelector(".split-handle__dots"),
    ).toBeInTheDocument();
  });
});

// ── Keyboard nudge (Alt+Arrow) ────────────────────────────────────────────────

describe("keyboard nudge", () => {
  it("Alt+ArrowRight widens left pane by ~1% and persists", () => {
    renderSplitPane(); // starts at 50%
    act(() => {
      fireEvent.keyDown(getHandle(), { key: "ArrowRight", altKey: true });
    });
    const valuenow = parseInt(getHandle().getAttribute("aria-valuenow") ?? "0");
    expect(valuenow).toBeCloseTo(50 + NUDGE_PCT, 0);
    const saved = parseFloat(store[STORAGE_KEY] ?? "0");
    expect(saved).toBeCloseTo(50 + NUDGE_PCT, 0);
  });

  it("Alt+ArrowLeft shrinks left pane and persists", () => {
    renderSplitPane(); // starts at 50%
    act(() => {
      fireEvent.keyDown(getHandle(), { key: "ArrowLeft", altKey: true });
    });
    const valuenow = parseInt(getHandle().getAttribute("aria-valuenow") ?? "0");
    expect(valuenow).toBeCloseTo(50 - NUDGE_PCT, 0);
    const saved = parseFloat(store[STORAGE_KEY] ?? "0");
    expect(saved).toBeCloseTo(50 - NUDGE_PCT, 0);
  });

  it("plain ArrowRight (no Alt) does NOT change pane width", () => {
    renderSplitPane();
    act(() => {
      fireEvent.keyDown(getHandle(), { key: "ArrowRight", altKey: false });
    });
    expect(getHandle()).toHaveAttribute("aria-valuenow", "50");
    // localStorage should not have been written.
    expect(store[STORAGE_KEY]).toBeUndefined();
  });

  it("Alt+ArrowRight clamps to MAX_PCT (80%) and does not exceed it", () => {
    store[STORAGE_KEY] = "79.5";
    renderSplitPane(); // starts near max
    act(() => {
      fireEvent.keyDown(getHandle(), { key: "ArrowRight", altKey: true });
    });
    const valuenow = parseInt(getHandle().getAttribute("aria-valuenow") ?? "0");
    expect(valuenow).toBeLessThanOrEqual(80);
  });

  it("Alt+ArrowLeft clamps to MIN_PCT and does not go below it", () => {
    store[STORAGE_KEY] = String(MIN_PCT + 0.5);
    renderSplitPane(); // starts just above minimum
    act(() => {
      fireEvent.keyDown(getHandle(), { key: "ArrowLeft", altKey: true });
    });
    const valuenow = parseFloat(
      getHandle().getAttribute("aria-valuenow") ?? "0",
    );
    expect(valuenow).toBeGreaterThanOrEqual(Math.floor(MIN_PCT) - 1);
  });
});

// ── aria attributes ───────────────────────────────────────────────────────────

describe("aria attributes", () => {
  it("has role=separator", () => {
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("role", "separator");
  });

  it("has aria-orientation=vertical", () => {
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("aria-orientation", "vertical");
  });

  it("aria-valuenow reflects the rounded left percentage", () => {
    store[STORAGE_KEY] = "63.7";
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("aria-valuenow", "64");
  });

  it("aria-valuenow updates to MIN_PCT after collapse", () => {
    renderSplitPane();
    act(() => {
      fireEvent.doubleClick(getHandle());
    });
    const valuenow = parseInt(getHandle().getAttribute("aria-valuenow") ?? "0");
    expect(valuenow).toBeLessThanOrEqual(Math.ceil(MIN_PCT) + 1);
  });

  it("has aria-valuemin=0 and aria-valuemax=100", () => {
    renderSplitPane();
    expect(getHandle()).toHaveAttribute("aria-valuemin", "0");
    expect(getHandle()).toHaveAttribute("aria-valuemax", "100");
  });
});
