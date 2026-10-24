import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenChurch",
    short_name: "OpenChurch",
    description: "Plan a service and keep everyone on the same moment.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6FBF7",
    theme_color: "#0F3D2E",
    icons: [
      {
        src: "/mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
