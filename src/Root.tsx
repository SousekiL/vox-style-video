import React from 'react';
import {Composition, Still} from 'remotion';
import {DEMO_DURATION, ExplainerDemo} from './demo/ExplainerDemo';
import {TextureSheet} from './demo/TextureSheet';
import {QIN_DURATION, QinPole} from './stories/QinPole';
import {QIN_BOLD_DURATION, QinPoleBold} from './stories/QinPoleBold';
import {CollageBakeoff, QIN_COLLAGE_DURATION, QinPoleCollage} from './stories/QinPoleCollage';
import {TAIPEI_POLL_DURATION, TaipeiPoll2026} from './stories/TaipeiPoll2026';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ExplainerDemo" component={ExplainerDemo} durationInFrames={DEMO_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="ExplainerDemo4K" component={ExplainerDemo} durationInFrames={DEMO_DURATION} fps={30} width={3840} height={2160} />
    <Composition id="VoxQinPole" component={QinPole} durationInFrames={QIN_DURATION} fps={24} width={1920} height={1080} />
    <Composition id="VoxQinPole4K" component={QinPole} durationInFrames={QIN_DURATION} fps={24} width={3840} height={2160} />
    <Composition id="VoxQinPoleBold" component={QinPoleBold} durationInFrames={QIN_BOLD_DURATION} fps={24} width={1920} height={1080} />
    <Composition id="VoxQinPoleBold4K" component={QinPoleBold} durationInFrames={QIN_BOLD_DURATION} fps={24} width={3840} height={2160} />
    <Composition id="VoxQinPoleCollage" component={QinPoleCollage} durationInFrames={QIN_COLLAGE_DURATION} fps={24} width={1920} height={1080} />
    <Composition id="VoxQinPoleCollageVertical" component={QinPoleCollage} durationInFrames={QIN_COLLAGE_DURATION} fps={24} width={1080} height={1920} />
    <Composition id="VoxTaipeiPoll2026" component={TaipeiPoll2026} durationInFrames={TAIPEI_POLL_DURATION} fps={24} width={1080} height={1920} />
    <Composition id="VoxQinPoleCollage4K" component={QinPoleCollage} durationInFrames={QIN_COLLAGE_DURATION} fps={24} width={3840} height={2160} />
    {/* a 1-frame Composition (not <Still>, whose fps is 1) so camera drift and fades use the real 24 fps clock */}
    <Composition id="VoxCollageBakeoff" component={CollageBakeoff} durationInFrames={1} fps={24} width={1920} height={1080} />
    <Still id="TextureSheet" component={TextureSheet} width={1920} height={1080} />
  </>
);
