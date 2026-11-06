import { describe, expect, it } from "vitest";

import {
  centeredView,
  clampView,
  coverScale,
  CropSchema,
  cropFromView,
  maxZoom,
  pixelCrop,
  viewFromCrop,
  zoomView,
} from "./HeaderImage.client";

const frame = { width: 900, height: 300 };
const landscape = { width: 6000, height: 4000 };
const portrait = { width: 3000, height: 4500 };
const square = { width: 2000, height: 2000 };
const panorama = { width: 9000, height: 1000 };

describe("coverScale", () => {
  it("fits the narrower dimension of the frame", () => {
    // A 3:2 landscape is relatively taller than the 3:1 frame, so width decides.
    expect(coverScale(frame, landscape)).toBeCloseTo(900 / 6000);
    expect(coverScale(frame, portrait)).toBeCloseTo(900 / 3000);
    expect(coverScale(frame, square)).toBeCloseTo(900 / 2000);
    // A 9:1 panorama is wider than the frame, so height decides.
    expect(coverScale(frame, panorama)).toBeCloseTo(300 / 1000);
  });
});

function expectFrameCovered(
  view: { zoom: number; offsetX: number; offsetY: number },
  image: { width: number; height: number },
) {
  const scale = coverScale(frame, image) * view.zoom;
  expect(view.offsetX).toBeLessThanOrEqual(0);
  expect(view.offsetY).toBeLessThanOrEqual(0);
  expect(view.offsetX + image.width * scale).toBeGreaterThanOrEqual(
    frame.width - 1e-9,
  );
  expect(view.offsetY + image.height * scale).toBeGreaterThanOrEqual(
    frame.height - 1e-9,
  );
}

describe("clampView", () => {
  it.each([1, maxZoom])("keeps the frame covered at zoom %d", (zoom) => {
    for (const image of [landscape, portrait, square, panorama]) {
      expectFrameCovered(
        clampView({ zoom, offsetX: 10_000, offsetY: 10_000 }, frame, image),
        image,
      );
      expectFrameCovered(
        clampView({ zoom, offsetX: -10_000, offsetY: -10_000 }, frame, image),
        image,
      );
    }
  });

  it("limits the zoom to the allowed range", () => {
    expect(
      clampView({ zoom: 0.5, offsetX: 0, offsetY: 0 }, frame, square).zoom,
    ).toBe(1);
    expect(
      clampView({ zoom: 9, offsetX: 0, offsetY: 0 }, frame, square).zoom,
    ).toBe(maxZoom);
  });
});

describe("cropFromView and viewFromCrop", () => {
  it("round trip", () => {
    for (const image of [landscape, portrait, square, panorama]) {
      const view = clampView(
        { zoom: 2.3, offsetX: -400, offsetY: -250 },
        frame,
        image,
      );
      const restored = viewFromCrop(
        cropFromView(view, frame, image),
        frame,
        image,
      );
      expect(restored.zoom).toBeCloseTo(view.zoom);
      expect(restored.offsetX).toBeCloseTo(view.offsetX);
      expect(restored.offsetY).toBeCloseTo(view.offsetY);
    }
  });

  it("restores a crop into a frame of another size", () => {
    const crop = cropFromView(
      zoomView(centeredView(frame, landscape), 2, frame, landscape),
      frame,
      landscape,
    );
    const smallFrame = { width: 300, height: 100 };
    const again = cropFromView(
      viewFromCrop(crop, smallFrame, landscape),
      smallFrame,
      landscape,
    );
    expect(again.x).toBeCloseTo(crop.x);
    expect(again.y).toBeCloseTo(crop.y);
    expect(again.w).toBeCloseTo(crop.w);
    expect(again.h).toBeCloseTo(crop.h);
  });

  it("gives a 3:1 crop in pixels of the original", () => {
    const crop = cropFromView(centeredView(frame, landscape), frame, landscape);
    expect(
      (crop.w * landscape.width) / (crop.h * landscape.height),
    ).toBeCloseTo(3);
    expect(crop.w).toBeCloseTo(1);
    expect(crop.x).toBeCloseTo(0);
  });
});

describe("zoomView", () => {
  it("keeps the point under the frame centre in place", () => {
    const start = clampView(
      { zoom: 1.5, offsetX: -300, offsetY: -200 },
      frame,
      landscape,
    );
    const zoomed = zoomView(start, 2.5, frame, landscape);
    const before = cropFromView(start, frame, landscape);
    const after = cropFromView(zoomed, frame, landscape);
    expect(after.x + after.w / 2).toBeCloseTo(before.x + before.w / 2);
    expect(after.y + after.h / 2).toBeCloseTo(before.y + before.h / 2);
  });
});

describe("pixelCrop", () => {
  it("is exactly 3:1", () => {
    const region = pixelCrop({ x: 0.1, y: 0.2, w: 0.5, h: 0.25 }, landscape);
    expect(region.width).toBe(region.height * 3);
    expect(region).toEqual({ left: 600, top: 800, width: 3000, height: 1000 });
  });

  it("stays inside the image at the right and bottom edges", () => {
    const region = pixelCrop(
      { x: 0.6, y: 0.9, w: 0.4000004, h: 0.3 },
      landscape,
    );
    expect(region.left + region.width).toBeLessThanOrEqual(landscape.width);
    expect(region.top + region.height).toBeLessThanOrEqual(landscape.height);
    expect(region.width).toBe(region.height * 3);
  });

  it("fits a panorama by its height", () => {
    const region = pixelCrop({ x: 0, y: 0, w: 1, h: 1 }, panorama);
    expect(region.height).toBe(1000);
    expect(region.width).toBe(3000);
  });
});

describe("CropSchema", () => {
  it("rejects a crop that extends past the right edge", () => {
    expect(CropSchema.safeParse({ x: 0.6, y: 0, w: 0.5, h: 0.2 }).success).toBe(
      false,
    );
  });

  it("rejects a crop that extends past the bottom edge", () => {
    expect(CropSchema.safeParse({ x: 0, y: 0.9, w: 0.5, h: 0.2 }).success).toBe(
      false,
    );
  });

  it("accepts a crop at the edges within float error", () => {
    expect(
      CropSchema.safeParse({ x: 0.5, y: 0.8, w: 0.5000000001, h: 0.2 }).success,
    ).toBe(true);
  });
});
