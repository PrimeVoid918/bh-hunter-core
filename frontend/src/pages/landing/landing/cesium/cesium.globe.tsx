import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { createCesiumViewer } from './cesium.service';
import { CesiumGlobeProps } from './cesium.types';
import { Spinner, Center } from '@chakra-ui/react';

export default function CesiumGlobe({ className }: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let v: Cesium.Viewer;

    createCesiumViewer(containerRef.current).then((viewer) => {
      if (cancelled) {
        viewer.destroy();
        return;
      }
      v = viewer;
      viewerRef.current = v;
      setIsLoaded(true);
    });

    return () => {
      cancelled = true;
      if (v) v.destroy();
    };
  }, []);

  // useEffect(() => {
    // console.log('isLoaded: ', isLoaded);
  // }, [isLoaded]);

  return (
    <Wrap ref={containerRef} className={className}>
      {!isLoaded && (
        <Center height="100%">
          <Spinner size="xl" color="white" />
        </Center>
      )}
    </Wrap>
  );
}

const Wrap = styled.div`
  background-color: black;
  pointer-events: auto;
  height: 100%;
`;
