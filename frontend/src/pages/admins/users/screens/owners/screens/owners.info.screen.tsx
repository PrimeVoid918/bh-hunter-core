import React from 'react';
import { useParams } from 'react-router-dom';

export default function OwnersInfoScreen() {
  const { id } = useParams<{ id: string }>();

  return <div></div>;
}
