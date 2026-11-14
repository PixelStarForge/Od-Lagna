import { Metadata } from "next";
import { getAllStars, getAllConstellations, getAllCharacterStars } from "../../lib/constellation-loader";
import { ConstellationClient } from "../../components/constellation/ConstellationClient";

export const metadata: Metadata = {
  title: "Constellations — 3D Celestial Sphere & Re:Zero Lore | Od-Lagna",
  description:
    "Explore the real 360-degree night sky, celestial star coordinates, and the astronomical origins behind Re:Zero character names.",
  openGraph: {
    title: "Constellations — 3D Celestial Sphere | Od-Lagna",
    description:
      "Explore the real night sky in 360 degrees and discover the astronomical stars and constellations behind Re:Zero characters.",
    type: "website",
    url: "/constellation",
  },
  twitter: {
    card: "summary_large_image",
    title: "Constellations — 3D Celestial Sphere | Od-Lagna",
    description:
      "Explore the real night sky in 360 degrees and discover the astronomical stars and constellations behind Re:Zero characters.",
  },
};

export default function ConstellationPage() {
  const stars = getAllStars();
  const constellations = getAllConstellations();
  const characterStars = getAllCharacterStars();

  return (
    <div className="w-full">
      <h1 className="sr-only">Constellations — 3D Celestial Sphere</h1>
      <ConstellationClient
        stars={stars}
        constellations={constellations}
        characterStars={characterStars}
      />
    </div>
  );
}

