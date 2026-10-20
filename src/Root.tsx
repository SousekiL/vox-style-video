import React from 'react';
import {Composition, Still} from 'remotion';
import {DEMO_DURATION, ExplainerDemo} from './demo/ExplainerDemo';
import {TextureSheet} from './demo/TextureSheet';
import {QIN_DURATION, QinPole} from './stories/QinPole';
import {QIN_BOLD_DURATION, QinPoleBold} from './stories/QinPoleBold';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ExplainerDemo" component={ExplainerDemo} durationInFrames={DEMO_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="ExplainerDemo4K" component={ExplainerDemo} durationInFrames={DEMO_DURATION} fps={30} width={3840} height={2160} />
    <Composition id="VoxQinPole" component={QinPole} durationInFrames={QIN_DURATION} fps={24} width={1920} height={1080} />
    <Composition id="VoxQinPole4K" component={QinPole} durationInFrames={QIN_DURATION} fps={24} width={3840} height={2160} />
    <Composition id="VoxQinPoleBold" component={QinPoleBold} durationInFrames={QIN_BOLD_DURATION} fps={24} width={1920} height={1080} />
    <Composition id="VoxQinPoleBold4K" component={QinPoleBold} durationInFrames={QIN_BOLD_DURATION} fps={24} width={3840} height={2160} />
    <Still id="TextureSheet" component={TextureSheet} width={1920} height={1080} />
  </>
);
