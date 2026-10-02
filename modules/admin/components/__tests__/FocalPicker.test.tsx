import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FocalPicker } from "../FocalPicker";

// jsdom lacks PointerEvent; MouseEvent carries clientX/clientY the same way.
if (!("PointerEvent" in window)) Object.assign(window, { PointerEvent: MouseEvent });

const focal = { desktop: "50% 50%", mobile: "50% 50%" };

function setup() {
  const onChange = vi.fn();
  render(<FocalPicker publicId="portfolio/a" label="Hero" focal={focal} onChange={onChange} />);
  const slider = screen.getByRole("slider");
  slider.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;
  slider.setPointerCapture = vi.fn();
  return { onChange, slider };
}

describe("FocalPicker", () => {
  it("sets the desktop point where the user clicks", () => {
    const { onChange, slider } = setup();
    fireEvent.pointerDown(slider, { clientX: 50, clientY: 25, pointerId: 1 });
    expect(onChange).toHaveBeenCalledWith({ desktop: "25% 25%", mobile: "50% 50%" });
  });

  it("edits the mobile point after switching device", () => {
    const { onChange, slider } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Mobil" }));
    fireEvent.pointerDown(slider, { clientX: 200, clientY: 0, pointerId: 1 });
    expect(onChange).toHaveBeenCalledWith({ desktop: "50% 50%", mobile: "100% 0%" });
  });

  it("nudges with arrow keys (shift = 10 %)", () => {
    const { onChange, slider } = setup();
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith({ desktop: "51% 50%", mobile: "50% 50%" });
    fireEvent.keyDown(slider, { key: "ArrowUp", shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith({ desktop: "50% 40%", mobile: "50% 50%" });
  });
});
