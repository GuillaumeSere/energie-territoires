"use client";

import { PointerEvent, WheelEvent, useState } from "react";
import Link from "next/link";
import { formatEnergy } from "@/lib/format";
import type { TerritorySummary } from "@/lib/types";

type FranceEnergyMapProps = {
  territories: TerritorySummary[];
};

type CityCoordinates = {
  lat: number;
  lon: number;
  label: "top" | "right" | "bottom" | "left";
};

type Tile = {
  key: string;
  src: string;
  left: number;
  top: number;
  size: number;
};

const cityCoordinates: Record<string, CityCoordinates> = {
  "59183": { lat: 51.0344, lon: 2.3768, label: "left" },
  "59350": { lat: 50.6292, lon: 3.0573, label: "right" },
  "27701": { lat: 49.2735, lon: 1.2102, label: "left" },
  "75056": { lat: 48.8566, lon: 2.3522, label: "top" },
  "93066": { lat: 48.9362, lon: 2.3574, label: "right" },
  "91120": { lat: 48.7145, lon: 2.2457, label: "bottom" },
  "67482": { lat: 48.5734, lon: 7.7521, label: "right" },
  "35238": { lat: 48.1173, lon: -1.6778, label: "left" },
  "44109": { lat: 47.2184, lon: -1.5536, label: "left" },
  "69381": { lat: 45.764, lon: 4.8357, label: "right" },
  "38185": { lat: 45.1885, lon: 5.7245, label: "right" },
  "33063": { lat: 44.8378, lon: -0.5792, label: "left" },
  "31555": { lat: 43.6047, lon: 1.4442, label: "left" },
  "34172": { lat: 43.6119, lon: 3.8772, label: "bottom" },
  "13055": { lat: 43.2965, lon: 5.3698, label: "right" },
  "06088": { lat: 43.7102, lon: 7.262, label: "right" },
};

const minZoom = 5;
const maxZoom = 9;
const tileSize = 256;
const viewWidth = 1000;
const viewHeight = 620;
const defaultCenter = { lat: 46.7, lon: 2.4 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lonLatToWorld(lat: number, lon: number, zoom: number) {
  const scale = tileSize * 2 ** zoom;
  const sinLat = Math.sin((clamp(lat, -85.0511, 85.0511) * Math.PI) / 180);

  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function worldToLonLat(x: number, y: number, zoom: number) {
  const scale = tileSize * 2 ** zoom;
  const lon = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return { lat, lon };
}

function wrapTileX(x: number, zoom: number) {
  const tileCount = 2 ** zoom;
  return ((x % tileCount) + tileCount) % tileCount;
}

export function FranceEnergyMap({ territories }: FranceEnergyMapProps) {
  const [zoom, setZoom] = useState(6);
  const [center, setCenter] = useState(defaultCenter);
  const [drag, setDrag] = useState<{ pointerId: number; x: number; y: number } | null>(null);
  const maxConsumption = Math.max(...territories.map((territory) => territory.consumptionMwh));
  const centerWorld = lonLatToWorld(center.lat, center.lon, zoom);
  const topLeft = {
    x: centerWorld.x - viewWidth / 2,
    y: centerWorld.y - viewHeight / 2,
  };

  const firstTileX = Math.floor(topLeft.x / tileSize);
  const lastTileX = Math.floor((topLeft.x + viewWidth) / tileSize);
  const firstTileY = Math.floor(topLeft.y / tileSize);
  const lastTileY = Math.floor((topLeft.y + viewHeight) / tileSize);
  const maxTile = 2 ** zoom - 1;
  const tiles: Tile[] = [];

  for (let x = firstTileX; x <= lastTileX; x += 1) {
    for (let y = firstTileY; y <= lastTileY; y += 1) {
      if (y < 0 || y > maxTile) {
        continue;
      }

      const wrappedX = wrapTileX(x, zoom);
      tiles.push({
        key: `${zoom}-${x}-${y}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
        left: ((x * tileSize - topLeft.x) / viewWidth) * 100,
        top: ((y * tileSize - topLeft.y) / viewHeight) * 100,
        size: (tileSize / viewWidth) * 100,
      });
    }
  }

  function zoomBy(delta: number) {
    setZoom((current) => clamp(current + delta, minZoom, maxZoom));
  }

  function resetMap() {
    setZoom(6);
    setCenter(defaultCenter);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomBy(event.deltaY > 0 ? -1 : 1);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ pointerId: event.pointerId, x: event.clientX, y: event.clientY });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    const nextWorld = {
      x: centerWorld.x - deltaX * 1.35,
      y: centerWorld.y - deltaY * 1.35,
    };
    const nextCenter = worldToLonLat(nextWorld.x, nextWorld.y, zoom);

    setCenter({
      lat: clamp(nextCenter.lat, 41.2, 51.3),
      lon: clamp(nextCenter.lon, -5.6, 8.8),
    });
    setDrag({ pointerId: event.pointerId, x: event.clientX, y: event.clientY });
  }

  function handlePointerUp() {
    setDrag(null);
  }

  return (
    <section className="map-shell">
      <div className="map-heading">
        <div className="section-heading compact">
          <span>Carte</span>
          <h2>Carte OpenStreetMap des territoires pilotes</h2>
        </div>
        <div className="map-controls" aria-label="Contrôles de carte">
          <button type="button" onClick={() => zoomBy(-1)} aria-label="Dézoomer">
            −
          </button>
          <output aria-label="Niveau de zoom">z{zoom}</output>
          <button type="button" onClick={() => zoomBy(1)} aria-label="Zoomer">
            +
          </button>
          <button type="button" onClick={resetMap} aria-label="Recentrer la carte">
            ↺
          </button>
        </div>
      </div>

      <div
        className={`france-map osm-map ${drag ? "is-dragging" : ""}`}
        aria-label="Carte OpenStreetMap de France avec villes positionnées par coordonnées"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="tile-layer" aria-hidden="true">
          {tiles.map((tile) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={tile.key}
              src={tile.src}
              alt=""
              draggable={false}
              style={{
                left: `${tile.left}%`,
                top: `${tile.top}%`,
                width: `${tile.size}%`,
                height: `${(tileSize / viewHeight) * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="map-shade" aria-hidden="true" />
        <div className="marker-layer osm-marker-layer">
          {territories.map((territory) => {
            const coordinates = cityCoordinates[territory.code];
            if (!coordinates) {
              return null;
            }

            const world = lonLatToWorld(coordinates.lat, coordinates.lon, zoom);
            const position = {
              x: ((world.x - topLeft.x) / viewWidth) * 100,
              y: ((world.y - topLeft.y) / viewHeight) * 100,
            };
            const size = 12 + (territory.consumptionMwh / maxConsumption) * 26;

            return (
              <Link
                href={`/territoires/${territory.code}`}
                key={territory.code}
                className={`map-marker label-${coordinates.label}`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                title={`${territory.name} - ${formatEnergy(territory.consumptionMwh)}`}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <i style={{ width: size, height: size }} />
                <span>
                  <strong>{territory.name}</strong>
                  <small>{formatEnergy(territory.consumptionMwh)}</small>
                </span>
              </Link>
            );
          })}
        </div>

        <a
          className="map-attribution"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          onPointerDown={(event) => event.stopPropagation()}
        >
          © OpenStreetMap
        </a>
      </div>

      <div className="map-legend">
        <span>Fond de carte OpenStreetMap</span>
        <span>Position selon latitude / longitude</span>
        <span>Pastille proportionnelle à la consommation</span>
      </div>
    </section>
  );
}
