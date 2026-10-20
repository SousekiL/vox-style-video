// Still QA sheet: every material and treatment side by side, labelled. Render with `npm run still -- TextureSheet`.
import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {
  Asterisk,
  BankObject,
  CollageFilters,
  CrumpledPaper,
  Cutout,
  FONT,
  FlatPaper,
  FlatShape,
  GraphPaper,
  GridCircle,
  Halftone,
  HandObject,
  HouseObject,
  MarkerLabel,
  Scribble,
  Tape,
  TornStrip,
  TowerObject,
} from '../collage';

const Cell: React.FC<{i: number; label: string; bg?: string; children: React.ReactNode}> = ({i, label, bg = '#fdfdfd', children}) => {
  const {width, height} = useVideoConfig();
  const cols = 4;
  const w = width / cols;
  const h = height / 3;
  return (
    <div style={{position: 'absolute', left: (i % cols) * w, top: Math.floor(i / cols) * h, width: w, height: h, overflow: 'hidden', background: bg, outline: '1px solid #0002'}}>
      {children}
      <div style={{position: 'absolute', left: 8, bottom: 6, fontFamily: FONT.mono, fontSize: height * 0.016, background: '#fffc', padding: '2px 6px'}}>{label}</div>
    </div>
  );
};

export const TextureSheet: React.FC = () => {
  const {width, height} = useVideoConfig();
  const cw = width / 4;
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <CollageFilters scale={height / 1080} />
      <Cell i={0} label="CrumpledPaper #e8e7ea (v01)">
        <CrumpledPaper color="#e8e7ea" seed={11} />
      </Cell>
      <Cell i={1} label="GraphPaper + GridCircle + FlatShape (v01)">
        <GraphPaper style={{left: '5%', top: '10%', width: '50%', height: '80%'}} />
        <GridCircle box={{x: 35, y: 15, w: 40, h: 70}} />
        <FlatShape kind="half" color="#aed1a4" box={{x: 55, y: 50, w: 40, h: 40}} />
      </Cell>
      <Cell i={2} label="Halftone 0.74%H @45° (v04a)">
        <div style={{position: 'absolute', left: '10%', top: '8%'}}>
          <Halftone pitchPctH={0.74}>
            <div style={{background: '#8c8c8c', padding: 10}}>
              <BankObject width={cw * 0.7} />
            </div>
          </Halftone>
        </div>
      </Cell>
      <Cell i={3} label="duoRed duotone on red stock (v04b)" bg="#d73d25">
        <div style={{position: 'absolute', left: '15%', top: '12%', filter: 'url(#duoRed)', background: '#ddd', padding: 8}}>
          <HouseObject width={cw * 0.55} />
        </div>
      </Cell>
      <Cell i={4} label="Cutout edge=sticker (v08)" bg="#76b7b2">
        <Cutout treatment={{kind: 'sepia', amount: 0.35}} edge="sticker" style={{left: '15%', top: '20%'}}>
          <HandObject width={cw * 0.65} />
        </Cutout>
      </Cell>
      <Cell i={5} label="Cutout edge=halo, sepia (v07)" bg="#e6dfd8">
        <Cutout treatment={{kind: 'sepia', amount: 0.5}} edge="halo" style={{left: '12%', top: '15%'}}>
          <TowerObject width={cw * 0.75} />
        </Cutout>
      </Cell>
      <Cell i={6} label="Cutout edge=fringe (v04b)" bg="#d73d25">
        <Cutout treatment={{kind: 'greyscale', contrast: 1.3}} edge="fringe" style={{left: '15%', top: '15%'}}>
          <HouseObject width={cw * 0.6} />
        </Cutout>
      </Cell>
      <Cell i={7} label="Torn olive paper + red felt (v03)" bg="#efe6db">
        <div style={{position: 'absolute', left: '-5%', top: '-10%', width: '70%', height: '70%', filter: 'url(#torn)'}}>
          <CrumpledPaper color="#797648" seed={5} strength={0.8} frequency={0.02} />
        </div>
        <div style={{position: 'absolute', right: '-5%', bottom: '-5%', width: '60%', height: '60%', background: '#9e2522', filter: 'url(#torn)'}} />
      </Cell>
      <Cell i={8} label="Tape + TornStrip label (v01/v03)">
        <Tape x={10} y={20} w={40} h={10} rot={-10} />
        <TornStrip box={{x: 20, y: 50, w: 60, h: 18}} rot={-5} color="#c3bfbb">
          <span style={{fontFamily: FONT.ransom, fontWeight: 700, fontSize: height * 0.045, color: '#212020'}}>TRUST</span>
        </TornStrip>
      </Cell>
      <Cell i={9} label="Scribble (pencil) + MarkerLabel (v04a/v01)">
        <Scribble box={{x: 10, y: 10, w: 80, h: 50}} seed={3} widthPx={4} />
        <MarkerLabel box={{x: 15, y: 66, w: 70, h: 14}} reveal={1}>
          <span style={{fontFamily: FONT.meta, fontWeight: 300, color: '#fff', fontSize: height * 0.022}}>live on air</span>
        </MarkerLabel>
      </Cell>
      <Cell i={10} label="Asterisk crayon (v08)" bg="#76b7b2">
        <Asterisk cx={7} cy={15} sizePctW={6} />
        <Asterisk cx={17} cy={18} sizePctW={4} scale={0.79} />
      </Cell>
      <Cell i={11} label="FlatPaper plaster #e6dfd8 (v07)">
        <FlatPaper color="#e6dfd8" mottle={0.06} />
      </Cell>
    </AbsoluteFill>
  );
};
