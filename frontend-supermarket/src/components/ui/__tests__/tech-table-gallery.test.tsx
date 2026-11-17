import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TechTableHero, { TECH_TABLE_DEMO_ITEMS } from "../tech-table-gallery";

describe("TechTableHero", () => {
  it("renders all 6 flagship digital devices on the 3D anodized table and opens 3D magnetic un-dock modal with DISPLAY WAKE / OPTICS / X-RAY modes", () => {
    const onOpenChange = vi.fn();
    render(
      <TechTableHero
        items={TECH_TABLE_DEMO_ITEMS}
        onOpenChange={onOpenChange}
        renderDetailActions={(item) => <button type="button">ADD TO BAG · {item.name}</button>}
      />
    );

    const firstDevice = screen.getByRole("button", { name: new RegExp(TECH_TABLE_DEMO_ITEMS[0]!.name, "i") });
    expect(firstDevice).toBeInTheDocument();

    // Click device on table -> triggers Magnetic Un-Dock into 1400px 3D inspection dialog
    fireEvent.click(firstDevice);
    expect(onOpenChange).toHaveBeenCalledWith(0);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Underlying showroom stage must be dimmed & pointer-locked so background items never flicker through
    expect(screen.getByTestId("tech-showroom-stage")).toHaveAttribute("data-modal-dimmed", "true");
    const backdrop = dialog.querySelector("[data-modal-backdrop]");
    expect(backdrop).not.toBeNull();
    expect(backdrop?.querySelector("[data-elegant-dark-pattern]")).not.toBeNull();
    expect(backdrop?.querySelectorAll("[data-light-shaft]").length).toBe(5);
    expect(screen.getByTestId("warp-webgl-canvas")).toBeInTheDocument();

    // Verify custom tech inspection modes exist (Display Wake, Optics Back, X-Ray Exploded)
    const xrayBtn = screen.getByRole("button", { name: /X-RAY EXPLODED/i });
    fireEvent.click(xrayBtn);
    expect(screen.getByTestId("tech-exploded-layers")).toHaveAttribute("data-exploded", "true");
    expect(screen.getByText(`ADD TO BAG · ${TECH_TABLE_DEMO_ITEMS[0]!.name}`)).toBeInTheDocument();
  });
});
