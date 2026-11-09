# usage: ffmpeg -i narration.mp3 -ac 1 -ar 16000 -f f32le audio16k.f32; python3 align_narration.py audio16k.f32 transcript.json  (faster-whisper medium, word timestamps)
import json, sys
import numpy as np
from faster_whisper import WhisperModel

audio = sys.argv[1]
out = sys.argv[2]
model = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = model.transcribe(
    np.fromfile(audio, dtype=np.float32), language="zh", word_timestamps=True, vad_filter=False,
    initial_prompt="以下是普通话的句子。她字，刘半农，玉篇，周作人，钱玄同，新青年，伊，妇女共鸣，国音常用字汇，鲁迅，祝福，赵元任。",
)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text,
                "words": [{"s": w.start, "e": w.end, "w": w.word} for w in (s.words or [])]})
    print(f"[{s.start:7.2f}-{s.end:7.2f}] {s.text}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
print("DONE", info.duration)
