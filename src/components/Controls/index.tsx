import type { Component } from 'solid-js';
import { useAppState } from '../../App';

const Controls: Component = () => {
  const { rotationAngle, setRotationAngle } = useAppState();

  return (
    <div class="controls">
      <button onClick={() => {/* 前の画像 */}}>Previous</button>
      <button onClick={() => setRotationAngle((rotationAngle() + 90) % 360)}>Rotate</button>
      <button onClick={() => {/* 次の画像 */}}>Next</button>
    </div>
  );
};

export default Controls;
