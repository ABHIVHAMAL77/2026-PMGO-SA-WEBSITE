'use client';

import { ComponentType, useEffect, useState } from 'react';

type ThreeStageComponent = ComponentType;

export function LazyThreeStage() {
  const [ThreeStage, setThreeStage] = useState<ThreeStageComponent | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      void import('@/components/three-stage').then((module) => {
        if (isMounted) {
          setThreeStage(() => module.ThreeStage);
        }
      });
    }, 500);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ThreeStage) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{ opacity: 0 }}
        aria-hidden="true"
        data-qa="three-stage"
        data-trophy="deferred"
      />
    );
  }

  return <ThreeStage />;
}
