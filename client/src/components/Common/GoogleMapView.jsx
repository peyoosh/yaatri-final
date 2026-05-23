// NOTE: filename retained as `GoogleMapView.jsx` so import sites don't change,
// but this component is now backed by **Leaflet + OpenStreetMap** (no API key,
// no GCP, no referrer restrictions). Public prop shape is unchanged.

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { loadGoogleMaps as loadLeaflet, coordsForDestination, NEPAL_CENTER } from '../../utils/loadGoogleMaps';

const GoogleMapView = ({
  markers,
  destinations,
  center,
  zoom = 7,
  height = 360,
  fitToMarkers,
  onMarkerClick,
  style = {},
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const items = useMemo(() => {
    if (Array.isArray(destinations)) {
      return destinations
        .map((d) => {
          const pos = coordsForDestination(d);
          if (!pos) return null;
          return {
            id: d._id || d.id || d.name,
            position: pos,
            title: d.name || 'Destination',
            data: d,
          };
        })
        .filter(Boolean);
    }
    if (Array.isArray(markers)) {
      return markers.filter(
        (m) => m && m.position && Number.isFinite(m.position.lat) && Number.isFinite(m.position.lng)
      );
    }
    return [];
  }, [destinations, markers]);

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;

        // Patch the default icon paths so they resolve from the same CDN as the JS bundle.
        // Without this, Leaflet's marker icons 404 when used outside a Webpack/Vite build.
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const initialCenter =
          center || (items.length === 1 ? items[0].position : null) || NEPAL_CENTER;

        const map = L.map(containerRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        layerRef.current = L.layerGroup().addTo(map);
        setLoaded(true);
      })
      .catch((err) => {
        console.error('LeafletMapView load error:', err);
        if (!cancelled) setError(err.message || 'Failed to load map.');
      });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (_) {}
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers whenever items change.
  useEffect(() => {
    if (!loaded || !mapRef.current || !window.L || !layerRef.current) return;
    const L = window.L;
    layerRef.current.clearLayers();

    items.forEach((item) => {
      const marker = L.marker([item.position.lat, item.position.lng]).addTo(layerRef.current);
      if (item.title) {
        const region = item.data?.region ? `<br/><span style="opacity:0.7; font-size:0.75rem;">${item.data.region}</span>` : '';
        marker.bindPopup(
          `<div style="font-family: sans-serif; color: #0D0A02; min-width: 120px;">
             <strong style="font-size:0.9rem;">${item.title}</strong>${region}
           </div>`
        );
      }
      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(item.data || item));
      }
    });

    const shouldFit = fitToMarkers ?? items.length > 1;
    if (shouldFit && items.length > 0) {
      const bounds = L.latLngBounds(items.map((i) => [i.position.lat, i.position.lng]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    } else if (items.length === 1) {
      mapRef.current.setView([items[0].position.lat, items[0].position.lng], zoom);
    }

    // Give the map a chance to settle inside its (possibly-just-shown) container.
    setTimeout(() => {
      try { mapRef.current?.invalidateSize(); } catch (_) {}
    }, 100);
  }, [items, loaded, fitToMarkers, onMarkerClick, zoom]);

  if (error) {
    return (
      <div
        style={{
          height,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#A6A180',
          fontSize: '0.8rem',
          padding: '1rem',
          textAlign: 'center',
          ...style,
        }}
      >
        Map unavailable — {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <div
        ref={containerRef}
        style={{
          height,
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#1d2c30',
        }}
      />
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A6A180',
            fontSize: '0.75rem',
            letterSpacing: 2,
            pointerEvents: 'none',
          }}
        >
          LOADING_MAP…
        </div>
      )}
    </div>
  );
};

export default GoogleMapView;
