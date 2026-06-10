'use client';

import { Fragment } from 'react';

type BreakableTransactionReferenceProps = {
  value: string;
  className?: string;
};

function breakLongSegment(segment: string) {
  if (segment.length <= 12) {
    return segment;
  }

  const chunks: string[] = [];
  for (let index = 0; index < segment.length; index += 8) {
    chunks.push(segment.slice(index, index + 8));
  }

  return chunks.map((chunk, index) => (
    <Fragment key={`${index}-${chunk}`}>
      {index > 0 && <wbr />}
      {chunk}
    </Fragment>
  ));
}

/**
 * Inserts break opportunities at hyphens and inside long segments so refs wrap
 * within the header without pushing action buttons downward.
 */
export function BreakableTransactionReference({
  value,
  className,
}: BreakableTransactionReferenceProps) {
  const segments = value.split('-');

  if (segments.length <= 1) {
    return (
      <span className={className} title={value}>
        {breakLongSegment(value)}
      </span>
    );
  }

  return (
    <span className={className} title={value}>
      {segments.map((segment, index) => (
        <Fragment key={`${index}-${segment}`}>
          {breakLongSegment(segment)}
          {index < segments.length - 1 && (
            <>
              <wbr />-
            </>
          )}
        </Fragment>
      ))}
    </span>
  );
}
