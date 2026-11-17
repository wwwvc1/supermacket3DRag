import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VitrineGalleryHero, { VITRINE_DEMO_ITEMS } from "../vitrine-pedestal-gallery";

describe("VitrineGalleryHero", () => {
  it("renders all 6 museum vitrine pedestals, lifts the glass bell hood on hover, and opens 3D turntable stage on click", () => {
    const onOpenChange = vi.fn();
    render(
      <VitrineGalleryHero
        items={VITRINE_DEMO_ITEMS}
        onOpenChange={onOpenChange}
        renderDetailActions={(item) => <button type="button">ADD TO BAG · {item.name}</button>}
      />
    );

    const firstPedestal = screen.getByRole("button", { name: new RegExp(VITRINE_DEMO_ITEMS[0]!.name, "i") });
    expect(firstPedestal).toBeInTheDocument();

    // Hovering lifts the glass bell hood
    fireEvent.pointerEnter(firstPedestal);
    expect(firstPedestal.querySelector("[data-glass-hood]")).toHaveAttribute("data-lifted", "true");

    // Clicking unseals the vitrine and elevates object into 3D Turntable stage
    fireEvent.click(firstPedestal);
    expect(onOpenChange).toHaveBeenCalledWith(0);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Underlying vitrine showroom stage must be dimmed & pointer-locked so background pedestals never flicker through
    expect(screen.getByTestId("vitrine-showroom-stage")).toHaveAttribute("data-modal-dimmed", "true");
    const backdrop = dialog.querySelector("[data-modal-backdrop]");
    expect(backdrop).not.toBeNull();
    expect(backdrop?.querySelector("[data-elegant-dark-pattern]")).not.toBeNull();
    expect(backdrop?.querySelectorAll("[data-light-shaft]").length).toBe(5);

    // Toggle TURNTABLE AUTO-SPIN mode
    const autoSpinBtn = screen.getByRole("button", { name: /TURNTABLE AUTO-SPIN/i });
    fireEvent.click(autoSpinBtn);
    expect(screen.getByTestId("vitrine-turntable-stage")).toHaveAttribute("data-autospin", "true");
    expect(screen.getByText(`ADD TO BAG · ${VITRINE_DEMO_ITEMS[0]!.name}`)).toBeInTheDocument();
  });
});
