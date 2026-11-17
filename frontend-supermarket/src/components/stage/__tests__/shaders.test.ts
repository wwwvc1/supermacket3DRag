import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import {
  DESIGNALI_FRAGMENT_SHADER,
  computeSceneWeights,
  hexToNormalizedRgb,
} from "../shaders";
import { WebGLStage } from "../WebGLStage";

describe("WebGLStage & shaders", () => {
  it("includes exact 21st.dev 45-degree slatted chromatic wave formula in DESIGNALI_FRAGMENT_SHADER", () => {
    expect(DESIGNALI_FRAGMENT_SHADER).toContain("mod(uv.x + uv.y, 0.2)");
    expect(DESIGNALI_FRAGMENT_SHADER).toContain("fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv)");
  });

  it("computes normalized one-hot scene weights and parses hex colors", () => {
    expect(computeSceneWeights(0)).toEqual([1, 0, 0, 0]);
    expect(computeSceneWeights(2)).toEqual([0, 0, 1, 0]);
    const [r, g, b] = hexToNormalizedRgb("#C8C3F2");
    expect(r).toBeCloseTo(200 / 255, 2);
    expect(g).toBeCloseTo(195 / 255, 2);
    expect(b).toBeCloseTo(242 / 255, 2);
  });

  it("renders gracefully without throwing when WebGL context is unavailable in jsdom (Review Focus #5)", () => {
    const { container } = render(
      React.createElement(WebGLStage, {
        activeScene: 0,
        spotlightX: 0,
        spotlightColor: "#C8C3F2",
        oracleActive: false,
      })
    );
    expect(container.querySelector("[data-webgl-stage]")).toBeTruthy();
  });
});
