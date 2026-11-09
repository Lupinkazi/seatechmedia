import assert from "node:assert/strict";
import { test } from "node:test";
import { getResponsiveWorkImageSrcSet } from "../src/lib/work-images.ts";

test("local portfolio images expose responsive JPEG candidates", () => {
  assert.equal(
    getResponsiveWorkImageSrcSet("/images/work/project.png"),
    "/images/work/project-480w.jpg 480w, /images/work/project-960w.jpg 960w",
  );
});

test("external image URLs are left without local responsive candidates", () => {
  assert.equal(
    getResponsiveWorkImageSrcSet("https://example.com/project.jpg"),
    undefined,
  );
});
