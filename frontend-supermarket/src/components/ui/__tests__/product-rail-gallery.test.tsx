import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ClothingRailHero, { RAIL_DEMO_ITEMS } from "../product-rail-gallery";

describe("ClothingRailHero", () => {
  it("renders all 10 RAIL_DEMO_ITEMS on the rail with hang-tags and opens 3D spin detail on keyboard/click", () => {
    const onOpenChange = vi.fn();
    render(
      <ClothingRailHero
        items={RAIL_DEMO_ITEMS}
        eyebrow="COLLECTION 01"
        heading="Tactile Archive Rail"
        caption="Brush along the rail"
        onOpenChange={onOpenChange}
        renderDetailActions={(item) => <button type="button">ADD TO BAG · {item.name}</button>}
      />
    );

    expect(screen.getByText("Tactile Archive Rail")).toBeInTheDocument();
    const firstGarment = screen.getByRole("button", { name: RAIL_DEMO_ITEMS[0]!.name });
    expect(firstGarment).toBeInTheDocument();

    // Trigger keyboard detail open (detail === 0 in click handler)
    fireEvent.click(firstGarment, { detail: 0 });
    expect(onOpenChange).toHaveBeenCalledWith(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(`ADD TO BAG · ${RAIL_DEMO_ITEMS[0]!.name}`)).toBeInTheDocument();
  });
});
