import React from 'react';
import { motion } from 'framer-motion';
import { Users, Wifi, Lock, Globe, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SessionRoom({ room, index, onJoin }) {
  const latencyColor = room.latency < 30 ? 'text-emerald-400' : room.latency < 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-card/40 backdrop-blur border border-border/30 hover:border-primary/30 transition-all group"
    >
      {/* Live Indicator */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-primary" />
        </div>
        {room.live && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-card animate-pulse" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm text-foreground truncate">{room.name}</h4>
          {room.private ? <Lock className="w-3 h-3 text-muted-foreground" /> : <Globe className="w-3 h-3 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.participants}/{room.maxParticipants}</span>
          <span className={`flex items-center gap-1 ${latencyColor}`}>
            <Wifi className="w-3 h-3" />{room.latency}ms
          </span>
          <span>{room.genre}</span>
        </div>
        {/* Participant avatars */}
        <div className="flex -space-x-2 mt-2">
          {room.avatars.map((av, i) => (
            <img key={i} src={av} alt="" className="w-6 h-6 rounded-full border-2 border-card object-cover" />
          ))}
          {room.participants > room.avatars.length && (
            <div className="w-6 h-6 rounded-full border-2 border-card bg-secondary flex items-center justify-center text-[9px] text-muted-foreground">
              +{room.participants - room.avatars.length}
            </div>
          )}
        </div>
      </div>

      {/* Join */}
      <Button
        onClick={() => onJoin(room)}
        variant="outline"
        className="rounded-xl h-9 px-4 text-xs border-primary/30 hover:bg-primary/10 hover:text-primary group-hover:border-primary transition-colors"
      >
        Unirse
      </Button>
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Circle, SkipBack, SkipForward, Repeat } from 'lucide-react';

const tracks = [
  { name: 'Guitar 1', color: 'bg-violet-500', blocks: [{ start: 5, width: 30 }, { start: 40, width: 25 }] },
  { name: 'Bass', color: 'bg-pink-500', blocks: [{ start: 0, width: 45 }, { start: 50, width: 30 }] },
  { name: 'Drums', color: 'bg-cyan-500', blocks: [{ start: 0, width: 80 }] },
  { name: 'Vocals', color: 'bg-amber-500', blocks: [{ start: 15, width: 20 }, { start: 55, width: 15 }] },
  { name: 'Synth', color: 'bg-emerald-500', blocks: [{ start: 10, width: 35 }, { start: 60, width: 20 }] },
];

export default function Timeline() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card/40 backdrop-blur border border-border/30 rounded-2xl p-5"
    >
      {/* Transport Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-sm text-foreground">Timeline</h3>
        <div className="flex items-center gap-1.5">
          <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2.5 rounded-xl transition-all ${isPlaying ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/20'}`}
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2 rounded-lg transition-all ${isRecording ? 'bg-red-500/20 text-red-400' : 'hover:bg-secondary text-muted-foreground'}`}
          >
            <Circle className={`w-4 h-4 ${isRecording ? 'fill-red-400' : ''}`} />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <Repeat className="w-4 h-4" />
          </button>
          <div className="ml-3 text-xs text-muted-foreground font-mono">
            02:34 / 05:00
          </div>
        </div>
      </div>

      {/* Time markers */}
      <div className="relative ml-20">
        <div className="flex justify-between text-[9px] text-muted-foreground mb-1 px-1">
          {['0:00', '1:00', '2:00', '3:00', '4:00', '5:00'].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="space-y-1.5 relative">
        {/* Playhead */}
        <div className="absolute top-0 bottom-0 left-[calc(20%+5rem)] w-0.5 bg-red-500/60 z-10 pointer-events-none">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1 -mt-1" />
        </div>

        {tracks.map((track) => (
          <div key={track.name} className="flex items-center gap-2">
            <div className="w-20 flex-shrink-0 text-right">
              <span className="text-[10px] text-muted-foreground">{track.name}</span>
            </div>
            <div className="flex-1 h-8 bg-secondary/30 rounded-lg relative overflow-hidden">
              {track.blocks.map((block, i) => (
                <div
                  key={i}
                  className={`absolute top-1 bottom-1 ${track.color}/30 rounded-md border border-white/5`}
                  style={{ left: `${block.start}%`, width: `${block.width}%` }}
                >
                  {/* Waveform visualization */}
                  <div className="flex items-center h-full gap-px px-1 overflow-hidden">
                    {Array.from({ length: Math.floor(block.width * 1.5) }).map((_, j) => (
                      <div
                        key={j}
                        className={`w-0.5 ${track.color} rounded-full opacity-60`}
                        style={{ height: `${20 + Math.random() * 60}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Mic, MicOff, Headphones } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const channels = [
  { id: 1, name: 'Guitar 1', user: 'Carlos M.', color: 'bg-violet-500', level: 75, muted: false, solo: false },
  { id: 2, name: 'Bass', user: 'Ana R.', color: 'bg-pink-500', level: 80, muted: false, solo: false },
  { id: 3, name: 'Drums', user: 'Pedro L.', color: 'bg-cyan-500', level: 70, muted: false, solo: false },
  { id: 4, name: 'Vocals', user: 'María G.', color: 'bg-amber-500', level: 65, muted: true, solo: false },
  { id: 5, name: 'Synth', user: 'Tú', color: 'bg-emerald-500', level: 72, muted: false, solo: true },
];

export default function ChannelMixer() {
  const [chans, setChans] = useState(channels);

  const toggleMute = (id) => setChans(chans.map(c => c.id === id ? { ...c, muted: !c.muted } : c));
  const toggleSolo = (id) => setChans(chans.map(c => c.id === id ? { ...c, solo: !c.solo } : c));
  const setLevel = (id, val) => setChans(chans.map(c => c.id === id ? { ...c, level: val[0] } : c));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card/40 backdrop-blur border border-border/30 rounded-2xl p-5"
    >
      <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Mezclador de Canales</h3>
      <div className="space-y-3">
        {chans.map((ch) => (
          <div key={ch.id} className="flex items-center gap-3">
            <div className={`w-2 h-8 rounded-full ${ch.color} ${ch.muted ? 'opacity-30' : 'opacity-100'} transition-opacity`} />
            <div className="w-20 flex-shrink-0">
              <p className="text-xs font-medium text-foreground truncate">{ch.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{ch.user}</p>
            </div>
            <div className="flex-1">
              <Slider
                value={[ch.level]}
                onValueChange={(val) => setLevel(ch.id, val)}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-8 text-right">{ch.level}%</span>
            <button onClick={() => toggleMute(ch.id)} className={`p-1.5 rounded-lg transition-colors ${ch.muted ? 'bg-destructive/20 text-destructive' : 'hover:bg-secondary text-muted-foreground'}`}>
              {ch.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => toggleSolo(ch.id)} className={`p-1.5 rounded-lg transition-colors ${ch.solo ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}>
              <Headphones className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}image.png